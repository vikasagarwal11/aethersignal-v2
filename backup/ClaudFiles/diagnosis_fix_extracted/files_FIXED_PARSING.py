from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import os
import hashlib
import uuid
from pathlib import Path
import asyncio
import json
from supabase import create_client, Client

router = APIRouter(prefix="/api/v1/files", tags=["files"])

# Initialize Supabase client (prefer SERVICE_KEY for write access, fallback to ANON_KEY)
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) must be set in environment variables")

supabase: Client = create_client(supabase_url, supabase_key)

# Initialize Anthropic client (optional - will fail gracefully if not set)
anthropic_client = None
try:
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    if anthropic_api_key:
        import anthropic
        anthropic_client = anthropic.Anthropic(api_key=anthropic_api_key)
except Exception as e:
    print(f"Warning: Anthropic client not initialized: {e}")

# Create uploads directory if it doesn't exist
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

# Supported file formats
SUPPORTED_FORMATS = {
    'pdf': ['.pdf'],
    'document': ['.doc', '.docx', '.txt', '.rtf'],
    'spreadsheet': ['.xls', '.xlsx', '.csv'],
    'email': ['.eml', '.msg'],
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
    'audio': ['.mp3', '.wav', '.m4a'],
    'archive': ['.zip', '.rar', '.7z'],
    'xml': ['.xml'],
}


class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    file_size: int
    status: str
    message: str


class FileStatusResponse(BaseModel):
    file_id: str
    filename: str
    status: str
    progress: Optional[int] = None
    message: Optional[str] = None
    cases_created: Optional[int] = None
    error: Optional[str] = None


def calculate_file_hash(file_path: Path) -> str:
    """Calculate MD5 hash of file"""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def detect_file_type(filename: str) -> str:
    """Detect file type from extension and return category"""
    ext = Path(filename).suffix.lower()
    
    # Map to category format used by AI processing
    for category, extensions in SUPPORTED_FORMATS.items():
        if ext in extensions:
            return category
    
    return "unknown"


async def extract_content(file_path: str, file_type: str) -> str:
    """
    Extract text content from different file types
    """
    try:
        if file_type == "pdf":
            import pdfplumber
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
            return text
        
        elif file_type == "document":
            # Try Word document first
            if file_path.endswith('.docx'):
                from docx import Document
                doc = Document(file_path)
                text = "\n".join([para.text for para in doc.paragraphs])
                return text
            else:
                # Plain text
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
        
        elif file_type == "spreadsheet":
            import pandas as pd
            df = pd.read_excel(file_path)
            text = df.to_string()
            return text
        
        elif file_type == "email":
            import email
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                msg = email.message_from_file(f)
                text = f"From: {msg['from']}\nSubject: {msg['subject']}\n\n{msg.get_payload()}"
                return text
        
        elif file_type == "image":
            # OCR for images
            try:
                import pytesseract
                from PIL import Image
                img = Image.open(file_path)
                text = pytesseract.image_to_string(img)
                return text
            except Exception as e:
                print(f"OCR error: {e}")
                return f"[Image file - OCR not available: {e}]"
        
        elif file_type == "archive":
            # Extract and process ZIP files
            import zipfile
            import tempfile
            import shutil
            
            extracted_text = []
            temp_dir = None
            
            try:
                # Create temporary directory for extraction
                temp_dir = tempfile.mkdtemp()
                
                with zipfile.ZipFile(file_path, 'r') as zip_ref:
                    # Extract all files
                    zip_ref.extractall(temp_dir)
                    
                    # Process each extracted file
                    for root, dirs, files in os.walk(temp_dir):
                        for file in files:
                            file_path_in_zip = os.path.join(root, file)
                            file_ext = Path(file).suffix.lower()
                            
                            # Determine file type and extract content
                            extracted_file_type = detect_file_type(file)
                            
                            if extracted_file_type != "unknown" and extracted_file_type != "archive":
                                # Recursively extract content from this file
                                try:
                                    content = await extract_content(file_path_in_zip, extracted_file_type)
                                    if content and content.strip():
                                        extracted_text.append(f"\n--- File: {file} ---\n{content}\n")
                                except Exception as e:
                                    extracted_text.append(f"\n--- File: {file} (Error: {str(e)}) ---\n")
                            elif extracted_file_type == "archive":
                                # Nested archive - skip for now to avoid infinite recursion
                                extracted_text.append(f"\n--- File: {file} (Nested archive - skipped) ---\n")
                            else:
                                # Unknown file type - try reading as text
                                try:
                                    with open(file_path_in_zip, 'r', encoding='utf-8', errors='ignore') as f:
                                        content = f.read()
                                        if content.strip():
                                            extracted_text.append(f"\n--- File: {file} ---\n{content}\n")
                                except:
                                    pass
                
                return "\n".join(extracted_text) if extracted_text else "[ZIP file extracted but no readable content found]"
            
            except zipfile.BadZipFile:
                return f"[Error: Not a valid ZIP file]"
            except Exception as e:
                print(f"ZIP extraction error: {e}")
                return f"[Error extracting ZIP file: {str(e)}]"
            finally:
                # Clean up temporary directory
                if temp_dir and os.path.exists(temp_dir):
                    try:
                        shutil.rmtree(temp_dir)
                    except:
                        pass
        
        else:
            # Fallback: try reading as text
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
    
    except Exception as e:
        print(f"Content extraction error: {e}")
        return f"[Error extracting content: {str(e)}]"


async def extract_entities_with_ai(content: str) -> List[dict]:
    """
    Use Claude to extract pharmacovigilance entities from text
    """
    if not anthropic_client:
        print("Warning: Anthropic client not available, returning empty entities")
        return []
    
    prompt = f"""
You are a pharmacovigilance expert. Extract adverse event case information from the following text.

Text:
{content[:10000]}

Extract the following information for each adverse event case found:
- Patient demographics (age, sex)
- Drug information (name, dose, route, frequency)
- Adverse reactions (description, onset, severity, outcome)
- Seriousness (is it a serious adverse event?)

Return ONLY a JSON array of cases. Each case should have this structure:
{{
  "patient": {{
    "age": "number or null",
    "sex": "M/F/Unknown"
  }},
  "drug": {{
    "name": "drug name",
    "dose": "dose string or null"
  }},
  "reaction": {{
    "description": "reaction description",
    "severity": "mild/moderate/severe/unknown"
  }},
  "serious": true/false,
  "confidence": 0.85,
  "narrative": "brief case narrative in past tense"
}}

IMPORTANT: Return ONLY the JSON array, no extra text before or after.
If no adverse events found, return empty array [].
"""
    
    try:
        message = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Parse JSON response with robust error handling
        response_text = message.content[0].text
        
        # Try multiple parsing strategies
        entities = None
        
        # Strategy 1: Extract from markdown code blocks (```json ... ```)
        if entities is None and "```json" in response_text:
            try:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
                entities = json.loads(json_str)
                print(f"✓ Parsed from markdown json block")
            except Exception as e:
                print(f"Strategy 1 failed: {e}")
        
        # Strategy 2: Extract from generic code blocks (``` ... ```)
        if entities is None and "```" in response_text:
            try:
                json_str = response_text.split("```")[1].split("```")[0].strip()
                entities = json.loads(json_str)
                print(f"✓ Parsed from generic code block")
            except Exception as e:
                print(f"Strategy 2 failed: {e}")
        
        # Strategy 3: Find first [ or { and parse from there
        if entities is None:
            try:
                # Find first JSON array or object
                start_idx = -1
                for char in ['[', '{']:
                    idx = response_text.find(char)
                    if idx != -1 and (start_idx == -1 or idx < start_idx):
                        start_idx = idx
                
                if start_idx != -1:
                    # Try to find the end by counting brackets
                    json_str = response_text[start_idx:]
                    # Remove any trailing text after the JSON
                    entities = json.loads(json_str)
                    print(f"✓ Parsed from first bracket at position {start_idx}")
            except Exception as e:
                print(f"Strategy 3 failed: {e}")
        
        # Strategy 4: Try parsing the whole response as-is
        if entities is None:
            try:
                entities = json.loads(response_text.strip())
                print(f"✓ Parsed whole response directly")
            except Exception as e:
                print(f"Strategy 4 failed: {e}")
        
        # Strategy 5: Try to extract JSON more aggressively
        if entities is None:
            try:
                import re
                # Look for array or object pattern
                json_pattern = r'(\[[\s\S]*\]|\{[\s\S]*\})'
                match = re.search(json_pattern, response_text)
                if match:
                    json_str = match.group(1)
                    entities = json.loads(json_str)
                    print(f"✓ Parsed using regex pattern matching")
            except Exception as e:
                print(f"Strategy 5 failed: {e}")
        
        # If all parsing failed, log response and return empty list
        if entities is None:
            print(f"❌ All parsing strategies failed!")
            print(f"Raw response (first 500 chars): {response_text[:500]}")
            print(f"Raw response (last 100 chars): {response_text[-100:]}")
            return []
        
        # Validate and return
        result = entities if isinstance(entities, list) else [entities]
        print(f"✓ Successfully extracted {len(result)} entities")
        return result
    
    except Exception as e:
        print(f"AI extraction error: {e}")
        import traceback
        traceback.print_exc()
        return []
async def create_cases_from_entities(entities: List[dict], file_id: str) -> List[str]:
    """
    Create pv_cases records from extracted entities
    """
    case_ids = []
    
    for entity in entities:
        try:
            case_data = {
                "user_id": None,  # NULL - fields are now nullable
                "organization": None,  # NULL - fields are now nullable
                "drug_name": entity.get("drug", {}).get("name", "Unknown"),
                "reaction": entity.get("reaction", {}).get("description", "Unknown"),
                "age": entity.get("patient", {}).get("age"),
                "sex": entity.get("patient", {}).get("sex"),
                "serious": entity.get("serious", False),
                "source": "AI_EXTRACTED",
                "source_file_id": file_id,
                "narrative": entity.get("narrative", ""),
                "ai_extracted": True,
                "ai_confidence": entity.get("confidence", 0.5),
            }
            
            result = supabase.table("pv_cases").insert(case_data).execute()
            
            if result.data:
                case_ids.append(result.data[0]["id"])
        
        except Exception as e:
            print(f"Error creating case: {e}")
            continue
    
    return case_ids


async def auto_code_cases(case_ids: List[str]):
    """
    Auto-code cases with MedDRA terms using AI (placeholder)
    """
    # Future: Implement MedDRA coding
    pass


async def process_file_ai(file_id: str, file_path: Path, filename: str):
    """
    Background task to process file with AI
    """
    try:
        # Update status to processing
        supabase.table("file_upload_history").update({
            "upload_status": "processing",
            "progress": 10,
            "status_message": "Extracting content...",
            "processing_started_at": datetime.now().isoformat()
        }).eq("id", file_id).execute()

        # Step 1: Extract content based on file type
        file_ext = Path(filename).suffix.lower()
        file_type = detect_file_type(filename)
        
        content = await extract_content(str(file_path), file_type)
        
        if not content or len(content.strip()) == 0:
            raise Exception("No content extracted from file")
        
        supabase.table("file_upload_history").update({
            "progress": 30,
            "status_message": "AI extracting entities..."
        }).eq("id", file_id).execute()
        
        # Step 2: AI entity extraction
        entities = await extract_entities_with_ai(content)
        
        supabase.table("file_upload_history").update({
            "progress": 60,
            "status_message": "Creating cases..."
        }).eq("id", file_id).execute()
        
        # Step 3: Create cases
        cases_created = await create_cases_from_entities(entities, file_id)
        
        supabase.table("file_upload_history").update({
            "progress": 90,
            "status_message": "Auto-coding with MedDRA..."
        }).eq("id", file_id).execute()
        
        # Step 4: Auto-code cases (placeholder)
        await auto_code_cases(cases_created)
        
        # Calculate confidence score (average of all case confidences)
        avg_confidence = None
        if cases_created:
            confidences = []
            for case_id in cases_created:
                case_result = supabase.table("pv_cases").select("ai_confidence").eq("id", case_id).execute()
                if case_result.data and case_result.data[0].get("ai_confidence"):
                    confidences.append(float(case_result.data[0]["ai_confidence"]))
            
            if confidences:
                avg_confidence = sum(confidences) / len(confidences)

        # Mark as completed
        supabase.table("file_upload_history").update({
            "upload_status": "completed",
            "progress": 100,
            "status_message": f"Processing complete! {len(cases_created)} case(s) created.",
            "processing_completed_at": datetime.now().isoformat(),
            "cases_created": len(cases_created),
            "total_cases": len(cases_created),  # Trigger will keep them in sync
            "ai_confidence_score": avg_confidence,
            "processing_error": None
        }).eq("id", file_id).execute()

    except Exception as e:
        # Update status to failed
        error_msg = str(e)
        print(f"Processing error for {file_id}: {error_msg}")
        supabase.table("file_upload_history").update({
            "upload_status": "failed",
            "processing_completed_at": datetime.now().isoformat(),
            "processing_error": error_msg,
            "status_message": f"Processing failed: {error_msg}"
        }).eq("id", file_id).execute()


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    organization: Optional[str] = None,
    user_id: Optional[str] = None
):
    """
    Upload a file for AI processing
    Supports: PDF, Word, Excel, Email, Images, Audio, ZIP, etc.
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Generate upload ID
        file_id = str(uuid.uuid4())

        # Get file extension and detect type
        file_ext = Path(file.filename).suffix.lower()
        file_type = detect_file_type(file.filename)
        
        if file_type == "unknown":
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {file_ext}. Supported: PDF, Word, Excel, Email, Images, Audio, ZIP"
            )

        # Save file to disk
        file_path = UPLOADS_DIR / f"{file_id}{file_ext}"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Calculate file hash
        file_hash = calculate_file_hash(file_path)

        # Get file size
        file_size = file_path.stat().st_size

        # Create database record
        # Use None for user_id and organization if not provided (fields are now nullable)
        record = {
            "id": file_id,
            "user_id": user_id if user_id else None,  # NULL if not provided
            "organization": organization if organization else None,  # NULL if not provided
            "filename": file.filename,
            "file_size_bytes": file_size,
            "file_hash_md5": file_hash,
            "file_type": file_type,
            "file_path": str(file_path),
            "source": "upload",
            "upload_status": "queued",
            "progress": 0,
            "status_message": "File uploaded, queued for processing...",
            "uploaded_at": datetime.now().isoformat(),
        }

        try:
            supabase.table("file_upload_history").insert(record).execute()
        except Exception as db_error:
            # If table doesn't exist yet, log error but continue
            print(f"Database error (table may not exist): {db_error}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")

        # Start background processing
        background_tasks.add_task(process_file_ai, file_id, file_path, file.filename)

        return FileUploadResponse(
            file_id=file_id,
            filename=file.filename,
            file_size=file_size,
            status="queued",
            message="File uploaded successfully. Processing started."
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")


@router.get("/status/{file_id}", response_model=FileStatusResponse)
async def get_file_status(file_id: str):
    """Get processing status of uploaded file"""
    try:
        result = supabase.table("file_upload_history").select("*").eq("id", file_id).execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Upload not found")

        file_data = result.data[0]

        # Get progress and status
        progress = file_data.get("progress", 0)
        status = file_data.get("upload_status", "unknown")
        
        # Ensure progress is set based on status if not explicitly set
        if status == "queued" and progress == 0:
            progress = 10
        elif status == "processing" and progress == 0:
            progress = 50
        elif status == "completed":
            progress = 100
        elif status == "failed":
            progress = 0

        return FileStatusResponse(
            file_id=file_id,
            filename=file_data.get("filename", "unknown"),
            status=status,
            progress=progress,
            message=file_data.get("status_message"),
            cases_created=file_data.get("cases_created"),
            error=file_data.get("processing_error")
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching status: {str(e)}")


@router.get("/list")
async def list_uploads(
    organization: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = 50
):
    """List uploaded files"""
    try:
        query = supabase.table("file_upload_history").select("*").order("uploaded_at", desc=True).limit(limit)

        if organization:
            query = query.eq("organization", organization)
        if user_id:
            query = query.eq("user_id", user_id)

        result = query.execute()
        return {"uploads": result.data or []}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing uploads: {str(e)}")
