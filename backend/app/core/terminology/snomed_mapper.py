"""
SNOMED CT Terminology Mapper
============================
Maps user's natural language medical terms to SNOMED CT concepts using semantic relationships.

Uses SQLite database for efficient lookups and memory efficiency.
"""

from __future__ import annotations

import sqlite3
import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any
import os
import logging
from functools import lru_cache

from .fda_mapper import MappedTerm  # Reuse MappedTerm dataclass

logger = logging.getLogger(__name__)

# Default path: data/snomed_ct.db relative to project root
# __file__ is: backend/app/core/terminology/snomed_mapper.py
# Need to go up 5 levels: snomed_mapper.py → terminology → core → app → backend → project root
_project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
DEFAULT_DB_PATH = os.path.join(_project_root, "data", "snomed_ct.db")

# SNOMED CT Type IDs
TYPE_SYNONYM = 900000000000013009
TYPE_FULLY_SPECIFIED_NAME = 900000000000003001

# SNOMED CT Relationship Type IDs
RELATIONSHIP_IS_A = 116680003


@dataclass
class SNOMEDConcept:
    """SNOMED CT concept with relationships."""
    concept_id: int
    term: str
    synonyms: List[str]
    parent_concepts: List[int]
    child_concepts: List[int]


class SNOMEDCTMapper:
    """
    Maps terms using SNOMED CT semantic relationships.
    Uses SQLite database for efficient lookups.
    """

    def __init__(
        self,
        db_path: Optional[str] = None,
        cache_size: int = 10000,
    ) -> None:
        self.db_path = db_path or DEFAULT_DB_PATH
        self.cache_size = cache_size
        
        if not os.path.exists(self.db_path):
            logger.error(f"SNOMED CT database not found at: {self.db_path}")
            raise FileNotFoundError(
                f"SNOMED CT database not found. Run load_snomed_ct.py first."
            )
        
        # Connect to database
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row  # Dict-like rows
        
        logger.info(f"SNOMED CT mapper initialized from {self.db_path}")

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    @lru_cache(maxsize=10000)
    def map_term(
        self, 
        term: str, 
        context: Optional[str] = None
    ) -> Optional[MappedTerm]:
        """
        Map a free-text term to SNOMED CT concept.

        Strategy:
        1. Find concepts with matching term (indexed lookup)
        2. Use context to disambiguate (if provided)
        3. Use semantic relationships to find best match
        4. Return concept with confidence score

        Args:
            term: Term to map
            context: Optional context from query for disambiguation

        Returns:
            MappedTerm or None if no match found
        """
        if not term:
            return None

        term_lower = term.strip().lower()
        if not term_lower:
            return None

        # Find all concepts with matching term (indexed lookup - fast!)
        candidates = self._find_concepts_by_term(term_lower)
        
        if not candidates:
            # Try fuzzy match
            return self._fuzzy_match(term_lower)
        
        if len(candidates) == 1:
            # Single match - return it
            return self._build_mapped_term(term, candidates[0], context)
        
        # Multiple matches - use context to disambiguate
        if context:
            return self._disambiguate_with_context(candidates, context, term)
        
        # No context - return most common (by concept hierarchy)
        return self._select_best_match(candidates, term)

    def get_concept_hierarchy(self, concept_id: int, max_depth: int = 3) -> List[int]:
        """Get parent concepts (IS-A relationships) up to max_depth."""
        hierarchy = []
        current_id = concept_id
        depth = 0
        
        while depth < max_depth:
            cursor = self.conn.execute("""
                SELECT destination_id FROM snomed_relationships
                WHERE source_id = ? 
                  AND type_id = ?
                  AND active = 1
                LIMIT 1
            """, (current_id, RELATIONSHIP_IS_A))
            
            row = cursor.fetchone()
            if not row:
                break
            
            parent_id = row['destination_id']
            if parent_id == current_id:  # Prevent infinite loops
                break
            
            hierarchy.append(parent_id)
            current_id = parent_id
            depth += 1
        
        return hierarchy

    def get_concept_synonyms(self, concept_id: int) -> List[str]:
        """Get all synonyms for a concept."""
        cursor = self.conn.execute("""
            SELECT term FROM snomed_descriptions
            WHERE concept_id = ? 
              AND active = 1
              AND type_id = ?
        """, (concept_id, TYPE_SYNONYM))
        
        return [row['term'] for row in cursor.fetchall()]

    # -------------------------------------------------------------------------
    # Internal helpers
    # -------------------------------------------------------------------------

    def _find_concepts_by_term(self, term_lower: str) -> List[sqlite3.Row]:
        """Find concepts by term (indexed lookup)."""
        cursor = self.conn.execute("""
            SELECT DISTINCT 
                d.concept_id,
                d.term,
                d.type_id,
                c.active
            FROM snomed_descriptions d
            JOIN snomed_concepts c ON d.concept_id = c.concept_id
            WHERE LOWER(d.term) = ?
              AND d.active = 1
              AND c.active = 1
            ORDER BY d.type_id DESC  -- Prefer FSN over synonyms
            LIMIT 20
        """, (term_lower,))
        
        return cursor.fetchall()

    def _disambiguate_with_context(
        self,
        candidates: List[sqlite3.Row],
        context: str,
        original_term: str
    ) -> Optional[MappedTerm]:
        """Use context words to find best matching concept."""
        context_words = set(re.findall(r'\b[a-z]{3,}\b', context.lower()))
        
        if not context_words:
            return self._select_best_match(candidates, original_term)
        
        best_score = 0
        best_candidate = None
        
        for candidate in candidates:
            concept_id = candidate['concept_id']
            
            # Get all terms for this concept
            synonyms = self.get_concept_synonyms(concept_id)
            concept_terms = [candidate['term']] + synonyms
            
            # Extract words from concept terms
            concept_words = set()
            for term in concept_terms:
                concept_words.update(re.findall(r'\b[a-z]{3,}\b', term.lower()))
            
            # Score: how many context words match concept words?
            overlap = len(context_words & concept_words)
            score = overlap / max(len(context_words), 1)
            
            # Boost if context word appears in concept term
            for cw in context_words:
                for ct in concept_terms:
                    if cw in ct.lower():
                        score += 0.2  # Boost for direct match
            
            if score > best_score:
                best_score = score
                best_candidate = candidate
        
        if best_candidate and best_score > 0.3:  # Minimum threshold
            return self._build_mapped_term(original_term, best_candidate, context)
        
        # Fallback to best match
        return self._select_best_match(candidates, original_term)

    def _select_best_match(
        self,
        candidates: List[sqlite3.Row],
        original_term: str
    ) -> Optional[MappedTerm]:
        """Select best match from candidates (prefer FSN, then most specific)."""
        # Prefer Fully Specified Name (FSN) over synonyms
        fsn_candidates = [c for c in candidates if c['type_id'] == TYPE_FULLY_SPECIFIED_NAME]
        if fsn_candidates:
            return self._build_mapped_term(original_term, fsn_candidates[0])
        
        # Otherwise, return first candidate
        if candidates:
            return self._build_mapped_term(original_term, candidates[0])
        
        return None

    def _build_mapped_term(
        self,
        input_term: str,
        candidate: sqlite3.Row,
        context: Optional[str] = None
    ) -> MappedTerm:
        """Build MappedTerm from candidate."""
        concept_id = candidate['concept_id']
        preferred_term = candidate['term']
        
        # Get synonyms for candidates list
        synonyms = self.get_concept_synonyms(concept_id)
        candidates_list = [(preferred_term, 1.0)] + [(s, 0.9) for s in synonyms[:5]]
        
        # Get hierarchy for metadata
        hierarchy = self.get_concept_hierarchy(concept_id, max_depth=2)
        
        metadata = {
            "concept_id": concept_id,
            "hierarchy": hierarchy,
            "synonyms": synonyms[:10],
        }
        
        # Confidence based on match type
        if candidate['type_id'] == TYPE_FULLY_SPECIFIED_NAME:
            confidence = 0.95
        else:
            confidence = 0.85
        
        # Boost if context was used
        if context:
            confidence = min(1.0, confidence + 0.05)
        
        return MappedTerm(
            input_term=input_term,
            preferred_term=preferred_term,
            match_type="snomed_ct",
            confidence=confidence,
            candidates=candidates_list,
            metadata=metadata,
        )

    def _fuzzy_match(self, term_lower: str) -> Optional[MappedTerm]:
        """Fuzzy match using LIKE query (fallback)."""
        cursor = self.conn.execute("""
            SELECT DISTINCT 
                d.concept_id,
                d.term,
                d.type_id
            FROM snomed_descriptions d
            JOIN snomed_concepts c ON d.concept_id = c.concept_id
            WHERE LOWER(d.term) LIKE ?
              AND d.active = 1
              AND c.active = 1
            ORDER BY d.type_id DESC
            LIMIT 5
        """, (f"%{term_lower}%",))
        
        candidates = cursor.fetchall()
        if candidates:
            return self._build_mapped_term(term_lower, candidates[0])
        
        return None

    def search_terms(self, query: str, limit: int = 10) -> List[Tuple[str, float]]:
        """
        Search for SNOMED CT terms matching a partial query.
        Useful for UI autocomplete.
        """
        if not query:
            return []
        
        q = query.strip().lower()
        if not q:
            return []
        
        cursor = self.conn.execute("""
            SELECT DISTINCT term, concept_id
            FROM snomed_descriptions
            WHERE LOWER(term) LIKE ?
              AND active = 1
            ORDER BY 
                CASE WHEN LOWER(term) = ? THEN 1 ELSE 2 END,
                LENGTH(term)
            LIMIT ?
        """, (f"%{q}%", q, limit))
        
        results = []
        seen_concepts = set()
        
        for row in cursor.fetchall():
            concept_id = row['concept_id']
            if concept_id not in seen_concepts:
                results.append((row['term'], 1.0))
                seen_concepts.add(concept_id)
        
        return results

    def batch_map(self, terms: List[str]) -> Dict[str, Optional[MappedTerm]]:
        """Map a list of terms."""
        results = {}
        for term in terms:
            results[term] = self.map_term(term)
        return results

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()

