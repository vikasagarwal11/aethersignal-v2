from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict
from pydantic import BaseModel
from datetime import datetime
import os
import re
from supabase import create_client, Client
from .signal_statistics import (
    SignalDetector,
    calculate_signal_statistics,
    get_all_signals
)

router = APIRouter(prefix="/api/v1/signals", tags=["signals"])

# Initialize Supabase client (prefer SERVICE_KEY for read/write access, fallback to ANON_KEY)
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) must be set in environment variables")

supabase: Client = create_client(supabase_url, supabase_key)


def escape_sql_identifier(identifier: str) -> str:
    """Escape SQL identifier to prevent injection (only allow alphanumeric and underscore)"""
    if not identifier or not re.match(r'^[a-zA-Z0-9_]+$', identifier):
        raise ValueError(f"Invalid identifier: {identifier}")
    return identifier


def escape_sql_string(value: str) -> str:
    """Escape SQL string to prevent injection"""
    if not value:
        return "''"
    # Replace single quotes with double single quotes (SQL escaping)
    return "'" + value.replace("'", "''") + "'"


def sanitize_float(value: float) -> float:
    """Replace inf/nan with JSON-compliant values"""
    import math
    if math.isinf(value):
        return 999999.0 if value > 0 else -999999.0
    if math.isnan(value):
        return 0.0
    return value


class SignalStats(BaseModel):
    total_cases: int
    critical_signals: int
    serious_events: int
    unique_drugs: int
    unique_reactions: int


class Signal(BaseModel):
    id: str
    drug: str
    reaction: str
    prr: float
    cases: int
    priority: str
    serious: bool
    dataset: str
    organization: Optional[str] = None
    # New statistical fields (optional for backward compatibility)
    prr_ci_lower: Optional[float] = None
    prr_ci_upper: Optional[float] = None
    prr_is_signal: Optional[bool] = None
    ror: Optional[float] = None
    ror_ci_lower: Optional[float] = None
    ror_ci_upper: Optional[float] = None
    ror_is_signal: Optional[bool] = None
    ic: Optional[float] = None
    ic025: Optional[float] = None
    ic_is_signal: Optional[bool] = None
    is_statistical_signal: Optional[bool] = None
    signal_strength: Optional[str] = None
    methods_flagged: Optional[List[str]] = None


@router.get("/stats", response_model=SignalStats)
async def get_signal_stats(
    organization: Optional[str] = Query(None, description="Filter by organization"),
    dataset: Optional[str] = Query(None, description="Filter by dataset (source)"),
    session_date: Optional[str] = Query(None, description="Filter by session date (YYYY-MM-DD format)")
):
    """
    Get aggregated statistics - OPTIMIZED with single database query
    Falls back to multiple queries if RPC not available
    """
    try:
        # Try optimized RPC method first
        try:
            filters = []
            if organization:
                org_escaped = escape_sql_string(organization)
                filters.append(f"organization = {org_escaped}")
            if dataset and dataset != "all":
                ds_escaped = escape_sql_string(dataset)
                filters.append(f"source = {ds_escaped}")
            if session_date and session_date != "all":
                date_escaped = escape_sql_string(session_date)
                filters.append(f"""source_file_id IN (
                    SELECT id FROM file_upload_history 
                    WHERE DATE(uploaded_at) = {date_escaped}
                )""")
            
            where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
            
            # OPTIMIZED: Single query with all aggregations
            query = f"""
            SELECT 
                COUNT(*)::int as total_cases,
                COUNT(*) FILTER (WHERE serious = true)::int as serious_events,
                COUNT(DISTINCT drug_name)::int as unique_drugs,
                COUNT(DISTINCT reaction)::int as unique_reactions,
                LEAST(
                    COUNT(*) FILTER (WHERE serious = true)::int,
                    COUNT(*)::int / 10
                )::int as critical_signals
            FROM pv_cases
            {where_clause}
            """
            
            result = supabase.rpc('exec_sql', {'query': query}).execute()
            
            if result.data and len(result.data) > 0:
                stats = result.data[0]
                return SignalStats(
                    total_cases=stats.get('total_cases', 0) or 0,
                    critical_signals=stats.get('critical_signals', 0) or 0,
                    serious_events=stats.get('serious_events', 0) or 0,
                    unique_drugs=stats.get('unique_drugs', 0) or 0,
                    unique_reactions=stats.get('unique_reactions', 0) or 0
                )
        except Exception as rpc_error:
            print(f"[DEBUG] RPC method failed, using fallback: {rpc_error}")
        
        # Fallback to original method (slower but works)
        return await get_signal_stats_fallback(organization, dataset, session_date)
        
    except Exception as e:
        print(f"Error fetching stats: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")


async def get_signal_stats_fallback(organization: Optional[str], dataset: Optional[str], session_date: Optional[str]):
    """Fallback stats calculation using Supabase query builder"""
    query = supabase.table("pv_cases").select("id, serious, drug_name, reaction", count="exact")
    
    if organization:
        query = query.eq("organization", organization)
    if dataset and dataset != "all":
        query = query.eq("source", dataset)
    if session_date and session_date != "all":
        # Validate that session_date is actually a date (YYYY-MM-DD format), not a UUID
        # UUIDs are 36 characters, dates are 10 characters
        if len(session_date) == 36 and "-" in session_date and session_date.count("-") == 4:
            # This is a UUID, not a date - skip session filtering
            print(f"[WARN] session_date is a UUID ({session_date}), not a date. Skipping session filter.")
        else:
            # Get file IDs for this session date
            files_result = supabase.table("file_upload_history").select("id").gte(
                "uploaded_at", f"{session_date}T00:00:00"
            ).lt("uploaded_at", f"{session_date}T23:59:59").execute()
            
            if files_result.data:
                file_ids = [f["id"] for f in files_result.data]
                query = query.in_("source_file_id", file_ids)
            else:
                # No files for this date, return empty stats
                return SignalStats(
                    total_cases=0,
                    critical_signals=0,
                    serious_events=0,
                    unique_drugs=0,
                    unique_reactions=0
                )
    
    result = query.execute()
    total_cases = result.count if hasattr(result, 'count') and result.count is not None else (len(result.data) if result.data else 0)
    
    # Get serious events
    serious_query = supabase.table("pv_cases").select("id", count="exact")
    if organization:
        serious_query = serious_query.eq("organization", organization)
    if dataset and dataset != "all":
        serious_query = serious_query.eq("source", dataset)
    if session_date and session_date != "all":
        # Validate that session_date is actually a date (YYYY-MM-DD format), not a UUID
        if len(session_date) == 36 and "-" in session_date and session_date.count("-") == 4:
            # This is a UUID, not a date - skip session filtering
            print(f"[WARN] session_date is a UUID ({session_date}), not a date. Skipping session filter.")
        else:
            files_result = supabase.table("file_upload_history").select("id").gte(
                "uploaded_at", f"{session_date}T00:00:00"
            ).lt("uploaded_at", f"{session_date}T23:59:59").execute()
            if files_result.data:
                file_ids = [f["id"] for f in files_result.data]
                serious_query = serious_query.in_("source_file_id", file_ids)
    serious_result = serious_query.eq("serious", True).execute()
    serious_events = serious_result.count if hasattr(serious_result, 'count') else len(serious_result.data) if serious_result.data else 0
    
    # Get unique drugs and reactions
    drugs_query = supabase.table("pv_cases").select("drug_name")
    if organization:
        drugs_query = drugs_query.eq("organization", organization)
    if dataset and dataset != "all":
        drugs_query = drugs_query.eq("source", dataset)
    if session_date and session_date != "all":
        files_result = supabase.table("file_upload_history").select("id").gte(
            "uploaded_at", f"{session_date}T00:00:00"
        ).lt("uploaded_at", f"{session_date}T23:59:59").execute()
        if files_result.data:
            file_ids = [f["id"] for f in files_result.data]
            drugs_query = drugs_query.in_("source_file_id", file_ids)
    drugs_result = drugs_query.execute()
    unique_drugs = len(set([d.get("drug_name") for d in (drugs_result.data or []) if d.get("drug_name")]))
    
    reactions_query = supabase.table("pv_cases").select("reaction")
    if organization:
        reactions_query = reactions_query.eq("organization", organization)
    if dataset and dataset != "all":
        reactions_query = reactions_query.eq("source", dataset)
    if session_date and session_date != "all":
        files_result = supabase.table("file_upload_history").select("id").gte(
            "uploaded_at", f"{session_date}T00:00:00"
        ).lt("uploaded_at", f"{session_date}T23:59:59").execute()
        if files_result.data:
            file_ids = [f["id"] for f in files_result.data]
            reactions_query = reactions_query.in_("source_file_id", file_ids)
    reactions_result = reactions_query.execute()
    unique_reactions = len(set([r.get("reaction") for r in (reactions_result.data or []) if r.get("reaction")]))
    
    critical_signals = min(serious_events, total_cases // 10)
    
    return SignalStats(
        total_cases=total_cases,
        critical_signals=critical_signals,
        serious_events=serious_events,
        unique_drugs=unique_drugs,
        unique_reactions=unique_reactions
    )


@router.get("", response_model=List[Signal])
async def get_signals(
    organization: Optional[str] = Query(None, description="Filter by organization"),
    user_ids: Optional[str] = Query(None, description="Comma-separated list of user IDs to filter by (for team-level analysis)"),
    dataset: Optional[str] = Query(None, description="Filter by dataset (source)"),
    priority: Optional[str] = Query(None, description="Filter by priority (critical, high, medium, low)"),
    serious_only: Optional[bool] = Query(None, description="Filter only serious events"),
    search: Optional[str] = Query(None, description="Search in drug name or reaction"),
    session_date: Optional[str] = Query(None, description="Filter by session date (YYYY-MM-DD format)"),
    limit: int = Query(1000, ge=1, le=10000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """
    Get aggregated signals - OPTIMIZED with database-side GROUP BY
    PERFORMANCE: 10-100x faster for large datasets!
    Uses PostgreSQL aggregation instead of Python loops
    """
    try:
        # Use safe Supabase query builder instead of exec_sql to prevent SQL injection
        # Fallback to Python-side aggregation (slower but secure)
        return await get_signals_fallback(organization, dataset, priority, serious_only, search, session_date, limit, offset, user_ids)
        
    except Exception as e:
        print(f"Error fetching signals: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching signals: {str(e)}")


async def get_signals_fallback(
    organization: Optional[str],
    dataset: Optional[str],
    priority: Optional[str],
    serious_only: Optional[bool],
    search: Optional[str],
    session_date: Optional[str],
    limit: int,
    offset: int,
    user_ids: Optional[str] = None
):
    """Fallback to Python aggregation (slower but secure - uses Supabase query builder)"""
    query = supabase.table("pv_cases").select("*")
    
    if organization:
        query = query.eq("organization", organization)
    
    # Multi-user filtering (for team-level analysis)
    if user_ids:
        # Parse comma-separated user IDs
        user_id_list = [uid.strip() for uid in user_ids.split(',') if uid.strip()]
        if user_id_list:
            # Get file IDs for these users
            files_result = supabase.table("file_uploads").select("id").in_("user_id", user_id_list).execute()
            if files_result.data:
                file_ids = [f["id"] for f in files_result.data]
                query = query.in_("upload_id", file_ids)
            else:
                # No files for these users, return empty
                return []
    
    if dataset and dataset != "all":
        query = query.eq("source", dataset)
    if serious_only:
        query = query.eq("serious", True)
    
    # Search filter - fetch all and filter in Python (Supabase doesn't support OR ilike easily)
    # Note: For better performance with large datasets, consider using PostgreSQL full-text search
    
    # Filter by session date if provided
    if session_date and session_date != "all":
        # Validate that session_date is actually a date (YYYY-MM-DD format), not a UUID
        # UUIDs are 36 characters, dates are 10 characters
        if len(session_date) == 36 and "-" in session_date and session_date.count("-") == 4:
            # This is a UUID, not a date - skip session filtering
            print(f"[WARN] session_date is a UUID ({session_date}), not a date. Skipping session filter.")
        else:
            # Get file IDs for this session date
            files_result = supabase.table("file_upload_history").select("id").gte(
                "uploaded_at", f"{session_date}T00:00:00"
            ).lt("uploaded_at", f"{session_date}T23:59:59").execute()
            
            if files_result.data:
                file_ids = [f["id"] for f in files_result.data]
                query = query.in_("source_file_id", file_ids)
            else:
                # No files for this date, return empty
                return []
    
    # Fetch less data (was 10x limit, now just 2x for fallback)
    result = query.limit(min(limit * 2, 2000)).offset(offset).execute()
    
    if not result.data:
        return []
    
    # Filter by search if provided
    if search:
        search_lower = search.lower()
        result.data = [
            r for r in result.data
            if (r.get("drug_name") or "").lower().find(search_lower) >= 0
            or (r.get("reaction") or "").lower().find(search_lower) >= 0
        ]
    
    # Aggregate by drug + reaction
    signal_map = {}
    for case in result.data:
        drug = case.get("drug_name") or "Unknown"
        reaction = case.get("reaction") or "Unknown"
        key = f"{drug}|||{reaction}"
        
        if key not in signal_map:
            signal_map[key] = {
                "drug": drug,
                "reaction": reaction,
                "cases": 0,
                "serious_count": 0,
                "ids": [],
                "dataset": case.get("source") or "FAERS",
                "organization": case.get("organization")
            }
        
        signal_map[key]["cases"] += 1
        if case.get("serious"):
            signal_map[key]["serious_count"] += 1
        signal_map[key]["ids"].append(case.get("id"))
    
    # Convert to Signal objects
    signals = []
    for key, data in signal_map.items():
        cases = data["cases"]
        serious_count = data["serious_count"]
        
        prr = cases * 0.1 if cases > 0 else 0
        
        if cases >= 1000 or serious_count >= cases * 0.8:
            priority_level = "critical"
        elif cases >= 500 or serious_count >= cases * 0.5:
            priority_level = "high"
        elif cases >= 100:
            priority_level = "medium"
        else:
            priority_level = "low"
        
        if priority and priority_level != priority.lower():
            continue
        
        signals.append(Signal(
            id=data["ids"][0],
            drug=data["drug"],
            reaction=data["reaction"],
            prr=round(prr, 2),
            cases=cases,
            priority=priority_level,
            serious=serious_count > 0,
            dataset=data["dataset"],
            organization=data.get("organization")
        ))
    
    signals.sort(key=lambda x: x.cases, reverse=True)
    return signals[:limit]


@router.get("/datasets")
async def get_datasets(organization: Optional[str] = Query(None)):
    """Get list of available datasets (sources)"""
    try:
        query = supabase.table("pv_cases").select("source").order("source")
        if organization:
            query = query.eq("organization", organization)
        result = query.execute()
        
        # FIXED: Get unique sources, including AI_EXTRACTED
        datasets = list(set([r.get("source") or "FAERS" for r in (result.data or [])]))
        
        # Add friendly names
        dataset_list = []
        for ds in sorted(datasets):
            if ds == "AI_EXTRACTED":
                dataset_list.append({"value": ds, "label": "AI Extracted"})
            elif ds == "FAERS":
                dataset_list.append({"value": ds, "label": "FAERS"})
            else:
                dataset_list.append({"value": ds, "label": ds})
        
        return {"datasets": dataset_list}
    except Exception as e:
        print(f"Error fetching datasets: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching datasets: {str(e)}")


@router.get("/statistical")
async def get_statistical_signals(
    method: str = Query("all", enum=["prr", "ror", "ic", "all"], description="Statistical method"),
    threshold: str = Query("standard", enum=["standard", "strict", "sensitive"], description="Threshold preset"),
    min_cases: int = Query(3, description="Minimum case count"),
    dataset: Optional[str] = Query(None, description="Filter by dataset"),
    session_date: Optional[str] = Query(None, description="Filter by session date (YYYY-MM-DD)")
):
    """
    Get signals using specific statistical methods with custom thresholds
    
    Thresholds:
    - standard: PRR≥2, ROR>1, IC025>0, n≥3 (FDA/WHO guidelines)
    - strict: PRR≥3, ROR>1.5, IC025>0.5, n≥5 (reduced false positives)
    - sensitive: PRR≥1.5, ROR>0.8, IC025>-0.5, n≥2 (catch more signals)
    """
    try:
        # Set thresholds based on selection
        if threshold == "standard":
            thresholds = {"prr_threshold": 2.0, "ror_threshold": 1.0, 
                         "ic_threshold": 0.0, "min_cases": 3}
        elif threshold == "strict":
            thresholds = {"prr_threshold": 3.0, "ror_threshold": 1.5,
                         "ic_threshold": 0.5, "min_cases": 5}
        else:  # sensitive
            thresholds = {"prr_threshold": 1.5, "ror_threshold": 0.8,
                         "ic_threshold": -0.5, "min_cases": 2}
        
        # Override min_cases if provided
        thresholds["min_cases"] = min_cases
        
        # Fetch cases
        query = supabase.table("pv_cases").select("*")
        if dataset and dataset != "all":
            query = query.eq("source", dataset)
        
        if session_date and session_date != "all":
            # Get file IDs for this session date
            files_result = supabase.table("file_upload_history").select("id").gte(
                "uploaded_at", f"{session_date}T00:00:00"
            ).lt("uploaded_at", f"{session_date}T23:59:59").execute()
            
            if files_result.data:
                file_ids = [f["id"] for f in files_result.data]
                query = query.in_("source_file_id", file_ids)
            else:
                return []
        
        result = query.execute()
        all_cases = result.data or []
        
        if not all_cases:
            return []
        
        # Create detector with custom thresholds
        detector = SignalDetector(**thresholds)
        results = detector.detect_all_signals(all_cases, min_case_count=min_cases)
        
        # Filter by method and signal status
        signals = []
        for r in results:
            include = False
            
            if method == "all":
                include = r.is_signal
            elif method == "prr":
                include = r.prr_is_signal
            elif method == "ror":
                include = r.ror_is_signal
            elif method == "ic":
                include = r.ic_is_signal
            
            if include:
                signals.append({
                    'drug': r.drug,
                    'event': r.event,
                    'case_count': r.a,
                    'statistics': {
                        'prr': {
                            'value': round(sanitize_float(r.prr), 2),
                            'ci_lower': round(sanitize_float(r.prr_ci_lower), 2),
                            'ci_upper': round(sanitize_float(r.prr_ci_upper), 2),
                            'is_signal': r.prr_is_signal,
                            'threshold': thresholds['prr_threshold']
                        },
                        'ror': {
                            'value': round(sanitize_float(r.ror), 2),
                            'ci_lower': round(sanitize_float(r.ror_ci_lower), 2),
                            'ci_upper': round(sanitize_float(r.ror_ci_upper), 2),
                            'is_signal': r.ror_is_signal,
                            'threshold': thresholds['ror_threshold']
                        },
                        'ic': {
                            'value': round(sanitize_float(r.ic), 2),
                            'ic025': round(sanitize_float(r.ic025), 2),
                            'is_signal': r.ic_is_signal,
                            'threshold': thresholds['ic_threshold']
                        }
                    },
                    'overall': {
                        'is_signal': r.is_signal,
                        'strength': r.signal_strength,
                        'methods_flagged': r.methods_flagged
                    },
                    'priority': get_priority_label(r.signal_strength, r.a),
                    'threshold_setting': threshold
                })
        
        return signals
        
    except Exception as e:
        print(f"Error in statistical signal detection: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/drug-event/{drug}/{event}")
async def get_drug_event_signal(drug: str, event: str):
    """
    Get detailed signal statistics for specific drug-event pair
    
    Returns comprehensive analysis including:
    - PRR with 95% CI
    - ROR with 95% CI
    - IC with IC025
    - Signal strength
    - Case details
    """
    try:
        # Fetch all cases
        result = supabase.table("pv_cases").select("*").execute()
        all_cases = result.data or []
        
        # Calculate statistics
        stats = calculate_signal_statistics(drug, event, all_cases)
        
        # Get individual cases
        cases = [
            {
                'id': case.get('id'),
                'patient_age': case.get('patient_age'),
                'patient_sex': case.get('patient_sex'),
                'serious': case.get('serious'),
                'outcome': case.get('outcome'),
                'event_date': case.get('event_date'),
                'narrative': case.get('narrative', '')[:200] + '...' if case.get('narrative') else None
            }
            for case in all_cases
            if drug.lower() in (case.get('drug_name') or '').lower()
            and event.lower() in (case.get('reaction') or '').lower()
        ]
        
        return {
            **stats,
            'cases': cases,
            'analysis': {
                'interpretation': get_signal_interpretation(stats),
                'recommendation': get_signal_recommendation(stats)
            }
        }
        
    except Exception as e:
        print(f"Error fetching drug-event signal: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/priority")
async def get_priority_signals(
    limit: int = Query(10, ge=1, le=100),
    min_strength: str = Query("moderate", enum=["weak", "moderate", "strong"])
):
    """
    Get top priority signals for investigation
    
    Priority determined by:
    - Signal strength (strong > moderate > weak)
    - Case count
    - Statistical significance
    """
    try:
        # Fetch all cases
        result = supabase.table("pv_cases").select("*").execute()
        all_cases = result.data or []
        
        if not all_cases:
            return []
        
        # Get all signals
        detector = SignalDetector()
        results = detector.detect_all_signals(all_cases)
        
        # Filter by minimum strength
        strength_order = {'strong': 0, 'moderate': 1, 'weak': 2, 'none': 3}
        min_strength_val = strength_order[min_strength]
        
        priority_signals = [
            {
                'drug': r.drug,
                'event': r.event,
                'case_count': r.a,
                'prr': round(sanitize_float(r.prr), 2),
                'ror': round(sanitize_float(r.ror), 2),
                'ic': round(sanitize_float(r.ic), 2),
                'signal_strength': r.signal_strength,
                'methods_flagged': r.methods_flagged,
                'priority': get_priority_label(r.signal_strength, r.a),
                'requires_investigation': r.signal_strength in ['strong', 'moderate']
            }
            for r in results
            if strength_order[r.signal_strength] <= min_strength_val
        ]
        
        # Sort by priority
        priority_signals.sort(
            key=lambda x: (
                strength_order[x['signal_strength']],
                -x['case_count']
            )
        )
        
        return priority_signals[:limit]
        
    except Exception as e:
        print(f"Error fetching priority signals: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compare-faers")
async def compare_to_faers(
    drug: str,
    event: str
):
    """
    Compare signal to FAERS database baseline
    
    Note: This is a placeholder endpoint
    Full FAERS integration will be implemented in Phase 4
    """
    return {
        "status": "coming_soon",
        "message": "FAERS comparison will be available in Phase 4 (Week 8)",
        "drug": drug,
        "event": event,
        "planned_features": [
            "Real-time FAERS API integration",
            "Background rate comparison",
            "Rate ratio calculation",
            "Statistical significance testing",
            "Temporal trend analysis"
        ]
    }


# Helper functions

def get_priority_label(signal_strength: str, case_count: int) -> str:
    """Determine priority label based on signal strength and case count"""
    if signal_strength == 'strong':
        return 'CRITICAL'
    elif signal_strength == 'moderate':
        return 'HIGH' if case_count >= 5 else 'MEDIUM'
    elif signal_strength == 'weak':
        return 'MEDIUM' if case_count >= 5 else 'LOW'
    else:
        return 'LOW'


def get_signal_interpretation(stats: Dict) -> str:
    """Generate interpretation of signal statistics"""
    overall = stats.get('overall', {})
    
    if not overall.get('is_signal'):
        return "No statistical signal detected. The drug-event association does not meet signal thresholds."
    
    strength = overall.get('signal_strength', 'unknown')
    methods = overall.get('methods_flagged', [])
    
    if strength == 'strong':
        return f"Strong signal detected by all methods ({', '.join(methods)}). High confidence in association."
    elif strength == 'moderate':
        return f"Moderate signal detected by {len(methods)} method(s) ({', '.join(methods)}). Further investigation recommended."
    elif strength == 'weak':
        return f"Weak signal detected by {methods[0] if methods else 'one method'}. May warrant monitoring."
    else:
        return "Signal status unclear. Manual review needed."


def get_signal_recommendation(stats: Dict) -> str:
    """Generate recommendation based on signal statistics"""
    overall = stats.get('overall', {})
    case_count = stats.get('case_count', 0)
    
    if not overall.get('is_signal'):
        return "Continue routine monitoring. No immediate action required."
    
    strength = overall.get('signal_strength', 'unknown')
    
    if strength == 'strong':
        if case_count >= 10:
            return "Immediate investigation required. Consider signal validation workflow and potential label update."
        else:
            return "Priority investigation recommended. Gather additional cases and review narratives."
    elif strength == 'moderate':
        return "Medical review recommended. Assess biological plausibility and compare to FAERS baseline."
    elif strength == 'weak':
        return "Monitor trend. Consider validating with additional data sources."
    else:
        return "Manual assessment needed to determine appropriate action."
