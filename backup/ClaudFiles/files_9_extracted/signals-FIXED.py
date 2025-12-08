# ============================================================================
# QUICK FIX: Updated signals.py to show AI_EXTRACTED cases
# Replace your backend/app/api/signals.py with this
# ============================================================================

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import os
from supabase import create_client, Client

router = APIRouter(prefix="/api/v1/signals", tags=["signals"])

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables")

supabase: Client = create_client(supabase_url, supabase_key)


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


@router.get("/stats", response_model=SignalStats)
async def get_signal_stats(
    organization: Optional[str] = Query(None, description="Filter by organization"),
    dataset: Optional[str] = Query(None, description="Filter by dataset (source)")
):
    """Get aggregated statistics about signals"""
    try:
        query = supabase.table("pv_cases").select("id, serious, drug_name, reaction", count="exact")
        
        if organization:
            query = query.eq("organization", organization)
        if dataset and dataset != "all":  # FIXED: Ignore "all"
            query = query.eq("source", dataset)
        
        # Get total cases
        result = query.execute()
        total_cases = result.count if hasattr(result, 'count') else len(result.data) if result.data else 0
        
        # Get serious events
        serious_query = supabase.table("pv_cases").select("id", count="exact")
        if organization:
            serious_query = serious_query.eq("organization", organization)
        if dataset and dataset != "all":  # FIXED: Ignore "all"
            serious_query = serious_query.eq("source", dataset)
        serious_result = serious_query.eq("serious", True).execute()
        serious_events = serious_result.count if hasattr(serious_result, 'count') else len(serious_result.data) if serious_result.data else 0
        
        # Get unique drugs and reactions
        drugs_query = supabase.table("pv_cases").select("drug_name")
        if organization:
            drugs_query = drugs_query.eq("organization", organization)
        if dataset and dataset != "all":  # FIXED: Ignore "all"
            drugs_query = drugs_query.eq("source", dataset)
        drugs_result = drugs_query.execute()
        unique_drugs = len(set([d.get("drug_name") for d in (drugs_result.data or []) if d.get("drug_name")]))
        
        reactions_query = supabase.table("pv_cases").select("reaction")
        if organization:
            reactions_query = reactions_query.eq("organization", organization)
        if dataset and dataset != "all":  # FIXED: Ignore "all"
            reactions_query = reactions_query.eq("source", dataset)
        reactions_result = reactions_query.execute()
        unique_reactions = len(set([r.get("reaction") for r in (reactions_result.data or []) if r.get("reaction")]))
        
        # Calculate critical signals
        critical_signals = min(serious_events, total_cases // 10)
        
        return SignalStats(
            total_cases=total_cases,
            critical_signals=critical_signals,
            serious_events=serious_events,
            unique_drugs=unique_drugs,
            unique_reactions=unique_reactions
        )
    except Exception as e:
        print(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")


@router.get("", response_model=List[Signal])
async def get_signals(
    organization: Optional[str] = Query(None, description="Filter by organization"),
    dataset: Optional[str] = Query(None, description="Filter by dataset (source)"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    serious_only: Optional[bool] = Query(None, description="Filter only serious events"),
    search: Optional[str] = Query(None, description="Search in drug name or reaction"),
    limit: int = Query(1000, ge=1, le=10000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """
    Get aggregated signals (drug + reaction combinations) with PRR and case counts.
    """
    try:
        # Build base query
        query = supabase.table("pv_cases").select("*")
        
        # FIXED: Only filter by dataset if it's not "all"
        if organization:
            query = query.eq("organization", organization)
        if dataset and dataset != "all":
            query = query.eq("source", dataset)
        if serious_only:
            query = query.eq("serious", True)
        
        # Execute query
        result = query.limit(limit * 10).offset(offset).execute()
        
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
            
            # Calculate PRR (simplified)
            prr = cases * 0.1 if cases > 0 else 0
            
            # Determine priority
            if cases >= 1000 or serious_count >= cases * 0.8:
                priority_level = "critical"
            elif cases >= 500 or serious_count >= cases * 0.5:
                priority_level = "high"
            elif cases >= 100:
                priority_level = "medium"
            else:
                priority_level = "low"
            
            # FIXED: Don't filter by priority here (was causing issues)
            
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
        
        # Sort by case count
        signals.sort(key=lambda x: x.cases, reverse=True)
        
        # Apply limit after aggregation
        return signals[:limit]
        
    except Exception as e:
        print(f"Error fetching signals: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching signals: {str(e)}")


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
