"""
Updated Signals API with Real Statistical Signal Detection
Integrates PRR, ROR, and IC calculations for proper pharmacovigilance
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict
import os
from supabase import create_client, Client
import logging
from datetime import datetime

# Import our statistical signal detection module
from app.api.signal_statistics import (
    SignalDetector,
    calculate_signal_statistics,
    get_all_signals
)

router = APIRouter(prefix="/api/v1/signals", tags=["signals"])

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

logger = logging.getLogger(__name__)


@router.get("/")
async def get_signals(
    dataset: Optional[str] = Query(None),
    limit: int = Query(1000, ge=1, le=10000),
    signals_only: bool = Query(False),
    method: str = Query("all", enum=["prr", "ror", "ic", "all"]),
    min_cases: int = Query(3, ge=1, le=10)
):
    """
    Get statistical signals with REAL PRR/ROR/IC calculations
    
    Args:
        dataset: Filter by dataset (default: all)
        limit: Max results to return
        signals_only: If True, return only flagged signals
        method: Statistical method(s) to use
        min_cases: Minimum case count to analyze
    
    Returns:
        List of signals with proper statistical calculations
    """
    try:
        logger.info(f"Fetching signals: dataset={dataset}, limit={limit}, "
                   f"signals_only={signals_only}, method={method}")
        
        # Fetch all cases from database
        query = supabase.table("pv_cases").select("*")
        
        # Filter by dataset if specified
        if dataset and dataset != "all":
            query = query.eq("dataset", dataset)
        
        result = query.limit(limit).execute()
        all_cases = result.data or []
        
        if not all_cases:
            return []
        
        logger.info(f"Processing {len(all_cases)} cases for signal detection")
        
        # Run statistical signal detection
        detector = SignalDetector()
        
        if method == "all":
            # Use all methods, return comprehensive results
            signals = get_all_signals(
                all_cases,
                signals_only=signals_only,
                min_cases=min_cases
            )
        else:
            # Use specific method
            results = detector.detect_all_signals(all_cases, min_case_count=min_cases)
            
            # Filter by selected method
            if signals_only:
                if method == "prr":
                    results = [r for r in results if r.prr_is_signal]
                elif method == "ror":
                    results = [r for r in results if r.ror_is_signal]
                elif method == "ic":
                    results = [r for r in results if r.ic_is_signal]
            
            signals = [
                {
                    'drug': r.drug,
                    'event': r.event,
                    'case_count': r.a,
                    'prr': round(r.prr, 2),
                    'prr_ci': f"[{r.prr_ci_lower:.2f}-{r.prr_ci_upper:.2f}]",
                    'prr_is_signal': r.prr_is_signal,
                    'ror': round(r.ror, 2),
                    'ror_ci': f"[{r.ror_ci_lower:.2f}-{r.ror_ci_upper:.2f}]",
                    'ror_is_signal': r.ror_is_signal,
                    'ic': round(r.ic, 2),
                    'ic025': round(r.ic025, 2),
                    'ic_is_signal': r.ic_is_signal,
                    'is_signal': r.is_signal,
                    'signal_strength': r.signal_strength,
                    'methods': ', '.join(r.methods_flagged) if r.methods_flagged else 'None',
                    'priority': get_priority_label(r.signal_strength, r.a)
                }
                for r in results
            ]
        
        logger.info(f"Signal detection complete: {len(signals)} results, "
                   f"{sum(1 for s in signals if s.get('is_signal', False))} flagged as signals")
        
        return signals[:limit]
        
    except Exception as e:
        logger.error(f"Error in signal detection: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistical")
async def get_statistical_signals(
    method: str = Query("all", enum=["prr", "ror", "ic", "all"]),
    threshold: str = Query("standard", enum=["standard", "strict", "sensitive"]),
    min_cases: int = Query(3, ge=1),
    dataset: Optional[str] = Query(None)
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
        
        # Fetch cases
        query = supabase.table("pv_cases").select("*")
        if dataset and dataset != "all":
            query = query.eq("dataset", dataset)
        
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
                            'value': round(r.prr, 2),
                            'ci_lower': round(r.prr_ci_lower, 2),
                            'ci_upper': round(r.prr_ci_upper, 2),
                            'is_signal': r.prr_is_signal,
                            'threshold': thresholds['prr_threshold']
                        },
                        'ror': {
                            'value': round(r.ror, 2),
                            'ci_lower': round(r.ror_ci_lower, 2),
                            'ci_upper': round(r.ror_ci_upper, 2),
                            'is_signal': r.ror_is_signal,
                            'threshold': thresholds['ror_threshold']
                        },
                        'ic': {
                            'value': round(r.ic, 2),
                            'ic025': round(r.ic025, 2),
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
        logger.error(f"Error in statistical signal detection: {e}", exc_info=True)
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
            if drug.lower() in case.get('drug_name', '').lower()
            and event.lower() in case.get('reaction', '').lower()
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
        logger.error(f"Error fetching drug-event signal: {e}", exc_info=True)
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
                'prr': round(r.prr, 2),
                'ror': round(r.ror, 2),
                'ic': round(r.ic, 2),
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
        logger.error(f"Error fetching priority signals: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


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
