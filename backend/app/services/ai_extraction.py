"""
AI Entity Extraction Service
Uses Claude API to extract pharmacovigilance case data from unstructured files
"""
import os
import anthropic
from typing import Dict, Optional, List
from pathlib import Path

# Initialize Anthropic client
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
client = None

if ANTHROPIC_API_KEY:
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


async def extract_entities_from_text(text: str) -> Dict:
    """
    Extract pharmacovigilance entities from text using Claude API
    
    Returns:
        Dictionary with extracted entities:
        {
            "patient": {...},
            "drug": {...},
            "reaction": {...},
            "dates": {...},
            "narrative": "...",
            "confidence": 0.95
        }
    """
    if not client:
        # Return mock data if API key not configured
        return {
            "patient": {
                "age": None,
                "sex": None,
                "country": None
            },
            "drug": {
                "name": "Extracted Drug",
                "dose": None,
                "route": None
            },
            "reaction": {
                "term": "Extracted Reaction",
                "serious": True
            },
            "dates": {
                "onset": None,
                "event": None,
                "report": None
            },
            "narrative": "AI-generated case narrative based on extracted information.",
            "confidence": 0.85
        }

    try:
        # Prepare prompt for Claude
        prompt = f"""Extract pharmacovigilance case information from the following text.

Text:
{text[:8000]}  # Limit to 8000 chars for API

Extract and return a JSON object with the following structure:
{{
    "patient": {{
        "age": number or null,
        "sex": "M" or "F" or null,
        "country": string or null
    }},
    "drug": {{
        "name": string,
        "dose": string or null,
        "route": string or null,
        "indication": string or null
    }},
    "reaction": {{
        "term": string,
        "serious": boolean,
        "outcome": string or null
    }},
    "dates": {{
        "onset": "YYYY-MM-DD" or null,
        "event": "YYYY-MM-DD" or null,
        "report": "YYYY-MM-DD" or null
    }},
    "narrative": "Brief case narrative (2-3 sentences)",
    "confidence": number between 0 and 1
}}

If information is not available, use null. Be as accurate as possible."""

        # Call Claude API
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        # Parse response
        response_text = message.content[0].text
        
        # Extract JSON from response (Claude may wrap it in markdown)
        import json
        import re
        
        # Try to find JSON in response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            extracted_data = json.loads(json_match.group())
            return extracted_data
        else:
            # Fallback: return mock data
            return {
                "patient": {"age": None, "sex": None, "country": None},
                "drug": {"name": "Unknown", "dose": None, "route": None},
                "reaction": {"term": "Unknown", "serious": False},
                "dates": {"onset": None, "event": None, "report": None},
                "narrative": "Unable to extract structured data.",
                "confidence": 0.5
            }

    except Exception as e:
        print(f"Error in AI extraction: {e}")
        # Return mock data on error
        return {
            "patient": {"age": None, "sex": None, "country": None},
            "drug": {"name": "Unknown", "dose": None, "route": None},
            "reaction": {"term": "Unknown", "serious": False},
            "dates": {"onset": None, "event": None, "report": None},
            "narrative": f"Error during extraction: {str(e)}",
            "confidence": 0.3
        }


async def generate_case_narrative(entities: Dict) -> str:
    """
    Generate a case narrative from extracted entities
    """
    if not client:
        return "AI-generated case narrative based on extracted information."

    try:
        prompt = f"""Generate a professional pharmacovigilance case narrative (2-3 sentences) based on:

Patient: {entities.get('patient', {})}
Drug: {entities.get('drug', {})}
Reaction: {entities.get('reaction', {})}
Dates: {entities.get('dates', {})}

Write a clear, concise narrative suitable for regulatory reporting."""

        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        return message.content[0].text

    except Exception as e:
        return entities.get("narrative", "Case narrative unavailable.")


def calculate_quality_score(entities: Dict) -> float:
    """
    Calculate quality score (0-1) based on completeness of extracted data
    """
    score = 0.0
    max_score = 10.0

    # Patient info (2 points)
    patient = entities.get("patient", {})
    if patient.get("age"):
        score += 0.5
    if patient.get("sex"):
        score += 0.5
    if patient.get("country"):
        score += 1.0

    # Drug info (3 points)
    drug = entities.get("drug", {})
    if drug.get("name") and drug.get("name") != "Unknown":
        score += 2.0
    if drug.get("dose"):
        score += 0.5
    if drug.get("route"):
        score += 0.5

    # Reaction info (2 points)
    reaction = entities.get("reaction", {})
    if reaction.get("term") and reaction.get("term") != "Unknown":
        score += 1.5
    if reaction.get("serious") is not None:
        score += 0.5

    # Dates (2 points)
    dates = entities.get("dates", {})
    if dates.get("onset"):
        score += 0.7
    if dates.get("event"):
        score += 0.7
    if dates.get("report"):
        score += 0.6

    # Narrative (1 point)
    if entities.get("narrative") and len(entities.get("narrative", "")) > 50:
        score += 1.0

    return min(score / max_score, 1.0)

