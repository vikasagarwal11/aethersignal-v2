"""
Enhanced AI Query API
---------------------
Provides an endpoint that uses the enhanced NLP parser, terminology mapper,
query router, and fusion engine to return ranked signals with explanations.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import os
import logging
from supabase import create_client, Client

from app.core.signal_detection.complete_fusion_engine import CompleteFusionEngine
from app.core.signal_detection.metrics_provider import create_supabase_metrics_provider, MetricsProvider
from app.core.terminology.fda_mapper import FDATerminologyMapper
from app.core.nlp.enhanced_nlp_integration import process_natural_language_query
from app.core.signal_detection.query_router import FusionResultSummary

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai/enhanced", tags=["Enhanced AI"])

# Initialize shared components
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

_fusion_engine: Optional[CompleteFusionEngine] = None
_fda_mapper: Optional[FDATerminologyMapper] = None
_metrics_provider: Optional[MetricsProvider] = None


def _get_components():
    global _fusion_engine, _fda_mapper, _metrics_provider
    if _fusion_engine is None:
        _fusion_engine = CompleteFusionEngine()
    if _fda_mapper is None:
        _fda_mapper = FDATerminologyMapper()
    if _metrics_provider is None:
        if supabase is None:
            raise HTTPException(status_code=500, detail="Supabase not configured for enhanced AI query.")
        _metrics_provider = create_supabase_metrics_provider(supabase)
    return _fusion_engine, _fda_mapper, _metrics_provider


class EnhancedQueryRequest(BaseModel):
    query: str
    max_results: int = 50


class SignalSummary(BaseModel):
    drug: str
    event: str
    fusion_score: float
    alert_level: str
    quantum_score_layer1: Optional[float] = None
    quantum_score_layer2: Optional[float] = None
    classical_score: Optional[float] = None
    explanation: Optional[str] = None


class EnhancedQueryResponse(BaseModel):
    answer: str
    signals: List[SignalSummary]
    total_results: int
    follow_up_suggestions: List[str] = []
    intent: str = "signal_detection"


@router.post("/query", response_model=EnhancedQueryResponse)
async def enhanced_ai_query(request: EnhancedQueryRequest):
    """
    Enhanced AI query endpoint:
    1) Parses natural language
    2) Maps events to FDA Preferred Terms
    3) Routes to fusion engine via QueryRouter
    4) Returns ranked signals with fusion scores
    """
    try:
        fusion_engine, fda_mapper, metrics_provider = _get_components()
        results: List[FusionResultSummary] = process_natural_language_query(
            query=request.query,
            fusion_engine=fusion_engine,
            fda_mapper=fda_mapper,
            metrics_provider=metrics_provider,
            limit=request.max_results,
        )

        if not results:
            return EnhancedQueryResponse(
                answer=f"No signals found for '{request.query}'.",
                signals=[],
                total_results=0,
                follow_up_suggestions=[
                    "Try another drug or reaction term",
                    "Check spelling or use broader terms",
                    "Ask: Rank signals for warfarin and bleeding",
                ],
            )

        summaries = [
            SignalSummary(
                drug=r.drug,
                event=r.event,
                fusion_score=r.fusion_score,
                alert_level=r.alert_level,
                quantum_score_layer1=r.quantum_score_layer1,
                quantum_score_layer2=r.quantum_score_layer2,
                classical_score=r.classical_score,
                explanation=r.explanation,
            )
            for r in results
        ]

        top = results[0]
        answer = (
            f"Top signal: {top.drug} + {top.event} "
            f"(score {top.fusion_score:.3f}, {top.alert_level}). "
            f"Returned {len(results)} signals."
        )

        return EnhancedQueryResponse(
            answer=answer,
            signals=summaries,
            total_results=len(results),
            follow_up_suggestions=[
                "Show component breakdown",
                "Filter by serious only",
                "Compare top 3 signals",
            ],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Enhanced AI query failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Error processing enhanced query: {str(e)}")

