"""
Duplicate Detection API for File Uploads
Checks for duplicate files using MD5/SHA-256 hashes and provides merge/skip/replace options
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
import hashlib
import os
from datetime import datetime
from supabase import create_client, Client
import logging

router = APIRouter(prefix="/api/v1/upload", tags=["upload"])

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

logger = logging.getLogger(__name__)


class DuplicateCheckRequest(BaseModel):
    filename: str
    hash: str
    size: int


class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    existing_upload_id: Optional[str] = None
    existing_filename: Optional[str] = None
    uploaded_at: Optional[str] = None
    cases_count: Optional[int] = None


def calculate_file_hash(file_content: bytes) -> str:
    """Calculate SHA-256 hash of file content"""
    return hashlib.sha256(file_content).hexdigest()


@router.post("/check-duplicate")
async def check_duplicate(request: DuplicateCheckRequest) -> DuplicateCheckResponse:
    """
    Check if file is a duplicate based on hash
    
    Args:
        request: Contains filename, hash, and size
    
    Returns:
        DuplicateCheckResponse with duplicate status and details
    """
    try:
        # Check in file_uploads table for matching hash
        result = supabase.table("file_uploads")\
            .select("*")\
            .eq("file_hash", request.hash)\
            .execute()
        
        if result.data and len(result.data) > 0:
            existing = result.data[0]
            
            # Count cases from this upload
            cases_result = supabase.table("pv_cases")\
                .select("id", count="exact")\
                .eq("upload_id", existing["id"])\
                .execute()
            
            return DuplicateCheckResponse(
                is_duplicate=True,
                existing_upload_id=existing["id"],
                existing_filename=existing["filename"],
                uploaded_at=existing["uploaded_at"],
                cases_count=cases_result.count
            )
        
        return DuplicateCheckResponse(is_duplicate=False)
        
    except Exception as e:
        logger.error(f"Error checking duplicate: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    duplicate_action: Optional[str] = Form(None)
):
    """
    Upload file with duplicate handling
    
    Args:
        file: Uploaded file
        duplicate_action: 'skip', 'replace', or 'keep' for duplicates
    
    Returns:
        Upload result with cases created
    """
    try:
        # Read file content
        content = await file.read()
        file_hash = calculate_file_hash(content)
        
        # Check for duplicates
        existing = supabase.table("file_uploads")\
            .select("*")\
            .eq("file_hash", file_hash)\
            .execute()
        
        if existing.data and len(existing.data) > 0:
            existing_upload = existing.data[0]
            
            if duplicate_action == 'skip':
                return {
                    "status": "skipped",
                    "message": "File skipped - duplicate detected",
                    "existing_upload_id": existing_upload["id"]
                }
            
            elif duplicate_action == 'replace':
                # Delete old cases
                supabase.table("pv_cases")\
                    .delete()\
                    .eq("upload_id", existing_upload["id"])\
                    .execute()
                
                # Delete old upload record
                supabase.table("file_uploads")\
                    .delete()\
                    .eq("id", existing_upload["id"])\
                    .execute()
                
                logger.info(f"Replaced duplicate file: {file.filename}")
            
            # If 'keep', proceed with upload as new file
        
        # Save file
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Create upload record
        upload_record = {
            "filename": file.filename,
            "file_path": file_path,
            "file_hash": file_hash,
            "file_size": len(content),
            "uploaded_at": datetime.now().isoformat(),
            "status": "uploaded"
        }
        
        upload_result = supabase.table("file_uploads")\
            .insert(upload_record)\
            .execute()
        
        upload_id = upload_result.data[0]["id"]
        
        # Process file (simplified - actual processing would be more complex)
        # This would call your existing file processing logic
        
        return {
            "status": "success",
            "upload_id": upload_id,
            "filename": file.filename,
            "file_hash": file_hash,
            "duplicate_action": duplicate_action,
            "cases_created": 0,  # Would be filled by actual processing
            "valid_cases": 0,
            "invalid_cases": 0,
            "message": "File uploaded successfully"
        }
        
    except Exception as e:
        logger.error(f"Error uploading file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_upload_history(limit: int = 50):
    """
    Get upload history with duplicate information
    
    Args:
        limit: Maximum number of records to return
    
    Returns:
        List of upload records
    """
    try:
        result = supabase.table("file_uploads")\
            .select("*")\
            .order("uploaded_at", desc=True)\
            .limit(limit)\
            .execute()
        
        uploads = []
        for upload in result.data:
            # Count cases
            cases_result = supabase.table("pv_cases")\
                .select("id", count="exact")\
                .eq("upload_id", upload["id"])\
                .execute()
            
            # Check if this hash appears multiple times (has duplicates)
            duplicate_count = supabase.table("file_uploads")\
                .select("id", count="exact")\
                .eq("file_hash", upload["file_hash"])\
                .execute()
            
            uploads.append({
                **upload,
                "cases_count": cases_result.count,
                "has_duplicates": duplicate_count.count > 1,
                "duplicate_count": duplicate_count.count
            })
        
        return uploads
        
    except Exception as e:
        logger.error(f"Error fetching upload history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/duplicates")
async def find_all_duplicates():
    """
    Find all duplicate files in the system
    
    Returns:
        Groups of duplicate files
    """
    try:
        # Get all uploads
        result = supabase.table("file_uploads")\
            .select("*")\
            .execute()
        
        # Group by hash
        hash_groups = {}
        for upload in result.data:
            file_hash = upload["file_hash"]
            if file_hash not in hash_groups:
                hash_groups[file_hash] = []
            hash_groups[file_hash].append(upload)
        
        # Filter to only duplicates (more than 1 file with same hash)
        duplicates = {
            hash_val: files
            for hash_val, files in hash_groups.items()
            if len(files) > 1
        }
        
        return {
            "total_duplicate_groups": len(duplicates),
            "total_duplicate_files": sum(len(files) for files in duplicates.values()),
            "groups": [
                {
                    "hash": hash_val,
                    "count": len(files),
                    "files": files
                }
                for hash_val, files in duplicates.items()
            ]
        }
        
    except Exception as e:
        logger.error(f"Error finding duplicates: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{upload_id}")
async def delete_upload(upload_id: str):
    """
    Delete an upload and all associated cases
    
    Args:
        upload_id: ID of upload to delete
    
    Returns:
        Deletion result
    """
    try:
        # Delete cases first
        cases_result = supabase.table("pv_cases")\
            .delete()\
            .eq("upload_id", upload_id)\
            .execute()
        
        # Delete upload
        upload_result = supabase.table("file_uploads")\
            .delete()\
            .eq("id", upload_id)\
            .execute()
        
        return {
            "status": "success",
            "upload_id": upload_id,
            "cases_deleted": len(cases_result.data) if cases_result.data else 0,
            "message": "Upload and associated cases deleted"
        }
        
    except Exception as e:
        logger.error(f"Error deleting upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{upload_id}/merge")
async def merge_duplicates(upload_id: str, merge_with_id: str):
    """
    Merge two duplicate uploads
    
    Args:
        upload_id: Primary upload ID to keep
        merge_with_id: Duplicate upload ID to merge from
    
    Returns:
        Merge result
    """
    try:
        # Update cases from merge_with_id to upload_id
        update_result = supabase.table("pv_cases")\
            .update({"upload_id": upload_id})\
            .eq("upload_id", merge_with_id)\
            .execute()
        
        # Delete the merged upload
        supabase.table("file_uploads")\
            .delete()\
            .eq("id", merge_with_id)\
            .execute()
        
        return {
            "status": "success",
            "primary_upload_id": upload_id,
            "merged_upload_id": merge_with_id,
            "cases_merged": len(update_result.data) if update_result.data else 0,
            "message": "Uploads merged successfully"
        }
        
    except Exception as e:
        logger.error(f"Error merging uploads: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
