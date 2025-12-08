"""
Session Management API
Tracks upload sessions, groups files, enables cross-session analytics
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
from supabase import create_client, Client
import uuid

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key)


class SessionSummary(BaseModel):
    id: str
    name: str
    started_at: datetime
    files_count: int
    cases_created: int
    valid_cases: int
    invalid_cases: int
    status: str
    is_current: bool = False


class SessionDetail(BaseModel):
    id: str
    name: str
    started_at: datetime
    files_count: int
    cases_created: int
    valid_cases: int
    invalid_cases: int
    status: str
    files: List[dict]
    stats: dict


class CreateSessionRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    organization: Optional[str] = None  # NEW: Organization for multi-tenant
    organization: Optional[str] = None  # NEW: Organization for multi-tenant


@router.post("/", response_model=SessionSummary)
async def create_session(request: CreateSessionRequest):
    """
    Create a new explicit upload session
    User can name it (e.g., "Trial ABC-123", "Q4 Batch Upload")
    
    For multi-tenant support, organization should be provided.
    """
    try:
        session_name = request.name or f"Session {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        session_data = {
            "name": session_name,
            "description": request.description,
            "started_at": datetime.now().isoformat(),
            "status": "active",
            "is_auto": False,
            "files_count": 0,
            "cases_created": 0,
            "valid_cases": 0,
            "invalid_cases": 0,
            "organization": request.organization  # NEW: Include organization
        }
        
        result = supabase.table("upload_sessions")\
            .insert(session_data)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create session")
        
        session = result.data[0]
        return SessionSummary(
            id=str(session["id"]),
            name=session["name"],
            started_at=datetime.fromisoformat(session["started_at"].replace("Z", "+00:00")),
            files_count=0,
            cases_created=0,
            valid_cases=0,
            invalid_cases=0,
            status="active",
            is_current=True
        )
        
    except Exception as e:
        print(f"Error creating session: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[SessionSummary])
async def get_sessions(
    limit: int = Query(50, ge=1, le=100),
    organization: Optional[str] = Query(None, description="Filter by organization (required for multi-tenant)"),
    user_id: Optional[str] = Query(None, description="Optional: Get user's organization if not provided")
):
    """
    Get upload sessions for an organization
    Returns both auto-created (by date) and user-created (named) sessions
    
    For multi-tenant support, organization parameter is recommended.
    If not provided and user_id is provided, will try to get organization from user.
    """
    try:
        # Build query
        query = supabase.table("upload_sessions")\
            .select("*")\
            .order("started_at", desc=True)\
            .limit(limit)
        
        # Filter by organization if provided
        if organization:
            query = query.eq("organization", organization)
        elif user_id:
            # Try to get user's organization from file_uploads or uploaded_files
            # This is a fallback - ideally organization should be provided
            try:
                user_file = supabase.table("file_uploads")\
                    .select("organization")\
                    .eq("user_id", user_id)\
                    .not_.is_("organization", "null")\
                    .limit(1)\
                    .execute()
                
                if user_file.data and len(user_file.data) > 0:
                    org = user_file.data[0].get("organization")
                    if org:
                        query = query.eq("organization", org)
            except:
                pass  # If can't get org, return all (not ideal but won't break)
        
        result = query.execute()
        
        if not result.data:
            return []
        
        sessions = []
        for i, session in enumerate(result.data):
            sessions.append(SessionSummary(
                id=str(session["id"]),
                name=session.get("name", "Unnamed Session"),
                started_at=datetime.fromisoformat(session["started_at"].replace("Z", "+00:00")),
                files_count=session.get("files_count", 0) or 0,
                cases_created=session.get("cases_created", 0) or 0,
                valid_cases=session.get("valid_cases", 0) or 0,
                invalid_cases=session.get("invalid_cases", 0) or 0,
                status=session.get("status", "completed"),
                is_current=(i == 0 and session.get("status") == "active")
            ))
        
        return sessions
        
    except Exception as e:
        print(f"Error fetching sessions: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}", response_model=SessionDetail)
async def get_session_detail(session_id: str):
    """
    Get detailed information about a specific session
    Includes all files and aggregated statistics
    """
    try:
        # Get session from upload_sessions table
        session_result = supabase.table("upload_sessions")\
            .select("*")\
            .eq("id", session_id)\
            .execute()
        
        if not session_result.data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = session_result.data[0]
        
        # Get files for this session from file_uploads table
        files_result = supabase.table("file_uploads")\
            .select("*")\
            .eq("session_id", session_id)\
            .order("uploaded_at", desc=True)\
            .execute()
        
        session_files = files_result.data or []
        
        # Use session stats from table (cached) or calculate from files
        files_count = session.get("files_count", 0) or len(session_files)
        cases_created = session.get("cases_created", 0) or sum(f.get("cases_created", 0) or 0 for f in session_files)
        valid_cases = session.get("valid_cases", 0) or sum(f.get("cases_valid", 0) or 0 for f in session_files)
        invalid_cases = session.get("invalid_cases", 0) or sum(f.get("cases_invalid", 0) or 0 for f in session_files)
        
        status = session.get("status", "completed")
        if any(f.get("status") == "processing" for f in session_files):
            status = "processing"
        elif any(f.get("status") == "error" for f in session_files):
            status = "partial"
        
        # Get cases for this session
        case_ids = []
        for f in session_files:
            if f.get("id"):
                cases_query = supabase.table("pv_cases").select(
                    "id, drug_name, reaction, serious"
                ).eq("upload_id", f["id"]).execute()
                case_ids.extend(cases_query.data or [])
        
        # Calculate stats
        serious_count = sum(1 for c in case_ids if c.get("serious"))
        unique_drugs = len(set(c.get("drug_name") for c in case_ids if c.get("drug_name")))
        unique_reactions = len(set(c.get("reaction") for c in case_ids if c.get("reaction")))
        
        return SessionDetail(
            id=str(session["id"]),
            name=session.get("name", "Unnamed Session"),
            started_at=datetime.fromisoformat(session["started_at"].replace("Z", "+00:00")),
            files_count=files_count,
            cases_created=cases_created,
            valid_cases=valid_cases,
            invalid_cases=invalid_cases,
            status=status,
            files=[
                {
                    "id": str(f.get("id", "")),
                    "filename": f.get("filename", ""),
                    "status": f.get("status", "unknown"),
                    "cases": f.get("cases_created", 0) or 0,
                    "uploaded_at": f.get("uploaded_at", "")
                }
                for f in session_files
            ],
            stats={
                "total_cases": cases_created,
                "serious_events": serious_count,
                "unique_drugs": unique_drugs,
                "unique_reactions": unique_reactions,
                "valid_cases": valid_cases,
                "invalid_cases": invalid_cases
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching session detail: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/current/summary")
async def get_current_session_summary():
    """
    Get summary of the current session (today's uploads)
    """
    try:
        today = datetime.now().date().isoformat()
        
        result = supabase.table("file_upload_history").select(
            "id, filename, cases_created, upload_status, uploaded_at"
        ).gte("uploaded_at", f"{today}T00:00:00").execute()
        
        files = result.data or []
        
        return {
            "session_id": today,
            "files_count": len(files),
            "cases_created": sum(f.get("cases_created", 0) or 0 for f in files),
            "processing": sum(1 for f in files if f.get("upload_status") == "processing"),
            "completed": sum(1 for f in files if f.get("upload_status") == "completed"),
            "failed": sum(1 for f in files if f.get("upload_status") == "failed"),
            "files": files
        }
        
    except Exception as e:
        print(f"Error fetching current session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/cross-session")
async def get_cross_session_analytics(
    drug: Optional[str] = Query(None),
    reaction: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """
    Analyze patterns across multiple sessions
    Enables trend detection and comparative analytics
    """
    try:
        # Build query
        query = supabase.table("pv_cases").select(
            "id, drug_name, reaction, serious, created_at, source_file_id"
        )
        
        if drug:
            query = query.ilike("drug_name", f"%{drug}%")
        if reaction:
            query = query.ilike("reaction", f"%{reaction}%")
        if start_date:
            query = query.gte("created_at", start_date)
        if end_date:
            query = query.lte("created_at", end_date)
        
        result = query.order("created_at", desc=False).execute()
        cases = result.data or []
        
        # Group by date (session)
        timeline = {}
        for case in cases:
            created_date = case.get("created_at", "")[:10]
            if created_date not in timeline:
                timeline[created_date] = {
                    "date": created_date,
                    "total_cases": 0,
                    "serious_cases": 0,
                    "unique_drugs": set(),
                    "unique_reactions": set()
                }
            
            timeline[created_date]["total_cases"] += 1
            if case.get("serious"):
                timeline[created_date]["serious_cases"] += 1
            if case.get("drug_name"):
                timeline[created_date]["unique_drugs"].add(case["drug_name"])
            if case.get("reaction"):
                timeline[created_date]["unique_reactions"].add(case["reaction"])
        
        # Convert sets to counts
        timeline_list = [
            {
                "date": data["date"],
                "total_cases": data["total_cases"],
                "serious_cases": data["serious_cases"],
                "unique_drugs": len(data["unique_drugs"]),
                "unique_reactions": len(data["unique_reactions"])
            }
            for data in sorted(timeline.values(), key=lambda x: x["date"])
        ]
        
        # Calculate trend
        if len(timeline_list) >= 2:
            recent_avg = sum(d["total_cases"] for d in timeline_list[-3:]) / min(3, len(timeline_list))
            older_avg = sum(d["total_cases"] for d in timeline_list[:3]) / min(3, len(timeline_list))
            trend = "increasing" if recent_avg > older_avg else "decreasing" if recent_avg < older_avg else "stable"
        else:
            trend = "insufficient_data"
        
        return {
            "timeline": timeline_list,
            "summary": {
                "total_cases": len(cases),
                "total_sessions": len(timeline),
                "trend": trend,
                "avg_cases_per_session": len(cases) / len(timeline) if timeline else 0
            }
        }
        
    except Exception as e:
        print(f"Error in cross-session analytics: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

