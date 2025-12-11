# backend/app/core/signal_detection/fusion_query.py

from __future__ import annotations

from typing import List, Optional

from supabase import create_client, Client

from app.core.signal_detection.query_router import (
    SignalQuerySpec,
    QueryRouter,
    FusionResultSummary,
)
from app.core.signal_detection.complete_fusion_engine import CompleteFusionEngine
from app.core.signal_detection.metrics_provider import create_supabase_metrics_provider
from app.core.terminology.fda_mapper import FDATerminologyMapper
from app.core.analysis.models import SignalQueryFilters

import os

_supabase: Optional[Client] = None
_query_router: Optional[QueryRouter] = None


def get_supabase() -> Optional[Client]:
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        if url and key:
            _supabase = create_client(url, key)
    return _supabase


def get_query_router() -> Optional[QueryRouter]:
    """
    Lazily initialize QueryRouter + CompleteFusionEngine + metrics provider.

    Returns None if Supabase is not configured.
    """
    global _query_router
    if _query_router is not None:
        return _query_router

    supabase = get_supabase()
    if supabase is None:
        return None

    metrics_provider = create_supabase_metrics_provider(supabase)
    fusion_engine = CompleteFusionEngine()
    fda_mapper = FDATerminologyMapper()

    _query_router = QueryRouter(
        fusion_engine=fusion_engine,
        metrics_provider=metrics_provider,
        fda_mapper=fda_mapper,
    )
    return _query_router


def _filters_to_spec(filters: SignalQueryFilters, limit: int = 100) -> SignalQuerySpec:
    """
    Minimal bridge from conversational filters -> SignalQuerySpec.

    You can enrich this mapping over time as you add more dimensions.
    """
    drugs = filters.drugs.values if filters.drugs else []
    reactions = filters.events.values if filters.events else []

    seriousness_only = bool(filters.seriousness_or_outcome.values)

    return SignalQuerySpec(
        drugs=drugs,
        reactions=reactions,
        seriousness_only=seriousness_only,
        age_min=filters.age_min,
        age_max=filters.age_max,
        region_codes=filters.region_codes,
        time_window=filters.time_window,
        limit=limit,
        raw_text=filters.raw_text,
    )


def run_fusion_for_filters(
    filters: SignalQueryFilters,
    limit: int = 50,
) -> List[FusionResultSummary]:
    """
    Core helper: given a cohort filter definition, rank signals within that cohort.

    Returns a list of FusionResultSummary entries sorted by fusion_score.
    """
    router = get_query_router()
    if router is None:
        # You may want to raise or return empty if Supabase not configured.
        return []

    spec = _filters_to_spec(filters, limit=limit)

    # This call will:
    # - fetch metrics via metrics_provider
    # - run CompleteFusionEngine
    # - return sorted FusionResultSummary objects
    results = router.run_query(spec)
    return results

