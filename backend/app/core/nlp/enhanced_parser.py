from __future__ import annotations

from typing import Optional, Tuple, List, Dict
import re

from app.core.analysis.models import (
    SignalQueryFilters,
    DimensionFilter,
    QueryConfirmation,
)
from app.core.terminology.fda_mapper import FDATerminologyMapper
from app.core.terminology.snomed_mapper import SNOMEDCTMapper  # you already have this


class ConversationalQueryInterpreter:
    """
    Interprets a natural-language query into SignalQueryFilters.

    IMPORTANT:
    - Phase 1 implementation is rule-based + terminology mapping.
    - You can later plug in LLM-based parsing, but keep this interface stable.
    """

    def __init__(
        self,
        fda_mapper: Optional[FDATerminologyMapper] = None,
        snomed_mapper: Optional[SNOMEDCTMapper] = None,
    ) -> None:
        self.fda_mapper = fda_mapper or FDATerminologyMapper()
        # SNOMED is optional (large DB, may not be available everywhere)
        self.snomed_mapper = snomed_mapper

    # ------------------- public -------------------

    def interpret(
        self,
        query: str,
        previous_filters: Optional[SignalQueryFilters],
        refinement_mode: bool,
    ) -> Tuple[SignalQueryFilters, QueryConfirmation]:
        """
        Main entry:

        - Takes raw query text
        - Optionally previous filters (for refinement)
        - Returns new filters + a confirmation object
        """

        text = query.lower()

        # 1.5) Detect intent FIRST (count, comparison, trend, negation)
        intent = self._detect_intent(text)
        
        # 1) Start from previous or fresh filters
        # IMPORTANT: For count queries, don't carry forward previous filters
        # Count queries like "how many cases are there?" should be fresh queries
        if intent.get("count_query"):
            # Reset filters for count queries - they want total count, not filtered count
            filters = SignalQueryFilters()
            filters.refinement_mode = False
            filters.raw_text = query
        elif previous_filters and refinement_mode:
            filters = previous_filters.copy(deep=True)
            filters.refinement_mode = True
            filters.previous_raw_text = previous_filters.raw_text
        else:
            filters = SignalQueryFilters()
            filters.refinement_mode = False

        filters.raw_text = query
        
        # 1.6) Detect refinement intent (replace vs append)
        # Skip refinement logic for count queries
        if refinement_mode and previous_filters and not intent.get("count_query"):
            refinement_intent = self._detect_refinement_intent(query)
            if refinement_intent["replace"]:
                # Clear the dimension to be replaced
                if refinement_intent["replace_dimension"] == "events":
                    filters.events = DimensionFilter(values=[], operator="OR")
                elif refinement_intent["replace_dimension"] == "drugs":
                    filters.drugs = DimensionFilter(values=[], operator="OR")

        # 2) Extract drugs (NEW - was missing!)
        self._extract_drugs(query, text, filters)  # Pass original query for capitalized word detection

        # 3) seriousness / outcome dimension
        self._extract_seriousness(text, filters)

        # 4) events / reactions (enhanced - no hardcoded keywords)
        self._extract_events(text, filters)

        # 5) simple demographics + time (you can extend)
        self._extract_demographics_and_time(text, filters)
        
        # Store intent for later use
        filters.intent = intent.get("type", "filter")
        try:
            filters.intent_details = intent
        except Exception:
            # If the model disallows dynamic attrs, skip
            pass

        # 5) Build human-readable description & logic string
        human, logic = self._build_descriptions(filters)

        confirmation = QueryConfirmation(
            filters=filters,
            human_readable=human,
            logic_expression=logic,
            estimated_count=None,  # You can fill this later with a fast pre-count
        )
        try:
            confirmation.intent = intent
        except Exception:
            # If the model disallows dynamic attrs, skip
            pass

        return filters, confirmation

    # ------------------- extraction helpers -------------------

    def _extract_drugs(self, query: str, text: str, filters: SignalQueryFilters) -> None:
        """
        Extract drug names using:
        1. Context patterns (after "drug", "medication", etc.)
        2. FDA mapper (if available)
        3. Capitalized terms
        """
        drugs: List[str] = []
        
        # Pattern 1: After context keywords
        drug_patterns = [
            r'(?:drug|medication|product|substance)[\s:]+([a-z0-9\s\-]+?)(?:\.|,|$|\s+and|\s+or)',
            r'(?:show|find|search|filter|cases with|reports for)[\s]+([a-z0-9\s\-]+?)(?:\s+and|\s+or|\.|,|$)',
            r'^([a-z0-9\s\-]+?)(?:\s+and|\s+or|\s+reaction|\s+event)',
        ]
        
        for pattern in drug_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                drug = match.strip()
                if len(drug) > 2 and drug not in ['the', 'all', 'any', 'for', 'with', 'cases', 'reports']:
                    # Try to map via FDA mapper (though drugs may not be in FDA terms)
                    # For now, just use the extracted term
                    if drug not in drugs:
                        drugs.append(drug)
        
        # Pattern 2: Capitalized terms (common drug names)
        # Extract capitalized words that might be drugs
        capitalized_words = re.findall(r'\b([A-Z][a-z]+)\b', query)
        for word in capitalized_words:
            if len(word) > 3 and word.lower() not in ['The', 'And', 'Or', 'For', 'With', 'Cases', 'Reports']:
                if word.lower() not in [d.lower() for d in drugs]:
                    drugs.append(word)
        
        # Ensure dimension exists
        if filters.drugs is None:
            filters.drugs = DimensionFilter(values=[], operator="OR")

        # Merge with previous drugs
        prev = filters.drugs.values.copy() if filters.drugs else []
        for drug in drugs:
            if drug not in prev:
                prev.append(drug)
        
        if prev:
            filters.drugs = DimensionFilter(
                values=prev,
                operator="OR",
                merge_strategy="APPEND",
            )

    def _extract_seriousness(self, text: str, filters: SignalQueryFilters) -> None:
        serious_terms = ["serious", "hospitalization", "life-threatening", "icu"]
        death_terms = ["death", "fatal", "died"]

        # Ensure dimension exists
        if filters.seriousness_or_outcome is None:
            filters.seriousness_or_outcome = DimensionFilter(values=[], operator="OR")

        s_values: List[str] = filters.seriousness_or_outcome.values.copy()

        if any(t in text for t in serious_terms):
            if "serious" not in s_values:
                s_values.append("serious")
        if any(t in text for t in death_terms):
            if "death" not in s_values:
                s_values.append("death")

        if s_values:
            filters.seriousness_or_outcome = DimensionFilter(
                values=s_values,
                operator="OR",
                merge_strategy="APPEND",
            )

    def _extract_events(self, text: str, filters: SignalQueryFilters) -> None:
        """
        Extract events using FDA mapper for ANY medical term.
        No hardcoded keywords - use terminology mapping.
        """
        new_events: List[str] = []

        # Ensure dimension exists
        if filters.events is None:
            filters.events = DimensionFilter(values=[], operator="OR")
        
        # Strategy 1: Extract after "reaction", "event", "adverse event", etc.
        reaction_patterns = [
            r'\b(?:reaction|adverse event|ae|event|adr|side effect)[\s:]+([a-z0-9\s\-]+?)(?:\.|,|$|\s+and|\s+or)',
            r'(?:with|having|showing|including)[\s]+([a-z0-9\s\-]+?)(?:\s+reaction|\s+event|\.|,|$)',
            r'case[s]?\s+(?:with|having|showing)\s+([a-z0-9\s\-]+?)(?:\.|,|$|\s+and|\s+or)',
        ]
        
        for pattern in reaction_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                event_term = match.strip()
                if len(event_term) > 2:
                    mapped = self._map_to_preferred_term(event_term)
                    if mapped and mapped not in new_events:
                        new_events.append(mapped)
        
        # Strategy 2: Try FDA mapper for any noun/medical term (3+ letter words)
        # BUT: Only if we have explicit medical context (don't map random words)
        # Extract all potential medical terms
        words = re.findall(r'\b([a-z]{3,})\b', text)
        stop_words = {'the', 'and', 'or', 'for', 'with', 'cases', 'reports', 'show', 'find', 
                     'search', 'filter', 'all', 'any', 'some', 'how', 'many', 'what', 'about',
                     'there', 'are', 'have', 'has', 'been', 'were', 'was', 'this', 'that',
                     'these', 'those', 'from', 'previous', 'filters', 'continuing'}
        
        # Only try mapping if we have medical context keywords
        has_medical_context = any(keyword in text for keyword in [
            'case', 'reaction', 'event', 'adverse', 'side', 'effect', 'symptom',
            'drug', 'medication', 'treatment', 'patient', 'bleeding', 'pain', 'fever'
        ])
        
        if has_medical_context:
            for word in words:
                if word in stop_words:
                    continue
                
                # Try FDA mapper
                mapped = self._map_to_preferred_term(word)
                # Only add if mapper found a HIGH CONFIDENCE match and it's different from input
                if mapped and mapped != word and mapped not in new_events:
                    # Double-check confidence via mapper
                    mt = self.fda_mapper.map_term(word)
                    if mt and mt.confidence >= 0.8:  # Higher threshold to avoid random matches
                        new_events.append(mapped)

        # Merge with previous events
        prev = filters.events.values.copy() if filters.events else []
        for ev in new_events:
            if ev not in prev:
                prev.append(ev)

        if prev:
            filters.events = DimensionFilter(
                values=prev,
                operator="OR",
                merge_strategy="APPEND",
            )

    def _extract_demographics_and_time(self, text: str, filters: SignalQueryFilters) -> None:
        if "elderly" in text or "over 65" in text:
            filters.age_min = 65
        if "pediatric" in text or "children" in text:
            filters.age_max = 17

        if "female" in text or "women" in text:
            filters.sex = "F"
        if "male" in text or "men" in text:
            filters.sex = "M"

        if "last 6 months" in text or "past 6 months" in text:
            filters.time_window = "LAST_6_MONTHS"
        elif "last year" in text or "past year" in text:
            filters.time_window = "LAST_12_MONTHS"

    # ------------------- terminology mapping -------------------

    def _map_to_preferred_term(self, raw: str) -> str:
        """
        Try FDA first, then SNOMED, then fall back to raw.
        """
        mt = self.fda_mapper.map_term(raw)
        if mt and mt.confidence >= 0.7:
            return mt.preferred_term

        if self.snomed_mapper is not None:
            sn = self.snomed_mapper.map_term(raw)
            if sn and sn.confidence >= 0.7:
                return sn.preferred_term

        return raw

    # ------------------- intent detection -------------------

    def _detect_intent(self, text: str) -> Dict:
        """
        Detect query intent:
        - count: "how many cases"
        - comparison: "compare X vs Y"
        - trend: "is X increasing"
        - negation: "without X"
        """
        intent = {
            "type": "filter",  # default
            "count_query": False,
            "comparison": None,
            "trend": None,
            "negation": [],
        }
        
        # Count query
        if re.search(r'\b(how\s+many|what\s+is\s+the\s+count|count|number\s+of|total)\b', text, re.IGNORECASE):
            intent["count_query"] = True
            intent["type"] = "count"
        
        # Comparison
        compare_match = re.search(
            r'\b(?:compare|comparison|versus|vs\.?)\s+(?:drug\s+)?([a-z0-9\s\-]+?)\s+(?:vs\.?|versus|and|with)\s+(?:drug\s+)?([a-z0-9\s\-]+?)',
            text,
            re.IGNORECASE
        )
        if compare_match:
            intent["comparison"] = {
                "drug1": compare_match.group(1).strip(),
                "drug2": compare_match.group(2).strip(),
            }
            intent["type"] = "comparison"
        
        # Trend
        trend_match = re.search(
            r'\b(is|are|has|have)\s+([a-z0-9\s\-]+?)\s+(increasing|decreasing|rising|falling|trending)',
            text,
            re.IGNORECASE
        )
        if trend_match:
            intent["trend"] = {
                "subject": trend_match.group(2).strip(),
                "direction": trend_match.group(3).strip(),
            }
            intent["type"] = "trend"
        
        # Negation
        negation_patterns = [
            r'(?:no|not|without|excluding)[\s]+([a-z0-9\s\-]+?)(?:\s+reaction|\s+event|\.|,|$)',
        ]
        for pattern in negation_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            intent["negation"].extend([m.strip() for m in matches])
        
        return intent

    def _detect_refinement_intent(self, query: str) -> Dict:
        """
        Detect if refinement is REPLACE or APPEND.
        
        REPLACE patterns:
        - "how about X"
        - "change to X"
        - "instead of X"
        - "replace X with Y"
        
        APPEND patterns:
        - "also X"
        - "and X"
        - "plus X"
        """
        text = query.lower()
        
        replace_patterns = [
            r'\b(how\s+about|change\s+to|instead\s+of|replace\s+\w+\s+with)\b',
        ]
        
        append_patterns = [
            r'\b(also|and|plus|additionally)\b',
        ]
        
        is_replace = any(re.search(p, text) for p in replace_patterns)
        is_append = any(re.search(p, text) for p in append_patterns)
        
        # Determine which dimension to replace
        replace_dimension = None
        if is_replace:
            if "event" in text or "reaction" in text or any(word in text for word in ["pain", "fever", "bleeding", "nausea"]):
                replace_dimension = "events"
            elif "drug" in text or "medication" in text:
                replace_dimension = "drugs"
        
        return {
            "replace": is_replace and not is_append,
            "append": is_append,
            "replace_dimension": replace_dimension,
        }

    # ------------------- description helpers -------------------

    def _build_descriptions(self, filters: SignalQueryFilters) -> tuple[str, str]:
        """
        Builds natural language descriptions:
          - human_readable: "Cases with aspirin and bleeding"
          - logic_expression: "(aspirin) AND (bleeding)"
        """
        parts_human = []
        parts_logic = []

        # Drugs
        if filters.drugs and filters.drugs.values:
            drugs_str = ", ".join(filters.drugs.values[:2])
            if len(filters.drugs.values) > 2:
                drugs_str += f" and {len(filters.drugs.values) - 2} more"
            parts_human.append(f"cases with {drugs_str}")
            parts_logic.append(f"({' OR '.join(filters.drugs.values)})")

        # Events
        if filters.events and filters.events.values:
            events_str = ", ".join(filters.events.values[:2])
            if len(filters.events.values) > 2:
                events_str += f" and {len(filters.events.values) - 2} more"
            if not parts_human:
                parts_human.append(f"cases with {events_str}")
            else:
                parts_human.append(f"{events_str}")
            parts_logic.append(f"({' OR '.join(filters.events.values)})")

        # Seriousness/outcome
        if filters.seriousness_or_outcome and filters.seriousness_or_outcome.values:
            values = filters.seriousness_or_outcome.values
            if "serious" in values and "death" in values:
                parts_human.append("serious cases or deaths")
            elif "serious" in values:
                parts_human.append("serious cases")
            elif "death" in values:
                parts_human.append("deaths")
            parts_logic.append(f"({' OR '.join(values)})")

        # Age
        if filters.age_min or filters.age_max:
            if filters.age_min and filters.age_max:
                s = f"age {filters.age_min}-{filters.age_max}"
            elif filters.age_min:
                s = f"age >= {filters.age_min}"
            else:
                s = f"age <= {filters.age_max}"
            parts_human.append(s)
            parts_logic.append(f"({s})")

        # Time window
        if filters.time_window:
            time_map = {
                "LAST_6_MONTHS": "last 6 months",
                "LAST_12_MONTHS": "last 12 months",
                "LAST_24_MONTHS": "last 24 months",
            }
            time_str = time_map.get(filters.time_window, filters.time_window.lower().replace("_", " "))
            parts_human.append(f"in {time_str}")
            parts_logic.append(f"(time_window = {filters.time_window})")

        if not parts_human:
            return "All cases", "TRUE"

        # Build natural language
        human_readable = " ".join(parts_human)
        logic_expr = " AND ".join(parts_logic)
        return human_readable, logic_expr


# ------------------- Fusion bridge helper -------------------

def run_fusion_for_filters(filters: SignalQueryFilters) -> List:
    """
    Helper function to run fusion engine for SignalQueryFilters.
    
    Converts filters to SignalQuerySpec and routes through QueryRouter.
    """
    from app.core.signal_detection.query_router import QueryRouter
    from app.core.signal_detection.complete_fusion_engine import CompleteFusionEngine
    from app.core.signal_detection.metrics_provider import create_supabase_metrics_provider
    import os
    from supabase import create_client
    
    # Initialize Supabase client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase credentials not configured")
    
    supabase = create_client(supabase_url, supabase_key)
    
    # Initialize fusion engine and router
    fusion_engine = CompleteFusionEngine()
    metrics_provider = create_supabase_metrics_provider(supabase)
    query_router = QueryRouter(
        fusion_engine=fusion_engine,
        metrics_provider=metrics_provider
    )
    
    # Convert filters to spec and run query
    spec = filters.to_signal_query_spec()
    return query_router.run_query(spec)
