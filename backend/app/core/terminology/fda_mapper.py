"""
FDA Terminology Mapper
======================

Maps user's natural language medical terms to FDA Preferred Terms (PTs).
Uses the extracted FAERS terminology (14,921 Preferred Terms) as a free alternative to MedDRA.

This implementation:
- Loads `data/fda_adverse_event_codes_merged.json`
- Supports exact, substring, and fuzzy matching
- Returns a structured MappedTerm with a confidence score

If you move the JSON file, update DEFAULT_TERMS_PATH below.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any
import json
import os
import logging
import difflib

logger = logging.getLogger(__name__)

# Calculate path: from backend/app/core/terminology/fda_mapper.py → project root → data/
# __file__ = backend/app/core/terminology/fda_mapper.py
# dirname(__file__) = backend/app/core/terminology
# dirname(dirname(__file__)) = backend/app/core
# dirname(dirname(dirname(__file__))) = backend/app
# dirname(dirname(dirname(dirname(__file__)))) = backend
# dirname(dirname(dirname(dirname(dirname(__file__))))) = project root
DEFAULT_TERMS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))),  # backend/app/core/terminology → project root
    "data",
    "fda_adverse_event_codes_merged.json",
)


@dataclass
class MappedTerm:
    """
    Result of mapping a user term to an FDA Preferred Term.
    """
    input_term: str
    preferred_term: str
    match_type: str         # "exact" | "case" | "substring" | "fuzzy"
    confidence: float       # 0.0–1.0
    candidates: List[Tuple[str, float]]  # [(term, score), ...] for debugging/search
    metadata: Dict[str, Any]

    def __post_init__(self):
        if self.candidates is None:
            self.candidates = []
        if self.metadata is None:
            self.metadata = {}


class FDATerminologyMapper:
    """
    Maps arbitrary user text terms (e.g., "bleeding", "liver failure")
    to FDA Preferred Terms from FAERS-derived dictionary.

    JSON structure expected (approx):
    {
      "metadata": {...},
      "preferred_terms": {
        "NAUSEA": {"name": "NAUSEA", "frequency": 33058, ...},
        "HEMORRHAGE": {"name": "HEMORRHAGE", "frequency": 1234, ...},
        ...
      }
    }
    """

    def __init__(
        self,
        terms_path: Optional[str] = None,
        min_fuzzy_score: float = 0.6,
        max_candidates: int = 10,
    ) -> None:
        self.terms_path = terms_path or DEFAULT_TERMS_PATH
        self.min_fuzzy_score = min_fuzzy_score
        self.max_candidates = max_candidates
        self._loaded = False
        self._pt_index: Dict[str, Dict[str, Any]] = {}
        self._all_terms_lower: List[str] = []
        self._load_terms()

    # -------------------------------------------------------------------------
    # Internal loading
    # -------------------------------------------------------------------------

    def _load_terms(self) -> None:
        if self._loaded:
            return
        if not os.path.exists(self.terms_path):
            logger.warning(f"FDA terminology file not found at: {self.terms_path}")
            logger.warning("FDA terminology mapping will be disabled. To enable:")
            logger.warning("  1. Extract FAERS codes: python backend/scripts/extract_faers_codes.py <REAC_FILE>")
            logger.warning("  2. Or merge existing files: python backend/scripts/merge_faers_codes.py")
            # Initialize empty index instead of raising error
            self._pt_index = {}
            self._all_terms_lower = []
            self._loaded = True
            return

        try:
            with open(self.terms_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            logger.exception(f"Failed to load FDA terminology JSON: {e}")
            raise

        preferred_terms = data.get("preferred_terms") or {}
        if not isinstance(preferred_terms, dict):
            logger.error("Invalid FDA terminology JSON: 'preferred_terms' is not a dict")
            raise ValueError("Invalid FDA terminology JSON structure")

        # Build lowercase index
        self._pt_index = {}
        for pt_name, info in preferred_terms.items():
            if not isinstance(pt_name, str):
                continue
            key = pt_name.strip().lower()
            if not key:
                continue
            self._pt_index[key] = info or {"name": pt_name}

        self._all_terms_lower = list(self._pt_index.keys())
        self._loaded = True
        logger.info(
            "FDATerminologyMapper loaded %d preferred terms from %s",
            len(self._pt_index),
            self.terms_path,
        )

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    def map_term_with_context(
        self, term: str, query_context: Optional[str] = None
    ) -> Optional[MappedTerm]:
        """
        Map a term with context awareness.
        
        Uses context words to prefer more specific matches:
        - "GI bleeding" → prefers "Gastrointestinal haemorrhage" over "Hemorrhage"
        - "bleeding disorder" → prefers "Bleeding disorder" over "Hemorrhage"
        
        Args:
            term: Term to map
            query_context: Full query for context (optional)
        
        Returns:
            MappedTerm or None
        """
        # Return None if file not loaded (graceful degradation)
        if not self._loaded or not self._pt_index:
            return None
        
        # First try exact match
        result = self.map_term(term)
        if result and result.match_type == "exact":
            return result
        
        # If we have context, boost candidates that match context words
        if query_context:
            context_words = set(re.findall(r'\b[a-z]{3,}\b', query_context.lower()))
            
            # Find all candidates
            candidates = self._find_all_candidates(term)
            if not candidates:
                return self.map_term(term)  # Fallback to standard mapping
            
            # Score candidates based on context overlap
            scored_candidates = []
            for cand_name, base_score in candidates:
                cand_lower = cand_name.lower()
                cand_words = set(re.findall(r'\b[a-z]{3,}\b', cand_lower))
                
                # Context boost: how many context words appear in candidate?
                context_overlap = len(context_words & cand_words)
                context_boost = min(0.3, context_overlap * 0.1)  # Max 0.3 boost
                
                # Prefer longer, more specific terms that match context
                specificity_boost = len(cand_words) * 0.05  # Longer terms get slight boost
                
                final_score = base_score + context_boost + specificity_boost
                scored_candidates.append((cand_name, final_score))
            
            # Sort by final score
            scored_candidates.sort(key=lambda x: x[1], reverse=True)
            
            if scored_candidates:
                best_name, best_score = scored_candidates[0]
                info = self._pt_index.get(best_name.lower(), {"name": best_name})
                return MappedTerm(
                    input_term=term,
                    preferred_term=best_name,
                    match_type="context_aware",
                    confidence=min(1.0, best_score),
                    candidates=self._trim_candidates(scored_candidates),
                    metadata=info,
                )
        
        # Fallback to standard mapping
        return self.map_term(term)
    
    def _find_all_candidates(self, term: str) -> List[Tuple[str, float]]:
        """Find all candidate matches for a term (used by context-aware mapping)."""
        clean = term.strip().lower()
        candidates: List[Tuple[str, float]] = []
        
        # Find substring matches
        for pt_key, info in self._pt_index.items():
            name = info.get("name") or pt_key
            name_lower = pt_key
            
            if clean in name_lower or name_lower in clean:
                overlap_len = min(len(clean), len(name_lower))
                base_score = overlap_len / max(len(clean), len(name_lower))
                freq = float(info.get("frequency") or 1.0)
                freq_weight = 1.0 + (freq / (freq + 1000.0))
                score = base_score * freq_weight
                candidates.append((name, score))
        
        return candidates
    
    def map_term(self, term: str) -> Optional[MappedTerm]:
        """
        Map a free-text term to the closest FDA Preferred Term.

        Strategy:
        1. Exact match (case-insensitive)
        2. Substring match (user term in PT or PT in user term)
        3. Fuzzy match using difflib SequenceMatcher

        Returns:
            MappedTerm or None if no reasonable match found or file not loaded.
        """
        # Return None if file not loaded (graceful degradation)
        if not self._loaded or not self._pt_index:
            return None
        if not term:
            return None

        original = term
        clean = term.strip().lower()

        if not clean:
            return None

        # 1) Exact (case-insensitive) match
        if clean in self._pt_index:
            info = self._pt_index[clean]
            return MappedTerm(
                input_term=original,
                preferred_term=info.get("name") or clean.upper(),
                match_type="exact",
                confidence=1.0,
                candidates=[(info.get("name") or clean.upper(), 1.0)],
                metadata=info,
            )

        # 2) Substring match (user term appears inside PT or vice versa)
        substring_candidates: List[Tuple[str, float]] = []
        for pt_key, info in self._pt_index.items():
            name = info.get("name") or pt_key
            name_lower = pt_key

            if clean in name_lower or name_lower in clean:
                # simple heuristic: longer overlap gets higher score
                overlap_len = min(len(clean), len(name_lower))
                base_score = overlap_len / max(len(clean), len(name_lower))
                freq = float(info.get("frequency") or 1.0)
                freq_weight = 1.0 + (freq / (freq + 1000.0))  # 1–2
                score = base_score * freq_weight
                substring_candidates.append((name, score))

        if substring_candidates:
            substring_candidates.sort(key=lambda x: x[1], reverse=True)
            best_name, best_score = substring_candidates[0]
            if best_score >= 0.8:
                info = self._pt_index[best_name.lower()]
                return MappedTerm(
                    input_term=original,
                    preferred_term=best_name,
                    match_type="substring",
                    confidence=min(1.0, best_score),
                    candidates=self._trim_candidates(substring_candidates),
                    metadata=info,
                )

        # 3) Fuzzy match using difflib
        # We use PT names as the corpus
        pt_names = [self._pt_index[k].get("name") or k for k in self._all_terms_lower]
        close = difflib.get_close_matches(
            clean,
            pt_names,
            n=self.max_candidates,
            cutoff=self.min_fuzzy_score,
        )

        if not close:
            return None

        # Compute ratio scores
        scored: List[Tuple[str, float]] = []
        for cand in close:
            ratio = difflib.SequenceMatcher(None, clean, cand.lower()).ratio()
            scored.append((cand, ratio))

        scored.sort(key=lambda x: x[1], reverse=True)
        best_name, best_score = scored[0]

        if best_score < self.min_fuzzy_score:
            return None

        info = self._pt_index.get(best_name.lower(), {"name": best_name})
        return MappedTerm(
            input_term=original,
            preferred_term=best_name,
            match_type="fuzzy",
            confidence=float(best_score),
            candidates=self._trim_candidates(scored),
            metadata=info,
        )

    def search_terms(self, query: str, limit: int = 10) -> List[Tuple[str, float]]:
        """
        Search for PTs matching a partial query.

        Useful for UI autocomplete and debugging.

        Returns:
            List[(preferred_term, score)] sorted by score desc.
        """
        if not query:
            return []

        q = query.strip().lower()
        if not q:
            return []

        scored: List[Tuple[str, float]] = []
        for key, info in self._pt_index.items():
            name = info.get("name") or key
            name_lower = name.lower()

            # simple partial match score
            if q in name_lower:
                overlap = len(q) / len(name_lower)
                freq = float(info.get("frequency") or 1.0)
                freq_weight = 1.0 + (freq / (freq + 1000.0))
                score = overlap * freq_weight
                scored.append((name, score))
            else:
                # fallback to fuzzy ratio
                ratio = difflib.SequenceMatcher(None, q, name_lower).ratio()
                if ratio >= self.min_fuzzy_score:
                    scored.append((name, ratio))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:limit]

    def batch_map(self, terms: List[str]) -> Dict[str, Optional[MappedTerm]]:
        """
        Map a list of terms. Returns a dict: input_term → MappedTerm | None
        """
        results: Dict[str, Optional[MappedTerm]] = {}
        for t in terms:
            results[t] = self.map_term(t)
        return results

    # -------------------------------------------------------------------------
    # Helpers
    # -------------------------------------------------------------------------

    def _trim_candidates(self, candidates: List[Tuple[str, float]]) -> List[Tuple[str, float]]:
        return candidates[: self.max_candidates]
