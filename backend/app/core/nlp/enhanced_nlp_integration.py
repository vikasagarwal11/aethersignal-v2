"""
Enhanced NLP Integration
========================
Parses natural language queries, maps reactions to FDA Preferred Terms,
and routes to the fusion engine via QueryRouter.
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import logging

from app.core.terminology.fda_mapper import FDATerminologyMapper
from app.core.signal_detection.query_router import (
    QueryRouter,
    SignalQuerySpec,
    FusionResultSummary,
)
from app.core.signal_detection.complete_fusion_engine import CompleteFusionEngine
from app.core.signal_detection.metrics_provider import MetricsProvider

logger = logging.getLogger(__name__)


class EnhancedNLPParser:
    """
    Enhanced NLP parser with terminology mapping and fusion routing.
    Extracts drugs, events, and common filters (seriousness, age, sex, time).
    """

    def __init__(
        self,
        fusion_engine: CompleteFusionEngine,
        fda_mapper: FDATerminologyMapper,
        metrics_provider: MetricsProvider,
    ) -> None:
        self.fusion_engine = fusion_engine
        self.fda_mapper = fda_mapper
        self.router = QueryRouter(
            fusion_engine=self.fusion_engine,
            fda_mapper=self.fda_mapper,
            metrics_provider=metrics_provider,
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def parse_and_route(self, query: str, limit: int = 50) -> List[FusionResultSummary]:
        """Parse query → build SignalQuerySpec → route to fusion."""
        q = query.strip()
        drugs = self._extract_drugs(q)
        reactions = self._extract_events(q)

        # Extract all filters
        seriousness_only = "serious" in q.lower()
        time_window = self._extract_time_window(q)
        age_min, age_max = self._extract_age_range(q)
        sex = self._extract_sex(q)
        region_codes = self._extract_geography(q) or []
        sources = self._extract_sources(q)

        spec = SignalQuerySpec(
            task="rank_signals",
            drugs=drugs,
            reactions=reactions,
            seriousness_only=seriousness_only,
            age_min=age_min,
            age_max=age_max,
            region_codes=region_codes,
            time_window=time_window,
            limit=limit,
            raw_text=q,
        )
        return self.router.run_query(spec)

    # ------------------------------------------------------------------
    # Extraction helpers
    # ------------------------------------------------------------------
    def _extract_drugs(self, query: str) -> List[str]:
        patterns = [
            r"\b(warfarin|aspirin|metformin|lisinopril|atorvastatin|ibuprofen|acetaminophen|amlodipine|metoprolol)\b",
            r"(?:drug|medication|medicine)\s+(?:called|named)?\s*([a-z0-9]+)",
            r"on\s+([a-z0-9]+)",
            r"for\s+([a-z0-9]+)\s+(?:adverse|event|reaction)",
        ]
        drugs: List[str] = []
        q = query.lower()
        for pat in patterns:
            drugs.extend(re.findall(pat, q))
        return list({d for d in drugs if d})

    def _extract_events(self, query: str) -> List[str]:
        """
        Extract events with context-aware mapping.
        Uses surrounding words to improve mapping accuracy.
        """
        patterns = [
            r"\b(bleeding|hemorrhage|nausea|headache|dizziness|rash|chest pain|shortness of breath|diarrhea|vomiting|fatigue|pain)\b",
            r"(?:adverse event|reaction|side effect|ae)\s+(?:of|is|was|are|were)\s+([a-z\s]+)",
            r"(?:showing|with|having)\s+([a-z\s]+)\s+(?:symptom|reaction|event)",
        ]
        events: List[str] = []
        q = query.lower()
        for pat in patterns:
            matches = re.findall(pat, q)
            if isinstance(matches, list):
                if matches and isinstance(matches[0], tuple):
                    events.extend([m for tup in matches for m in tup if m])
                else:
                    events.extend(matches)
        
        # Context-aware mapping: use full phrase when available
        mapped: List[str] = []
        for e in events:
            # Try to find context around the event term
            event_lower = e.lower().strip()
            
            # Look for multi-word phrases containing the event
            # e.g., "GI bleeding", "bleeding disorder", "bleeding time"
            context_patterns = [
                rf"\b(?:gi|gastrointestinal|gastric|stomach|intestinal)\s+{re.escape(event_lower)}\b",
                rf"\b{re.escape(event_lower)}\s+(?:disorder|disorders|time|prolonged|tendency|episode|episodes)\b",
                rf"\b(?:upper|lower|internal|external|minor|major|severe|mild)\s+{re.escape(event_lower)}\b",
            ]
            
            context_phrase = None
            for pattern in context_patterns:
                match = re.search(pattern, q)
                if match:
                    context_phrase = match.group(0)
                    break
            
            # Map with context if available, otherwise use term alone
            term_to_map = context_phrase if context_phrase else event_lower
            mt = self.fda_mapper.map_term_with_context(term_to_map, query_context=q)
            
            if mt:
                mapped.append(mt.preferred_term)
            else:
                # Fallback: try without context
                mt_fallback = self.fda_mapper.map_term(event_lower)
                if mt_fallback:
                    mapped.append(mt_fallback.preferred_term)
        
        return list({m for m in mapped if m})

    def _extract_age_range(self, query: str) -> tuple[Optional[int], Optional[int]]:
        """Extract age range from query."""
        q = query.lower()
        # Patterns like "ages 50-70", "over 65", "under 18"
        age_range_match = re.search(r"age[s]?\s+(\d+)\s*-\s*(\d+)", q)
        if age_range_match:
            return int(age_range_match.group(1)), int(age_range_match.group(2))
        
        # "elderly", "seniors", "older patients" → age_min=65
        if any(word in q for word in ["elderly", "senior", "older patients", "65+", "over 65"]):
            return 65, None
        
        # "pediatric", "children", "kids", "under 18" → age_max=18
        if any(word in q for word in ["pediatric", "children", "kids", "under 18", "pediatric"]):
            return None, 18
        
        over_match = re.search(r"(?:over|above|older than)\s+(\d+)", q)
        if over_match:
            return int(over_match.group(1)), None
        
        under_match = re.search(r"(?:under|below|younger than)\s+(\d+)", q)
        if under_match:
            return None, int(under_match.group(1))
        
        return None, None

    def _extract_sex(self, query: str) -> Optional[str]:
        """Extract sex filter from query."""
        q = query.lower()
        if re.search(r"\b(male|men|m)\b", q):
            return "M"
        if re.search(r"\b(female|women|f)\b", q):
            return "F"
        return None

    def _extract_geography(self, query: str) -> Optional[List[str]]:
        """Extract geographic filters from query."""
        q = query.lower()
        geo = []
        
        # Country/region patterns
        if re.search(r"\b(us|usa|united states)\b", q):
            geo.append("US")
        if re.search(r"\b(uk|united kingdom|britain)\b", q):
            geo.append("UK")
        if re.search(r"\b(canada|ca)\b", q):
            geo.append("CA")
        if re.search(r"\b(eu|europe|european)\b", q):
            geo.extend(["DE", "FR", "IT", "ES", "NL"])  # Major EU countries
        if re.search(r"\b(japan|jp)\b", q):
            geo.append("JP")
        if re.search(r"\b(asian|asia)\b", q):
            geo.extend(["CN", "JP", "KR", "IN"])  # Major Asian countries
        
        return geo if geo else None

    def _extract_sources(self, query: str) -> Optional[List[str]]:
        """Extract data sources from query."""
        q = query.lower()
        sources = []
        
        if re.search(r"\bfaers\b", q):
            sources.append("faers")
        if re.search(r"\b(social media|twitter|reddit)\b", q):
            sources.append("social")
        if re.search(r"\b(pubmed|literature|studies)\b", q):
            sources.append("pubmed")
        if re.search(r"\b(clinical trials?|trials?)\b", q):
            sources.append("clinicaltrials")
        if re.search(r"\b(rwe|real world|ehr)\b", q):
            sources.append("rwe")
        
        return sources if sources else None

    def _extract_time_window(self, query: str) -> Optional[str]:
        q = query.lower()
        if "last 6 months" in q:
            return "LAST_6_MONTHS"
        if "last 12 months" in q or "last year" in q:
            return "LAST_12_MONTHS"
        # specific year
        year_match = re.search(r"\b(20\d{2})\b", q)
        if year_match:
            year = year_match.group(1)
            return f"YEAR_{year}"
        return None


# ----------------------------------------------------------------------
# Convenience function
# ----------------------------------------------------------------------
def process_natural_language_query(
    query: str,
    fusion_engine: Optional[CompleteFusionEngine],
    fda_mapper: Optional[FDATerminologyMapper],
    metrics_provider: MetricsProvider,
    limit: int = 50,
) -> List[FusionResultSummary]:
    """Top-level helper to parse and route a query."""
    if fusion_engine is None:
        fusion_engine = CompleteFusionEngine()
    if fda_mapper is None:
        fda_mapper = FDATerminologyMapper()

    parser = EnhancedNLPParser(
        fusion_engine=fusion_engine,
        fda_mapper=fda_mapper,
        metrics_provider=metrics_provider,
    )
    return parser.parse_and_route(query=query, limit=limit)

