"""
Unified Signal Detection API
Provides endpoints for comprehensive signal detection using all methods
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.signal_detection.unified_signal_detection import (
    UnifiedSignalDetector,
    UnifiedSignalResult
)
from app.core.signal_detection.bayesian_signal_detection import (
    ContingencyTable
)
from app.core.signal_detection.causality_assessment import (
    ClinicalFeatures
)
from app.core.signal_detection.temporal_pattern_detection import (
    TimeSeriesData
)

router = APIRouter(prefix="/signal-detection", tags=["Signal Detection"])

# Initialize detector (singleton)
detector = UnifiedSignalDetector(min_count=3, estimate_priors=True)


class UnifiedSignalRequest(BaseModel):
    """Request model for unified signal detection"""
    drug: str
    event: str
    n11: int  # Observed: drug + event
    n10: int  # Observed: drug + not event
    n01: int  # Observed: not drug + event
    n00: int  # Observed: not drug + not event
    
    # Optional: Clinical features for causality
    time_to_onset_days: Optional[int] = None
    dechallenge_improved: Optional[bool] = None
    rechallenge_recurred: Optional[bool] = None
    alternative_causes: Optional[List[str]] = None
    dose_response: Optional[bool] = None
    known_reaction: Optional[bool] = None
    lab_evidence: Optional[bool] = None
    
    # Optional: Temporal data
    dates: Optional[List[str]] = None  # ISO format strings
    counts: Optional[List[int]] = None
    first_report_date: Optional[str] = None  # ISO format string


class BatchSignalRequest(BaseModel):
    """Request model for batch signal detection"""
    drug_event_pairs: List[dict]


@router.post("/unified", response_model=dict)
async def detect_unified_signal(request: UnifiedSignalRequest):
    """
    Comprehensive signal detection using all available methods.
    
    Returns unified result combining:
    - Classical disproportionality (PRR, ROR, IC)
    - Bayesian methods (MGPS, EBGM)
    - Causality assessment (WHO-UMC, Naranjo)
    - Temporal pattern analysis
    """
    try:
        # Create contingency table
        ct = ContingencyTable(
            n11=request.n11,
            n10=request.n10,
            n01=request.n01,
            n00=request.n00
        )
        
        # Create clinical features if provided
        clinical = None
        if request.time_to_onset_days is not None or request.dechallenge_improved is not None:
            clinical = ClinicalFeatures(
                time_to_onset_days=request.time_to_onset_days,
                dechallenge_improved=request.dechallenge_improved or False,
                rechallenge_recurred=request.rechallenge_recurred,
                alternative_causes=request.alternative_causes or [],
                dose_response=request.dose_response or False,
                known_reaction=request.known_reaction or False,
                lab_evidence=request.lab_evidence or False
            )
        
        # Create time series if provided
        time_series = None
        if request.dates and request.counts:
            try:
                dates = [datetime.fromisoformat(d) for d in request.dates]
                time_series = TimeSeriesData(dates=dates, counts=request.counts)
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid date format: {str(e)}"
                )
        
        # Parse first report date
        first_report_date = None
        if request.first_report_date:
            try:
                first_report_date = datetime.fromisoformat(request.first_report_date)
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid first_report_date format: {str(e)}"
                )
        
        # Detect signal
        result = detector.detect_signal(
            drug=request.drug,
            event=request.event,
            contingency_table=ct,
            clinical_features=clinical,
            time_series=time_series,
            first_report_date=first_report_date
        )
        
        return result.to_dict()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", response_model=List[dict])
async def detect_batch_signals(request: BatchSignalRequest):
    """
    Batch signal detection for multiple drug-event pairs.
    
    Input format:
    [
        {
            "drug": "DrugA",
            "event": "EventX",
            "n11": 45, "n10": 955, "n01": 120, "n00": 9880
        },
        ...
    ]
    """
    try:
        pairs = []
        for pair in request.drug_event_pairs:
            ct = ContingencyTable(
                n11=pair["n11"],
                n10=pair["n10"],
                n01=pair["n01"],
                n00=pair["n00"]
            )
            pairs.append((
                pair["drug"],
                pair["event"],
                ct
            ))
        
        results = detector.detect_signals_batch(pairs, estimate_priors=True)
        
        return [result.to_dict() for result in results]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "detector_initialized": detector is not None,
        "min_count": detector.min_count if detector else None
    }

