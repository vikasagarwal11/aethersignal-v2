from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import csv
import io
import os
from datetime import datetime, timedelta
from collections import Counter
from supabase import create_client, Client

from app.core.analysis.models import (
    AnalysisHandle,
    AnalysisDetailResponse,
    AnalysisRow,
    SignalQueryFilters,
    SavedAnalysis,
    AnalysisStats,
    TimeBucketCount,
    CategoryCount,
)
from app.core.analysis.store import AnalysisStore, SavedAnalysisStore
from app.core.signal_detection.fusion_query import run_fusion_for_filters
from app.core.signal_detection.query_router import FusionResultSummary

# Create global instances
analysis_store = AnalysisStore()
saved_analysis_store = SavedAnalysisStore()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

supabase: Optional[Client] = None
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)

router = APIRouter(prefix="/analysis", tags=["Analysis"])


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
        # Try to parse year (e.g., "SINCE_2020")
        try:
            year = int(time_window_upper.split("_")[1])
            return datetime(year, 1, 1)
        except (ValueError, IndexError):
            return None
    
    return None


MAX_PAGE_SIZE = 200  # safety cap


def _build_base_query(supabase: Client, filters: SignalQueryFilters):
    """
    Build the base Supabase query with all filters pushed into SQL as much as possible.
    Uses OR conditions for multiple values instead of Python-side filtering.
    """
    # Build base query
    query = supabase.table("pv_cases").select(
        "id,case_id,drug_name,reaction,serious,outcome,onset_date,event_date,age_yrs,sex,country",
        count="exact"
    )
    
    # --- Drugs: OR of ilike conditions (partial match)
    if filters.drugs.values:
        if len(filters.drugs.values) == 1:
            # Single value: simple ilike
            drug = filters.drugs.values[0].strip()
            if drug:
                query = query.ilike("drug_name", f"%{drug}%")
        else:
            # Multiple values: OR of ilike conditions
            or_clauses = [
                f"drug_name.ilike.%{drug.strip()}%" 
                for drug in filters.drugs.values 
                if drug.strip()
            ]
            if or_clauses:
                or_expression = ",".join(or_clauses)
                if hasattr(query, "or_"):
                    query = query.or_(or_expression)
                else:
                    # Fallback: use first value if .or_() not available
                    query = query.ilike("drug_name", f"%{filters.drugs.values[0].strip()}%")
    
    # --- Events: OR of ilike conditions (partial match)
    if filters.events.values:
        if len(filters.events.values) == 1:
            # Single value: simple ilike
            reaction = filters.events.values[0].strip()
            if reaction:
                query = query.ilike("reaction", f"%{reaction}%")
        else:
            # Multiple values: OR of ilike conditions
            or_clauses = [
                f"reaction.ilike.%{event.strip()}%" 
                for event in filters.events.values 
                if event.strip()
            ]
            if or_clauses:
                or_expression = ",".join(or_clauses)
                if hasattr(query, "or_"):
                    query = query.or_(or_expression)
                else:
                    # Fallback: use first value if .or_() not available
                    query = query.ilike("reaction", f"%{filters.events.values[0].strip()}%")
    
    # --- Seriousness / Outcome: OR conditions
    if filters.seriousness_or_outcome.values:
        conds = []
        for val in filters.seriousness_or_outcome.values:
            v_lower = val.lower().strip()
            if v_lower in ["serious", "seriousness"]:
                conds.append("serious.eq.true")
            elif v_lower in ["death", "fatal", "died"]:
                # Use ilike for partial match on outcome
                conds.append("outcome.ilike.%death%")
            else:
                # Generic outcome match
                conds.append(f"outcome.ilike.%{val}%")
        
        if conds:
            if len(conds) == 1:
                # Single condition: apply directly
                if conds[0] == "serious.eq.true":
                    query = query.eq("serious", True)
                elif conds[0].startswith("outcome.ilike."):
                    # Extract value from condition
                    value = conds[0].replace("outcome.ilike.%", "").replace("%", "")
                    query = query.ilike("outcome", f"%{value}%")
            else:
                # Multiple conditions: use OR
                seriousness_expr = ",".join(conds)
                if hasattr(query, "or_"):
                    query = query.or_(seriousness_expr)
                else:
                    # Fallback: apply first condition
                    if "serious.eq.true" in conds:
                        query = query.eq("serious", True)
    
    # --- Age
    if filters.age_min is not None:
        query = query.gte("age_yrs", filters.age_min)
    if filters.age_max is not None:
        query = query.lte("age_yrs", filters.age_max)
    
    # --- Sex
    if filters.sex:
        query = query.eq("sex", filters.sex.upper())
    
    # --- Region (country)
    if filters.region_codes:
        query = query.in_("country", filters.region_codes)
    
    # --- Time window
    if filters.time_window:
        from_date = _parse_time_window(filters.time_window)
        if from_date:
            query = query.gte("event_date", from_date.isoformat())
    
    return query


async def run_cases_query(
    filters: SignalQueryFilters,
    page: int,
    page_size: int,
) -> tuple[List[AnalysisRow], int]:
    """
    Translate SignalQueryFilters → Supabase query and return paginated results.
    
    All OR conditions are pushed to SQL (no Python-side filtering).
    
    Maps filters to WHERE clauses:
    - filters.drugs.values → WHERE drug_name ILIKE ... OR drug_name ILIKE ...
    - filters.events.values → WHERE reaction ILIKE ... OR reaction ILIKE ...
    - filters.seriousness_or_outcome.values → WHERE serious = true OR outcome ILIKE ...
    - filters.age_min/max → WHERE age_yrs BETWEEN ...
    - filters.sex → WHERE sex = ...
    - filters.time_window → WHERE event_date >= ...
    - filters.region_codes → WHERE country IN (...)
    """
    if not supabase:
        # Return empty if Supabase not configured
        return [], 0
    
    # Cap page_size for safety
    if page_size > MAX_PAGE_SIZE:
        page_size = MAX_PAGE_SIZE
    
    try:
        # Build base query with all filters
        base_query = _build_base_query(supabase, filters)
        
        # Get total count (before pagination)
        count_response = base_query.execute()
        total_count = count_response.count if hasattr(count_response, 'count') else 0
        
        # Apply pagination
        from_index = (page - 1) * page_size
        to_index = from_index + page_size - 1
        query = base_query.range(from_index, to_index)
        
        # Execute query
        response = query.execute()
        rows_data = response.data or []
        
        # Map database rows to AnalysisRow objects (no Python-side filtering needed)
        rows: List[AnalysisRow] = []
        for row in rows_data:
            # Convert date to string
            onset_date = row.get("onset_date")
            if onset_date:
                if isinstance(onset_date, str):
                    onset_date_str = onset_date
                else:
                    onset_date_str = onset_date.isoformat() if hasattr(onset_date, 'isoformat') else str(onset_date)
            else:
                onset_date_str = None
            
            # Build AnalysisRow
            analysis_row = AnalysisRow(
                case_id=row.get("case_id") or row.get("id", ""),
                drug=row.get("drug_name", ""),
                event=row.get("reaction", ""),
                serious=bool(row.get("serious", False)),
                outcome=row.get("outcome"),
                onset_date=onset_date_str,
                age=int(row.get("age_yrs")) if row.get("age_yrs") is not None else None,
                sex=row.get("sex"),
                region=row.get("country"),
            )
            rows.append(analysis_row)
        
        return rows, total_count
        
    except Exception as e:
        # Log error and return empty result
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in run_cases_query: {e}", exc_info=True)
        return [], 0


def _build_analysis_stats(rows: List[AnalysisRow], total_count: int) -> AnalysisStats:
    """
    Build aggregated stats for charts from a list of AnalysisRow.
    
    For now we do this in Python; later we can move to DB-level aggregation.
    """
    # 1) Time series by month (YYYY-MM)
    time_counter: Counter[str] = Counter()
    for r in rows:
        if r.onset_date:
            try:
                dt = datetime.fromisoformat(r.onset_date)
                key = dt.strftime("%Y-%m")
            except Exception:
                # Fallback: use first 7 chars if already "YYYY-MM"
                if len(r.onset_date) >= 7:
                    key = r.onset_date[:7]
                else:
                    continue
            time_counter[key] += 1

    time_series = [
        TimeBucketCount(bucket=k, count=v)
        for k, v in sorted(time_counter.items())
    ]

    # 2) Age buckets
    def age_bucket(age: Optional[int]) -> str:
        if age is None:
            return "UNKNOWN"
        if age < 18:
            return "<18"
        if age < 40:
            return "18-39"
        if age < 65:
            return "40-64"
        return "65+"

    age_counter: Counter[str] = Counter()
    for r in rows:
        age_counter[age_bucket(r.age)] += 1

    by_age_bucket = [
        CategoryCount(category=k, count=v)
        for k, v in sorted(age_counter.items())
    ]

    # 3) Sex
    sex_counter: Counter[str] = Counter()
    for r in rows:
        sex = (r.sex or "UNKNOWN").upper()
        sex_counter[sex] += 1

    by_sex = [
        CategoryCount(category=k, count=v)
        for k, v in sorted(sex_counter.items())
    ]

    # 4) Region
    region_counter: Counter[str] = Counter()
    for r in rows:
        region = r.region or "UNKNOWN"
        region_counter[region] += 1

    # Optional: only keep top N and group the rest into "OTHER"
    MAX_REGIONS = 10
    most_common = region_counter.most_common(MAX_REGIONS)
    other_count = sum(region_counter.values()) - sum(c for _, c in most_common)
    by_region = [
        CategoryCount(category=k, count=v) for k, v in most_common
    ]
    if other_count > 0:
        by_region.append(CategoryCount(category="OTHER", count=other_count))

    return AnalysisStats(
        total_count=total_count,
        time_series=time_series,
        by_age_bucket=by_age_bucket,
        by_sex=by_sex,
        by_region=by_region,
    )


@router.get("/{analysis_id}", response_model=AnalysisDetailResponse)
async def get_analysis(
    analysis_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
):
    handle = analysis_store.get(analysis_id)
    if not handle:
        raise HTTPException(status_code=404, detail="Analysis not found")

    rows, total_count = await run_cases_query(handle.filters, page, page_size)

    return AnalysisDetailResponse(
        handle=handle,
        rows=rows,
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


@router.get("/{analysis_id}/export")
async def export_analysis_csv(analysis_id: str):
    handle = analysis_store.get(analysis_id)
    if not handle:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # For now, reuse run_cases_query with large page size
    rows, _ = await run_cases_query(handle.filters, page=1, page_size=100_000)

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["case_id", "drug", "event", "serious", "outcome", "onset_date", "age", "sex", "region"])

    for r in rows:
        writer.writerow([
            r.case_id,
            r.drug,
            r.event,
            r.serious,
            r.outcome or "",
            r.onset_date or "",
            r.age or "",
            r.sex or "",
            r.region or "",
        ])

    output.seek(0)
    filename = f"analysis_{analysis_id}.csv"

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _get_current_user_id(request: Request) -> Optional[str]:
    """
    Helper to get current user id from request.
    
    TODO: integrate with your auth (e.g. Supabase JWT, session, etc.)
    For now returns None (demo_user will be used).
    """
    # Example: Extract from JWT token
    # authorization = request.headers.get("Authorization")
    # if authorization and authorization.startswith("Bearer "):
    #     token = authorization.split(" ")[1]
    #     # Decode JWT and extract user_id
    #     return decoded_token.get("user_id")
    return None


@router.post("/{analysis_id}/save", response_model=SavedAnalysis)
async def save_analysis(
    analysis_id: str,
    request: Request,
) -> SavedAnalysis:
    """
    Save/bookmark an analysis into Postgres.

    For now, we auto-use the AnalysisHandle title as the name.
    """
    handle = analysis_store.get(analysis_id)
    if handle is None:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Determine owner user; currently None (wire later)
    owner_user_id = _get_current_user_id(request)
    session_id = handle.session_id

    name = handle.title or f"Analysis {analysis_id}"

    # Insert into Supabase
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    insert_payload = {
        "analysis_id": analysis_id,
        "name": name,
        "owner_user_id": owner_user_id,
        "session_id": session_id,
    }

    result = supabase.table("saved_analyses").insert(insert_payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save analysis")

    row = result.data[0]
    return SavedAnalysis(
        id=str(row["id"]),
        analysis_id=row["analysis_id"],
        name=row["name"],
        owner_user_id=row.get("owner_user_id"),
        session_id=row.get("session_id"),
        created_at=row.get("created_at"),
    )


@router.get("/saved", response_model=List[SavedAnalysis])
async def list_saved_analyses(
    request: Request,
    session_id: Optional[str] = Query(default=None, description="Filter by session ID (optional)"),
) -> List[SavedAnalysis]:
    """
    List saved analyses. In v1, we allow filtering by session_id and/or user.
    
    Returns empty list if table doesn't exist (graceful degradation).
    """
    if supabase is None:
        # Return empty list instead of error if Supabase not configured
        return []

    try:
        # Check if table exists by attempting to query it
        # If table doesn't exist, Supabase will raise an error
        owner_user_id = _get_current_user_id(request)

        query = supabase.table("saved_analyses").select("*")

        if owner_user_id:
            query = query.eq("owner_user_id", owner_user_id)
        if session_id:
            query = query.eq("session_id", session_id)

        result = query.order("created_at", desc=True).limit(50).execute()
        rows = result.data or []

        return [
            SavedAnalysis(
                id=str(r["id"]),
                analysis_id=r["analysis_id"],
                name=r["name"],
                owner_user_id=r.get("owner_user_id"),
                session_id=r.get("session_id"),
                created_at=r.get("created_at"),
            )
            for r in rows
        ]
    except Exception as e:
        # If table doesn't exist or any other error, return empty list
        # This allows the frontend to work even if migration hasn't been run
        import logging
        logger = logging.getLogger(__name__)
        logger.debug(f"Error fetching saved analyses (table may not exist): {e}")
        return []


@router.get("/session/{session_id}", response_model=List[AnalysisHandle])
async def list_session_analyses(session_id: str) -> List[AnalysisHandle]:
    """
    Returns all analyses created in a given chat session.

    This powers the 'multiple analyses' sidebar in the UI.
    """
    return analysis_store.list_for_session(session_id)


class FusionRankingResponse(BaseModel):
    handle: AnalysisHandle
    results: List[dict]  # FusionResultSummary as dict (dataclass converted)


@router.get("/{analysis_id}/fusion", response_model=FusionRankingResponse)
async def get_fusion_ranking_for_analysis(analysis_id: str) -> FusionRankingResponse:
    """
    Run heavy fusion ranking for the cohort defined by this AnalysisHandle.

    This is Option A: "Rank signals for this cohort".
    """
    handle = analysis_store.get(analysis_id)
    if handle is None:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Use the filters from the handle to define the cohort
    filters = handle.filters

    # You can tune the limit or expose it as a query param
    fusion_results = run_fusion_for_filters(filters, limit=50)

    # Convert FusionResultSummary dataclass to dict for Pydantic response
    results_dict = [result.to_dict() for result in fusion_results]

    return FusionRankingResponse(
        handle=handle,
        results=results_dict,
    )


@router.get("/{analysis_id}/stats", response_model=AnalysisStats)
async def get_analysis_stats(
    analysis_id: str,
) -> AnalysisStats:
    """
    Returns aggregated stats for charts for a given analysis.
    
    For now, we re-run the filtered query with a high page_size cap.
    """
    handle = analysis_store.get(analysis_id)
    if handle is None:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # For stats we may want to cap at some max rows for performance.
    # You can tune this later or move aggregation into SQL.
    page = 1
    page_size = 50000  # TODO: adjust or make configurable

    rows, total_count = await run_cases_query(
        filters=handle.filters,
        page=page,
        page_size=page_size,
    )

    return _build_analysis_stats(rows, total_count)
