from __future__ import annotations

from fastapi import APIRouter, HTTPException
from typing import List

from app.core.analysis.models import SignalQueryFilters
from app.core.nlp.enhanced_parser import run_fusion_for_filters

router = APIRouter(prefix="/fusion", tags=["Fusion Engine"])


@router.post("/fusion-from-filters")
async def fusion_from_filters(filters: SignalQueryFilters) -> List[dict]:
    """
    Run fusion engine for given SignalQueryFilters.
    
    This endpoint converts filters to SignalQuerySpec and routes through
    QueryRouter to get ranked signals with fusion scores.
    
    Args:
        filters: SignalQueryFilters from conversational query
        
    Returns:
        List of FusionResultSummary as dictionaries
    """
    try:
        results = run_fusion_for_filters(filters)
        return [r.to_dict() for r in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fusion query failed: {str(e)}")

