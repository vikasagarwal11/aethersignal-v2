"""
Query Router - NLP → Fusion Bridge
===================================

Routes natural language query intents/filters to the fusion engine.

This module is intentionally engine- and DB-agnostic:
- It does NOT directly talk to Supabase or Pandas.
- Instead, you inject a `metrics_provider` callable that knows how to
  fetch counts, dates, seriousness, sources, etc. for (drug, event).

High-level flow:
1. NLP (or ai_query) produces a `SignalQuerySpec` or filters dict.
2. QueryRouter:
   - Uses FDATerminologyMapper to normalize reaction terms.
   - Builds candidate (drug, event) pairs.
   - Calls `metrics_provider(drug, event, spec)` for evidence.
   - Calls `fusion_engine.detect_signal(**evidence)`.
   - Returns ranked results with fusion scores and simple explanations.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any, Callable, Tuple
from datetime import datetime
import logging

from pydantic import BaseModel, Field

from app.core.terminology.fda_mapper import FDATerminologyMapper, MappedTerm
from app.core.signal_detection.complete_fusion_engine import CompleteFusionEngine

logger = logging.getLogger(__name__)

# -------------------------------------------------------------------------
# Intent / filters model
# -------------------------------------------------------------------------

class SignalQuerySpec(BaseModel):
    """
    Structured representation of what the user is asking for.

    This can be produced by:
    - rule-based parser,
    - LLM,
    - or a mix.

    Fields are intentionally generic to cover most use-cases.
    """
    task: str = Field(
        "rank_signals",
        description="Task type: rank_signals | summarize | compare | explore",
    )
    drugs: List[str] = Field(default_factory=list)
    reactions: List[str] = Field(default_factory=list)
    seriousness_only: bool = False
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    region_codes: List[str] = Field(default_factory=list)
    time_window: Optional[str] = Field(
        default=None,
        description="e.g. LAST_6_MONTHS, LAST_12_MONTHS, SINCE_2020, etc.",
    )
    limit: int = Field(
        default=50,
        description="Maximum number of signals to return",
    )
    raw_text: Optional[str] = Field(
        default=None,
        description="Original user query (for traceability)",
    )


@dataclass
class FusionResultSummary:
    """
    Lightweight view of a fused signal for the query result.
    """
    drug: str
    event: str
    fusion_score: float
    alert_level: str
    quantum_score_layer1: Optional[float] = None
    quantum_score_layer2: Optional[float] = None
    classical_score: Optional[float] = None
    explanation: Optional[str] = None
    components: Dict[str, Any] = None

    def __post_init__(self):
        if self.components is None:
            self.components = {}

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# Type alias: metrics_provider takes (drug, event, spec) → evidence dict for fusion
MetricsProvider = Callable[[str, str, SignalQuerySpec], Dict[str, Any]]


# -------------------------------------------------------------------------
# Query Router
# -------------------------------------------------------------------------

class QueryRouter:
    """
    Bridges NLP → Fusion:
    - input: SignalQuerySpec (structured intent / filters)
    - output: list of FusionResultSummary, ranked by fusion_score

    It **does not** know about Supabase or how evidence is built;
    that's the job of the injected `metrics_provider`.
    """

    def __init__(
        self,
        fusion_engine: CompleteFusionEngine,
        fda_mapper: Optional[FDATerminologyMapper] = None,
        metrics_provider: Optional[MetricsProvider] = None,
    ) -> None:
        self.fusion_engine = fusion_engine
        self.fda_mapper = fda_mapper or FDATerminologyMapper()
        self.metrics_provider: MetricsProvider = metrics_provider or self._default_metrics_provider

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run_query(
        self,
        spec: SignalQuerySpec,
    ) -> List[FusionResultSummary]:
        """
        Main entry point: take a SignalQuerySpec and return ranked signals.
        """
        # 1) Normalize reactions via FDA mapper
        mapped_reactions = self._normalize_reactions(spec.reactions)

        # 2) Build candidate (drug, event) pairs
        candidates = self._build_candidate_pairs(spec.drugs, mapped_reactions)

        if not candidates:
            logger.info("QueryRouter: no candidates generated for spec=%s", spec.model_dump_json())
            return []

        # 3) For each candidate, gather metrics and run fusion
        results: List[FusionResultSummary] = []

        for drug, event in candidates:
            try:
                evidence = self.metrics_provider(drug, event, spec)
                if not evidence:
                    continue

                fusion_output = self.fusion_engine.detect_signal(**evidence)

                summary = FusionResultSummary(
                    drug=drug,
                    event=event,
                    fusion_score=fusion_output.fusion_score,
                    alert_level=fusion_output.alert_level,
                    quantum_score_layer1=getattr(fusion_output, "quantum_score_layer1", None),
                    quantum_score_layer2=getattr(fusion_output, "quantum_score_layer2", None),
                    classical_score=getattr(fusion_output, "classical_score", None),
                    explanation=self._generate_explanation(drug, event, fusion_output),
                    components=getattr(fusion_output, "components", {}),
                )
                results.append(summary)

            except Exception as e:
                logger.exception("QueryRouter: fusion error for %s/%s: %s", drug, event, e)
                continue

        # 4) Rank by fusion_score desc and apply limit
        results.sort(key=lambda r: r.fusion_score, reverse=True)
        return results[: spec.limit]

    def route_nlp_to_fusion(
        self,
        nlp_filters: Dict[str, Any],
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Convenience entry: route a raw filters dict (from NLP) directly to fusion.

        Example expected keys in nlp_filters:
            {
              "drugs": ["warfarin"],
              "reactions": ["bleeding"],
              "seriousness_only": True,
              "age_min": 65,
              "time_window": "LAST_12_MONTHS",
              "raw_text": "Show serious bleeding in elderly on warfarin"
            }

        You can adapt this to your actual NLP output fields.
        """
        spec = SignalQuerySpec(
            task=nlp_filters.get("task") or "rank_signals",
            drugs=nlp_filters.get("drugs") or [],
            reactions=nlp_filters.get("reactions") or [],
            seriousness_only=bool(nlp_filters.get("seriousness_only")),
            age_min=nlp_filters.get("age_min"),
            age_max=nlp_filters.get("age_max"),
            region_codes=nlp_filters.get("region_codes") or [],
            time_window=nlp_filters.get("time_window"),
            limit=min(limit, int(nlp_filters.get("limit", limit))),
            raw_text=nlp_filters.get("raw_text"),
        )

        summaries = self.run_query(spec)
        return [s.to_dict() for s in summaries]

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _normalize_reactions(self, reactions: List[str]) -> List[MappedTerm]:
        if not reactions:
            return []

        mapped: List[MappedTerm] = []
        for r in reactions:
            mt = self.fda_mapper.map_term(r)
            if mt:
                mapped.append(mt)
            else:
                logger.info("QueryRouter: no PT match for reaction term '%s'", r)

        return mapped

    def _build_candidate_pairs(
        self,
        drugs: List[str],
        mapped_reactions: List[MappedTerm],
    ) -> List[Tuple[str, str]]:
        """
        For now, we just take the Cartesian product of drugs × mapped reactions.

        Later we can:
        - restrict to pairs that exist in the DB or FAERS subset,
        - add popularity filters, etc.
        """
        if not drugs or not mapped_reactions:
            return []

        pairs: List[Tuple[str, str]] = []
        for d in drugs:
            d_clean = d.strip()
            if not d_clean:
                continue
            for mt in mapped_reactions:
                pairs.append((d_clean, mt.preferred_term))

        # Deduplicate
        pairs = list(dict.fromkeys(pairs))
        return pairs

    def _generate_explanation(self, drug: str, event: str, fusion_output: Any) -> str:
        """
        Simple natural-language explanation stub.

        We can later enrich this using the component breakdown,
        SHAP-like values, etc.
        """
        fs = getattr(fusion_output, "fusion_score", None)
        level = getattr(fusion_output, "alert_level", None)
        parts = [f"{drug} – {event}"]

        if level:
            parts.append(f"alert level: {level}")
        if fs is not None:
            parts.append(f"fusion score: {fs:.3f}")

        return "; ".join(parts)

    # ------------------------------------------------------------------
    # Default metrics provider (placeholder)
    # ------------------------------------------------------------------

    def _default_metrics_provider(
        self,
        drug: str,
        event: str,
        spec: SignalQuerySpec,
    ) -> Dict[str, Any]:
        """
        Placeholder metrics provider.

        This MUST be replaced in real usage with something that:
        - queries your DB,
        - builds the evidence dict required by CompleteFusionEngine.detect_signal.

        Here we just log and return an empty dict to be explicit.
        """
        logger.warning(
            "QueryRouter._default_metrics_provider called for %s/%s with spec=%s; "
            "you must inject a real metrics_provider.",
            drug,
            event,
            spec.model_dump_json(),
        )
        return {}
