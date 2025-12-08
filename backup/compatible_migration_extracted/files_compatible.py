from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import os
import uuid
from pathlib import Path
import anthropic
from supabase import create_client, Client

router = APIRouter(prefix="/api/v1/files", tags=["files"])

# Initialize services
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

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
    file_type: str
    size: int
    status: str
    message: str


class ProcessingStatus(BaseModel):
    file_id: str
    status: str  # 'processing', 'completed', 'failed'
    progress: int  # 0-100
    message: str
    cases_created: Optional[int] = None
    error: Optional[str] = None


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: Optional[str] = None,  # Would come from auth
    organization: Optional[str] = None,  # Would come from auth
):
    """
    Upload a file for processing
    Supports: PDF, Word, Excel, Email, Images, Audio, ZIP
    """
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Get file extension
    file_ext = Path(file.filename).suffix.lower()
    
    # Detect file type
    file_type = "unknown"
    for category, extensions in SUPPORTED_FORMATS.items():
        if file_ext in extensions:
            file_type = category
            break
    
    if file_type == "unknown":
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {file_ext}"
        )
    
    # Generate unique file ID
    file_id = str(uuid.uuid4())
    
    # Create upload directory if it doesn't exist
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    # Save file locally (temporary)
    file_path = upload_dir / f"{file_id}{file_ext}"
    
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        file_size = len(contents)
        
        # Generate MD5 hash
        import hashlib
        file_hash = hashlib.md5(contents).hexdigest()
        
        # Store file metadata in file_upload_history
        file_record = {
            "id": file_id,
            "user_id": user_id or "00000000-0000-0000-0000-000000000000",  # Placeholder
            "organization": organization or "default_org",  # Placeholder
            "filename": file.filename,
            "file_type": file_type,
            "file_size_bytes": file_size,
            "file_hash_md5": file_hash,
            "file_path": str(file_path),
            "uploaded_at": datetime.utcnow().isoformat(),
            "upload_status": "processing",
            "progress": 0,
            "status_message": "File uploaded, starting processing...",
            "processing_started_at": datetime.utcnow().isoformat(),
        }
        
        supabase.table("file_upload_history").insert(file_record).execute()
        
        # Queue background processing
        background_tasks.add_task(process_file, file_id, str(file_path), file_type)
        
        return FileUploadResponse(
            file_id=file_id,
            filename=file.filename,
            file_type=file_type,
            size=file_size,
            status="processing",
            message=f"File uploaded successfully. Processing started.",
        )
    
    except Exception as e:
        # Cleanup on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/status/{file_id}", response_model=ProcessingStatus)
async def get_processing_status(file_id: str):
    """
    Get processing status for a file
    """
    
    try:
        result = supabase.table("file_upload_history").select("*").eq("id", file_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_data = result.data[0]
        
        return ProcessingStatus(
            file_id=file_id,
            status=file_data.get("upload_status", "unknown"),
            progress=file_data.get("progress", 0),
            message=file_data.get("status_message", ""),
            cases_created=file_data.get("cases_created"),
            error=file_data.get("processing_error"),
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def process_file(file_id: str, file_path: str, file_type: str):
    """
    Background task to process uploaded file
    """
    
    try:
        # Update status to processing
        supabase.table("file_upload_history").update({
            "upload_status": "processing",
            "progress": 10,
            "status_message": "Extracting content..."
        }).eq("id", file_id).execute()
        
        # Step 1: Extract content based on file type
        content = await extract_content(file_path, file_type)
        
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
            "status_message": "Auto-coding..."
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
            "status_message": f"Successfully processed. {len(cases_created)} case(s) created.",
            "cases_created": len(cases_created),
            "total_cases": len(cases_created),  # Keep both in sync
            "ai_confidence_score": avg_confidence,
            "processing_completed_at": datetime.utcnow().isoformat(),
        }).eq("id", file_id).execute()
        
    except Exception as e:
        # Mark as failed
        supabase.table("file_upload_history").update({
            "upload_status": "failed",
            "processing_error": str(e),
            "status_message": f"Processing failed: {str(e)}",
            "processing_completed_at": datetime.utcnow().isoformat(),
        }).eq("id", file_id).execute()


async def extract_content(file_path: str, file_type: str) -> str:
    """
    Extract text content from different file types
    """
    
    if file_type == "pdf":
        # PDF extraction
        import pdfplumber
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text
    
    elif file_type == "document":
        # Word document extraction
        from docx import Document
        doc = Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    
    elif file_type == "spreadsheet":
        # Excel extraction
        import pandas as pd
        df = pd.read_excel(file_path)
        text = df.to_string()
        return text
    
    elif file_type == "email":
        # Email extraction
        import email
        with open(file_path, 'r') as f:
            msg = email.message_from_file(f)
            text = f"From: {msg['from']}\nSubject: {msg['subject']}\n\n{msg.get_payload()}"
        return text
    
    elif file_type == "image":
        # OCR for images
        import pytesseract
        from PIL import Image
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        return text
    
    else:
        # Fallback: try reading as text
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()


async def extract_entities_with_ai(content: str) -> List[dict]:
    """
    Use Claude to extract pharmacovigilance entities from text
    """
    
    prompt = f"""
You are a pharmacovigilance expert. Extract adverse event case information from the following text.

Text:
{content[:10000]}  # Limit to first 10K chars

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
        
        # Parse JSON response
        import json
        response_text = message.content[0].text
        
        # Extract JSON from response (handle markdown code blocks)
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_str = response_text.split("```")[1].split("```")[0].strip()
        else:
            json_str = response_text.strip()
        
        entities = json.loads(json_str)
        
        return entities if isinstance(entities, list) else [entities]
    
    except Exception as e:
        print(f"AI extraction error: {e}")
        return []


async def create_cases_from_entities(entities: List[dict], file_id: str) -> List[str]:
    """
    Create pv_cases records from extracted entities
    """
    
    case_ids = []
    
    for entity in entities:
        try:
            case_data = {
                "user_id": "00000000-0000-0000-0000-000000000000",  # Placeholder
                "organization": "default_org",  # Placeholder
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
