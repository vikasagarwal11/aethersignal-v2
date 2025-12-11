from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional

from app.core.analysis.models import (
    AIQueryResponse,
    AnalysisHandle,
    AIMessageAction,
    ViewSpec,
    SignalQueryFilters,
    QueryConfirmation,
)
from app.core.analysis.store import AnalysisStore, SessionStore
from app.core.nlp.enhanced_parser import ConversationalQueryInterpreter
from app.core.terminology.fda_mapper import FDATerminologyMapper
from app.core.terminology.snomed_mapper import SNOMEDCTMapper
import os
from datetime import datetime, timedelta
from supabase import create_client, Client

router = APIRouter(prefix="/ai", tags=["AI Signal Chat"])

# Initialize Supabase for estimated count
_supabase: Optional[Client] = None
def get_supabase() -> Optional[Client]:
    global _supabase
    if _supabase is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        if supabase_url and supabase_key:
            _supabase = create_client(supabase_url, supabase_key)
    return _supabase

# Global singletons (MVP)
analysis_store = AnalysisStore()
session_store = SessionStore()

_fda_mapper: Optional[FDATerminologyMapper] = None
_snomed_mapper: Optional[SNOMEDCTMapper] = None
_interpreter: Optional[ConversationalQueryInterpreter] = None


def get_fda_mapper() -> FDATerminologyMapper:
    global _fda_mapper
    if _fda_mapper is None:
        _fda_mapper = FDATerminologyMapper()
    return _fda_mapper


def get_snomed_mapper() -> Optional[SNOMEDCTMapper]:
    global _snomed_mapper
    if _snomed_mapper is None:
        try:
            _snomed_mapper = SNOMEDCTMapper()
        except FileNotFoundError:
            _snomed_mapper = None
    return _snomed_mapper


def get_interpreter() -> ConversationalQueryInterpreter:
    global _interpreter
    if _interpreter is None:
        _interpreter = ConversationalQueryInterpreter(
            fda_mapper=get_fda_mapper(),
            snomed_mapper=get_snomed_mapper(),
        )
    return _interpreter


class QueryRequest(BaseModel):
    query: str = Field(..., description="User's natural language query")
    session_id: Optional[str] = Field(
        default=None,
        description="Stable session ID from frontend; used for refinement",
    )
    refinement_mode: bool = False
    reset_context: bool = False
    confirmed: bool = Field(
        default=False,
        description="When True, skip interpretation and create analysis from stored filters",
    )
    # You can add more fields if needed:
    #   - context: Dict[str, Any]
    #   - debug: bool


@router.post("/query", response_model=AIQueryResponse)
async def process_query(request: QueryRequest) -> AIQueryResponse:
    """
    Main conversational endpoint used by the chat UI.

    Two-step flow:

    Step 1 (confirmed=False):
      - Interpret query → SignalQueryFilters + QueryConfirmation
      - Save filters in SessionStore
      - Return natural language explanation + confirmation object
      - Set requires_confirmation=True
      - Add an AIMessageAction of type "confirm_query"

    Step 2 (confirmed=True):
      - Load filters from SessionStore (for this session_id)
      - Create an AnalysisHandle
      - Save it in AnalysisStore
      - Return a message + AIMessageAction of type "open_analysis"
      - Set requires_confirmation=False
    """
    interpreter = get_interpreter()

    # 0) Handle reset
    if request.reset_context and request.session_id:
        session_store.clear(request.session_id)

    # 1) Confirmed branch: only create analysis, don't re-interpret
    if request.confirmed:
        if not request.session_id:
            raise HTTPException(status_code=400, detail="Cannot confirm without session_id")

        filters: Optional[SignalQueryFilters] = session_store.get_filters(request.session_id)
        if not filters:
            raise HTTPException(
                status_code=400,
                detail="No previous filters found to confirm for this session.",
            )

        # Build confirmation from filters (reuse interpreter's description logic)
        # Build human-readable description from existing filters
        human, logic = interpreter._build_descriptions(filters)
        
        # Recompute estimated count for confirmed filters
        estimated_count = None
        supabase = get_supabase()
        if supabase:
            try:
                estimated_count = _compute_fast_count(filters, supabase)
            except Exception:
                pass  # Don't fail if count fails
        
        confirmation = QueryConfirmation(
            filters=filters,
            human_readable=human,
            logic_expression=logic,
            estimated_count=estimated_count,
        )

        # Create analysis handle
        handle = AnalysisHandle(
            session_id=request.session_id,
            title=human,
            filters=filters,
            view=ViewSpec(),
            summary_text=f"Analysis for: {human}",
            estimated_count=confirmation.estimated_count,
        )
        handle = analysis_store.save(handle)

        msg = (
            f"Got it — generating a detailed report for **{human}**.\n\n"
            f"You can open the full table and export it from the analysis view."
        )

        action = AIMessageAction(
            type="open_analysis",
            label="Generate detailed report",
            analysis_id=handle.id,
        )

        return AIQueryResponse(
            message=msg,
            actions=[action],
            analysis_handle=handle,
            confirmation=confirmation,
            requires_confirmation=False,
            context={
                "last_analysis_id": handle.id,
                "filters": filters.dict(),
            },
        )

    # 2) Normal branch: interpret, but do not run analysis yet
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Empty query")

    previous_filters = None
    if request.session_id and request.refinement_mode:
        previous_filters = session_store.get_filters(request.session_id)

    filters, confirmation = interpreter.interpret(
        query=request.query,
        previous_filters=previous_filters,
        refinement_mode=request.refinement_mode,
    )

    # 2.5) Compute fast estimated count (optional, non-blocking)
    supabase = get_supabase()
    if supabase:
        try:
            estimated_count = _compute_fast_count(filters, supabase)
            confirmation.estimated_count = estimated_count
        except Exception as e:
            # Don't fail if count fails, just log
            import logging
            logger = logging.getLogger(__name__)
            logger.debug(f"Estimated count failed: {e}")

    # 3) Persist filters to session for later confirmation or refinement
    if request.session_id:
        session_store.save_filters(request.session_id, filters)

    human = confirmation.human_readable
    count = confirmation.estimated_count

    # 4) Compose natural language response (step 1)
    # Build conversational message
    if count is not None:
        msg = f"I found {count} case{'s' if count != 1 else ''} matching: {human}."
    else:
        msg = f"I found cases matching: {human}."
    
    msg += " Would you like to generate a detailed report?"

    # 5) Action: confirm this interpretation
    confirm_action = AIMessageAction(
        type="confirm_query",
        label="Confirm & generate report",
        analysis_id=None,  # not created yet
    )

    actions = [confirm_action]

    return AIQueryResponse(
        message=msg,
        actions=actions,
        analysis_handle=None,
        confirmation=confirmation,
        requires_confirmation=True,
        context={
            "filters": filters.dict(),
        },
    )


def _compute_fast_count(filters, supabase: Client) -> Optional[int]:
    """
    Compute a fast estimated count for the given filters.
    Uses the same logic as run_cases_query but only for count.
    """
    try:
        # Build base query for count only
        query = supabase.table("pv_cases").select("id", count="exact")
        
        # Apply drug filters (use first value for quick count)
        if filters.drugs.values:
            drug = filters.drugs.values[0].strip() if filters.drugs.values else None
            if drug:
                query = query.ilike("drug_name", f"%{drug}%")
        
        # Apply event/reaction filters (use first value for quick count)
        if filters.events.values:
            reaction = filters.events.values[0].strip() if filters.events.values else None
            if reaction:
                query = query.ilike("reaction", f"%{reaction}%")
        
        # Apply seriousness/outcome filters
        if filters.seriousness_or_outcome.values:
            has_serious = any(v.lower() in ["serious", "seriousness"] for v in filters.seriousness_or_outcome.values)
            has_death = any(v.lower() in ["death", "fatal", "died"] for v in filters.seriousness_or_outcome.values)
            
            if has_serious and has_death:
                query = query.eq("serious", True)
            elif has_serious:
                query = query.eq("serious", True)
            elif has_death:
                query = query.ilike("outcome", "%death%")
        
        # Apply age filters
        if filters.age_min is not None:
            query = query.gte("age_yrs", filters.age_min)
        if filters.age_max is not None:
            query = query.lte("age_yrs", filters.age_max)
        
        # Apply sex filter
        if filters.sex:
            query = query.eq("sex", filters.sex.upper())
        
        # Apply time window filter
        if filters.time_window:
            from_date = _parse_time_window(filters.time_window)
            if from_date:
                query = query.gte("event_date", from_date.isoformat())
        
        # Apply region filters
        if filters.region_codes:
            query = query.in_("country", filters.region_codes)
        
        # Execute count query with limit for performance
        response = query.limit(1).execute()
        return response.count if hasattr(response, 'count') else None
        
    except Exception:
        # Return None on any error - don't block the request
        return None


def _parse_time_window(time_window: Optional[str]) -> Optional[datetime]:
    """Parse time window string to datetime."""
    if not time_window:
        return None
    
    now = datetime.utcnow()
    time_window_upper = time_window.upper()
    
    if time_window_upper == "LAST_6_MONTHS":
        return now - timedelta(days=180)
    elif time_window_upper == "LAST_12_MONTHS":
        return now - timedelta(days=365)
    elif time_window_upper == "LAST_24_MONTHS":
        return now - timedelta(days=730)
    elif time_window_upper.startswith("SINCE_"):
        try:
            year = int(time_window_upper.split("_")[1])
            return datetime(year, 1, 1)
        except (ValueError, IndexError):
            return None
    
    return None
