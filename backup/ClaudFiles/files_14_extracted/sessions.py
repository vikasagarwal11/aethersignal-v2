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


@router.get("/", response_model=List[SessionSummary])
async def get_sessions(
    limit: int = Query(50, ge=1, le=100),
    user_id: Optional[str] = Query(None)
):
    """
    Get all upload sessions, ordered by most recent first
    Groups files by upload session for cross-session analytics
    """
    try:
        # Get or create upload_sessions table data from file_upload_history
        # We'll group by date for now (can add explicit sessions later)
        
        query = """
        SELECT 
            DATE(uploaded_at) as session_date,
            COUNT(*) as files_count,
            SUM(COALESCE(cases_created, 0)) as cases_created,
            SUM(COALESCE(total_valid_cases, 0)) as valid_cases,
            SUM(COALESCE(total_invalid_cases, 0)) as invalid_cases,
            CASE 
                WHEN SUM(CASE WHEN upload_status = 'processing' THEN 1 ELSE 0 END) > 0 THEN 'processing'
                WHEN SUM(CASE WHEN upload_status = 'failed' THEN 1 ELSE 0 END) > 0 THEN 'partial'
                ELSE 'completed'
            END as status
        FROM file_upload_history
        GROUP BY DATE(uploaded_at)
        ORDER BY session_date DESC
        LIMIT {limit}
        """
        
        # For now, use simple date grouping
        # In production, add proper session_id to file_upload_history
        result = supabase.table("file_upload_history").select(
            "uploaded_at, cases_created, total_valid_cases, total_invalid_cases, upload_status"
        ).order("uploaded_at", desc=True).limit(limit * 10).execute()
        
        if not result.data:
            return []
        
        # Group by date
        sessions_map = {}
        for file in result.data:
            upload_date = file.get("uploaded_at", "")
            if not upload_date:
                continue
                
            # Extract date part
            session_date = upload_date.split("T")[0] if "T" in upload_date else upload_date[:10]
            
            if session_date not in sessions_map:
                sessions_map[session_date] = {
                    "id": session_date,
                    "name": f"Session {session_date}",
                    "started_at": upload_date,
                    "files_count": 0,
                    "cases_created": 0,
                    "valid_cases": 0,
                    "invalid_cases": 0,
                    "status": "completed"
                }
            
            sessions_map[session_date]["files_count"] += 1
            sessions_map[session_date]["cases_created"] += file.get("cases_created", 0) or 0
            sessions_map[session_date]["valid_cases"] += file.get("total_valid_cases", 0) or 0
            sessions_map[session_date]["invalid_cases"] += file.get("total_invalid_cases", 0) or 0
            
            if file.get("upload_status") == "processing":
                sessions_map[session_date]["status"] = "processing"
            elif file.get("upload_status") == "failed":
                sessions_map[session_date]["status"] = "partial"
        
        # Convert to list and sort
        sessions = [
            SessionSummary(
                **data,
                is_current=(i == 0)  # First (most recent) is current
            )
            for i, data in enumerate(sorted(
                sessions_map.values(),
                key=lambda x: x["started_at"],
                reverse=True
            ))
        ]
        
        return sessions[:limit]
        
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
        # Get files for this session (grouped by date)
        query = supabase.table("file_upload_history").select("*")
        
        # Filter by date (session_id is currently date string)
        # In production, filter by actual session_id field
        result = query.execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Filter files by date
        session_files = [
            f for f in result.data
            if f.get("uploaded_at", "").startswith(session_id)
        ]
        
        if not session_files:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Aggregate stats
        files_count = len(session_files)
        cases_created = sum(f.get("cases_created", 0) or 0 for f in session_files)
        valid_cases = sum(f.get("total_valid_cases", 0) or 0 for f in session_files)
        invalid_cases = sum(f.get("total_invalid_cases", 0) or 0 for f in session_files)
        
        status = "completed"
        if any(f.get("upload_status") == "processing" for f in session_files):
            status = "processing"
        elif any(f.get("upload_status") == "failed" for f in session_files):
            status = "partial"
        
        # Get cases for this session
        case_ids = []
        for f in session_files:
            if f.get("id"):
                cases_query = supabase.table("pv_cases").select(
                    "id, drug_name, reaction, serious"
                ).eq("source_file_id", f["id"]).execute()
                case_ids.extend(cases_query.data or [])
        
        # Calculate stats
        serious_count = sum(1 for c in case_ids if c.get("serious"))
        unique_drugs = len(set(c.get("drug_name") for c in case_ids if c.get("drug_name")))
        unique_reactions = len(set(c.get("reaction") for c in case_ids if c.get("reaction")))
        
        return SessionDetail(
            id=session_id,
            name=f"Session {session_id}",
            started_at=session_files[0].get("uploaded_at"),
            files_count=files_count,
            cases_created=cases_created,
            valid_cases=valid_cases,
            invalid_cases=invalid_cases,
            status=status,
            files=[
                {
                    "id": f.get("id"),
                    "filename": f.get("filename"),
                    "status": f.get("upload_status"),
                    "cases": f.get("cases_created", 0),
                    "uploaded_at": f.get("uploaded_at")
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
