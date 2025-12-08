"""
Similar Cases Finder API
Uses multiple similarity metrics to find related cases
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import os
from supabase import create_client, Client
import logging
from difflib import SequenceMatcher
from collections import Counter
import math

router = APIRouter(prefix="/api/v1/cases", tags=["cases"])

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

logger = logging.getLogger(__name__)


def calculate_text_similarity(text1: str, text2: str) -> float:
    """Calculate similarity between two text strings (0-1)"""
    if not text1 or not text2:
        return 0.0
    return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()


def calculate_demographic_similarity(case1: dict, case2: dict) -> float:
    """Calculate similarity based on patient demographics"""
    score = 0.0
    total_weight = 0.0
    
    # Age similarity (weight: 0.3)
    if case1.get('patient_age') and case2.get('patient_age'):
        age_diff = abs(case1['patient_age'] - case2['patient_age'])
        age_score = max(0, 1 - (age_diff / 50))  # 50 year max difference
        score += age_score * 0.3
        total_weight += 0.3
    
    # Sex match (weight: 0.2)
    if case1.get('patient_sex') and case2.get('patient_sex'):
        if case1['patient_sex'] == case2['patient_sex']:
            score += 0.2
        total_weight += 0.2
    
    # Weight similarity (weight: 0.2)
    if case1.get('patient_weight') and case2.get('patient_weight'):
        weight_diff = abs(case1['patient_weight'] - case2['patient_weight'])
        weight_score = max(0, 1 - (weight_diff / 50))  # 50 kg max difference
        score += weight_score * 0.2
        total_weight += 0.2
    
    # Seriousness match (weight: 0.3)
    if case1.get('serious') == case2.get('serious'):
        score += 0.3
        total_weight += 0.3
    
    return score / total_weight if total_weight > 0 else 0.0


def calculate_event_similarity(case1: dict, case2: dict) -> float:
    """Calculate similarity based on drug and event"""
    score = 0.0
    
    # Drug name similarity (weight: 0.5)
    drug_sim = calculate_text_similarity(
        case1.get('drug_name', ''),
        case2.get('drug_name', '')
    )
    score += drug_sim * 0.5
    
    # Reaction similarity (weight: 0.5)
    event_sim = calculate_text_similarity(
        case1.get('reaction', ''),
        case2.get('reaction', '')
    )
    score += event_sim * 0.5
    
    return score


def calculate_temporal_similarity(case1: dict, case2: dict) -> float:
    """Calculate similarity based on temporal factors"""
    score = 0.0
    total_weight = 0.0
    
    # Event date proximity (weight: 0.5)
    if case1.get('event_date') and case2.get('event_date'):
        from datetime import datetime
        try:
            date1 = datetime.fromisoformat(case1['event_date'].replace('Z', '+00:00'))
            date2 = datetime.fromisoformat(case2['event_date'].replace('Z', '+00:00'))
            day_diff = abs((date1 - date2).days)
            temporal_score = max(0, 1 - (day_diff / 365))  # 1 year max
            score += temporal_score * 0.5
            total_weight += 0.5
        except:
            pass
    
    # Outcome similarity (weight: 0.5)
    if case1.get('outcome') and case2.get('outcome'):
        if case1['outcome'] == case2['outcome']:
            score += 0.5
        total_weight += 0.5
    
    return score / total_weight if total_weight > 0 else 0.0


def calculate_narrative_similarity(case1: dict, case2: dict) -> float:
    """Calculate similarity based on narrative text"""
    narrative1 = case1.get('narrative', '')
    narrative2 = case2.get('narrative', '')
    
    if not narrative1 or not narrative2:
        return 0.0
    
    # Simple keyword overlap
    words1 = set(narrative1.lower().split())
    words2 = set(narrative2.lower().split())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    return len(intersection) / len(union) if union else 0.0


def calculate_overall_similarity(case1: dict, case2: dict) -> float:
    """Calculate overall similarity score (0-1)"""
    
    # Event similarity is most important
    event_sim = calculate_event_similarity(case1, case2)
    if event_sim < 0.5:  # If drugs/events don't match well, not similar
        return event_sim * 0.5
    
    # Calculate component similarities
    demo_sim = calculate_demographic_similarity(case1, case2)
    temporal_sim = calculate_temporal_similarity(case1, case2)
    narrative_sim = calculate_narrative_similarity(case1, case2)
    
    # Weighted average
    weights = {
        'event': 0.4,
        'demographic': 0.25,
        'temporal': 0.2,
        'narrative': 0.15
    }
    
    overall = (
        event_sim * weights['event'] +
        demo_sim * weights['demographic'] +
        temporal_sim * weights['temporal'] +
        narrative_sim * weights['narrative']
    )
    
    return overall


@router.get("/{case_id}")
async def get_case(case_id: str):
    """Get case details by ID"""
    try:
        result = supabase.table("pv_cases")\
            .select("*")\
            .eq("id", case_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Case not found")
        
        return result.data[0]
        
    except Exception as e:
        logger.error(f"Error fetching case: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-drug-event")
async def get_cases_by_drug_event(
    drug: str,
    event: str,
    limit: int = Query(100, ge=1, le=1000)
):
    """Get cases matching drug and event"""
    try:
        result = supabase.table("pv_cases")\
            .select("*")\
            .ilike("drug_name", f"%{drug}%")\
            .ilike("reaction", f"%{event}%")\
            .limit(limit)\
            .execute()
        
        return result.data
        
    except Exception as e:
        logger.error(f"Error fetching cases: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{case_id}/similar")
async def find_similar_cases(
    case_id: str,
    limit: int = Query(5, ge=1, le=20),
    min_similarity: float = Query(0.3, ge=0.0, le=1.0)
):
    """
    Find similar cases based on multiple similarity metrics
    
    Args:
        case_id: ID of the reference case
        limit: Maximum number of similar cases to return
        min_similarity: Minimum similarity threshold (0-1)
    
    Returns:
        List of similar cases sorted by similarity score
    """
    try:
        # Get reference case
        ref_result = supabase.table("pv_cases")\
            .select("*")\
            .eq("id", case_id)\
            .execute()
        
        if not ref_result.data:
            raise HTTPException(status_code=404, detail="Case not found")
        
        reference_case = ref_result.data[0]
        
        # Get all other cases (could optimize with pre-filtering)
        all_cases_result = supabase.table("pv_cases")\
            .select("*")\
            .neq("id", case_id)\
            .execute()
        
        all_cases = all_cases_result.data
        
        # Calculate similarities
        similarities = []
        for case in all_cases:
            similarity = calculate_overall_similarity(reference_case, case)
            
            if similarity >= min_similarity:
                similarities.append({
                    'id': case['id'],
                    'case_number': case.get('case_number'),
                    'drug_name': case.get('drug_name'),
                    'reaction': case.get('reaction'),
                    'patient_age': case.get('patient_age'),
                    'patient_sex': case.get('patient_sex'),
                    'serious': case.get('serious'),
                    'outcome': case.get('outcome'),
                    'event_date': case.get('event_date'),
                    'similarity_score': round(similarity, 3),
                    'similarity_breakdown': {
                        'event': round(calculate_event_similarity(reference_case, case), 3),
                        'demographic': round(calculate_demographic_similarity(reference_case, case), 3),
                        'temporal': round(calculate_temporal_similarity(reference_case, case), 3),
                        'narrative': round(calculate_narrative_similarity(reference_case, case), 3)
                    }
                })
        
        # Sort by similarity score
        similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return similarities[:limit]
        
    except Exception as e:
        logger.error(f"Error finding similar cases: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{case_id}/export")
async def export_case(
    case_id: str,
    format: str = Query('pdf', enum=['pdf', 'word', 'json'])
):
    """
    Export case report in various formats
    
    Args:
        case_id: ID of case to export
        format: Export format (pdf, word, json)
    
    Returns:
        File download
    """
    try:
        # Get case data
        result = supabase.table("pv_cases")\
            .select("*")\
            .eq("id", case_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Case not found")
        
        case_data = result.data[0]
        
        if format == 'json':
            # Return JSON directly
            from fastapi.responses import JSONResponse
            return JSONResponse(content=case_data)
        
        elif format == 'pdf':
            # Generate PDF (placeholder - would use reportlab or similar)
            return {
                "message": "PDF export coming in Phase 6",
                "case_id": case_id,
                "format": format
            }
        
        elif format == 'word':
            # Generate Word doc (placeholder - would use python-docx)
            return {
                "message": "Word export coming in Phase 6",
                "case_id": case_id,
                "format": format
            }
        
    except Exception as e:
        logger.error(f"Error exporting case: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-similarity")
async def batch_similarity_analysis(
    case_ids: List[str],
    min_similarity: float = Query(0.5, ge=0.0, le=1.0)
):
    """
    Analyze similarity across multiple cases
    
    Args:
        case_ids: List of case IDs to analyze
        min_similarity: Minimum similarity threshold
    
    Returns:
        Similarity matrix and clusters
    """
    try:
        # Get all cases
        result = supabase.table("pv_cases")\
            .select("*")\
            .in_("id", case_ids)\
            .execute()
        
        cases = {case['id']: case for case in result.data}
        
        # Build similarity matrix
        matrix = {}
        for id1 in case_ids:
            matrix[id1] = {}
            for id2 in case_ids:
                if id1 == id2:
                    matrix[id1][id2] = 1.0
                elif id1 in cases and id2 in cases:
                    similarity = calculate_overall_similarity(cases[id1], cases[id2])
                    matrix[id1][id2] = round(similarity, 3)
        
        # Find clusters (simple threshold-based clustering)
        clusters = []
        visited = set()
        
        for case_id in case_ids:
            if case_id in visited:
                continue
            
            cluster = {case_id}
            visited.add(case_id)
            
            for other_id in case_ids:
                if other_id not in visited:
                    if matrix[case_id][other_id] >= min_similarity:
                        cluster.add(other_id)
                        visited.add(other_id)
            
            if len(cluster) > 1:
                clusters.append(list(cluster))
        
        return {
            "similarity_matrix": matrix,
            "clusters": clusters,
            "cluster_count": len(clusters),
            "threshold": min_similarity
        }
        
    except Exception as e:
        logger.error(f"Error in batch similarity analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

