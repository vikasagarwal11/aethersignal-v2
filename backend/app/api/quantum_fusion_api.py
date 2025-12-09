"""
Quantum-Bayesian Fusion API
Provides endpoints for the 3-layer fusion engine combining Bayesian-Temporal + Quantum scoring.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator

from app.core.signal_detection import (
    CompleteFusionEngine,
    ContingencyTable,
    ClinicalFeatures,
    TimeSeriesData,
)

router = APIRouter(prefix="/signal-detection", tags=["Quantum Fusion"])

# Singleton engine
fusion_engine = CompleteFusionEngine()


class ContingencyInput(BaseModel):
    n11: int = Field(..., description="Drug + Event")
    n10: int = Field(..., description="Drug + Not Event")
    n01: int = Field(..., description="Not Drug + Event")
    n00: int = Field(..., description="Not Drug + Not Event")


class TimeSeriesInput(BaseModel):
    dates: List[str]
    counts: List[int]

    @validator("counts")
    def validate_lengths(cls, v, values):
        if "dates" in values and len(values["dates"]) != len(v):
            raise ValueError("dates and counts must have the same length")
        return v


class QuantumSignalRequest(BaseModel):
    drug: str
    event: str
    total_cases: int = Field(..., gt=0)
    count: int = Field(..., ge=0)

    # Single-source quantum fields
    seriousness: Optional[str] = None
    serious_count: Optional[int] = None
    outcome: Optional[str] = None
    dates: Optional[List[str]] = None
    onset_date: Optional[str] = None
    report_date: Optional[str] = None

    # Multi-source quantum fields
    severity: Optional[float] = None
    severity_score: Optional[float] = None
    burst_score: Optional[float] = None
    mechanism_score: Optional[float] = None
    sources: Optional[List[str]] = None
    high_conf_source_count: Optional[int] = None
    most_recent_date: Optional[str] = None
    text: Optional[str] = None

    # Label knowledge
    label_reactions: Optional[List[str]] = None

    # Optional Bayesian/temporal inputs
    contingency: Optional[ContingencyInput] = None
    time_series: Optional[TimeSeriesInput] = None
    clinical_time_to_onset_days: Optional[int] = None
    clinical_dechallenge_improved: Optional[bool] = None
    clinical_rechallenge_recurred: Optional[bool] = None
    clinical_alternative_causes: Optional[List[str]] = None
    clinical_dose_response: Optional[bool] = None
    clinical_known_reaction: Optional[bool] = None
    clinical_lab_evidence: Optional[bool] = None


class BatchQuantumSignalRequest(BaseModel):
    signals: List[QuantumSignalRequest]


# Response Models (Claude's Improvement #1)
class Layer2Components(BaseModel):
    """Multi-source quantum components (Layer 2)"""
    frequency: float = 0.0
    severity: float = 0.0
    burst: float = 0.0
    novelty: float = 0.0
    consensus: float = 0.0
    mechanism: float = 0.0


class Interactions(BaseModel):
    """Quantum interaction terms"""
    rare_serious: float = 0.0
    rare_recent: float = 0.0
    serious_recent: float = 0.0
    all_three: float = 0.0


class ComponentsResponse(BaseModel):
    """Complete component breakdown for quantum scoring"""
    rarity: float
    seriousness: float
    recency: float
    interactions: Interactions
    tunneling: float
    layer2: Optional[Layer2Components] = None

    class Config:
        json_schema_extra = {
            "example": {
                "rarity": 0.955,
                "seriousness": 1.0,
                "recency": 1.0,
                "interactions": {
                    "rare_serious": 0.15,
                    "rare_recent": 0.0,
                    "serious_recent": 0.0,
                    "all_three": 0.20
                },
                "tunneling": 0.0,
                "layer2": {
                    "frequency": 0.6,
                    "severity": 0.8,
                    "burst": 0.5,
                    "novelty": 0.3,
                    "consensus": 0.7,
                    "mechanism": 0.6
                }
            }
        }


class FusionScoreResponse(BaseModel):
    """Complete fusion detection result with type safety"""
    drug: str
    event: str
    count: int
    fusion_score: float
    quantum_score_layer1: float
    quantum_score_layer2: float
    alert_level: str
    quantum_rank: Optional[int] = None
    classical_rank: Optional[int] = None
    percentile: Optional[float] = None
    components: ComponentsResponse
    bayesian: Optional[Dict[str, Any]] = None  # Keep generic for now (complex nested structure)

    class Config:
        json_schema_extra = {
            "example": {
                "drug": "warfarin",
                "event": "bleeding",
                "count": 45,
                "fusion_score": 0.777,
                "quantum_score_layer1": 1.532,
                "quantum_score_layer2": 0.548,
                "alert_level": "moderate",
                "quantum_rank": 3,
                "classical_rank": 17,
                "percentile": 99.7,
                "components": {
                    "rarity": 0.955,
                    "seriousness": 1.0,
                    "recency": 1.0,
                    "interactions": {
                        "rare_serious": 0.15,
                        "rare_recent": 0.0,
                        "serious_recent": 0.0,
                        "all_three": 0.20
                    },
                    "tunneling": 0.0,
                    "layer2": {
                        "frequency": 0.6,
                        "severity": 0.8,
                        "burst": 0.5,
                        "novelty": 0.3,
                        "consensus": 0.7,
                        "mechanism": 0.6
                    }
                },
                "bayesian": None
            }
        }


@router.post("/fusion", response_model=FusionScoreResponse)
async def detect_fusion_signal(request: QuantumSignalRequest):
    """Run full fusion detection for a single drug-event pair."""
    try:
        contingency_table = None
        if request.contingency:
            contingency_table = ContingencyTable(
                n11=request.contingency.n11,
                n10=request.contingency.n10,
                n01=request.contingency.n01,
                n00=request.contingency.n00,
            )

        time_series = None
        if request.time_series:
            dates = [datetime.fromisoformat(d) for d in request.time_series.dates]
            time_series = TimeSeriesData(dates=dates, counts=request.time_series.counts)

        clinical_features = None
        if any(
            value is not None
            for value in [
                request.clinical_time_to_onset_days,
                request.clinical_dechallenge_improved,
                request.clinical_rechallenge_recurred,
                request.clinical_alternative_causes,
                request.clinical_dose_response,
                request.clinical_known_reaction,
                request.clinical_lab_evidence,
            ]
        ):
            clinical_features = ClinicalFeatures(
                time_to_onset_days=request.clinical_time_to_onset_days,
                dechallenge_improved=bool(request.clinical_dechallenge_improved)
                if request.clinical_dechallenge_improved is not None
                else False,
                rechallenge_recurred=request.clinical_rechallenge_recurred,
                alternative_causes=request.clinical_alternative_causes or [],
                dose_response=bool(request.clinical_dose_response)
                if request.clinical_dose_response is not None
                else False,
                known_reaction=bool(request.clinical_known_reaction)
                if request.clinical_known_reaction is not None
                else False,
                lab_evidence=bool(request.clinical_lab_evidence)
                if request.clinical_lab_evidence is not None
                else False,
            )

        signal_data: Dict[str, Any] = {
            "count": request.count,
            "seriousness": request.seriousness,
            "serious_count": request.serious_count,
            "outcome": request.outcome,
            "dates": request.dates,
            "onset_date": request.onset_date,
            "report_date": request.report_date,
            "severity": request.severity,
            "severity_score": request.severity_score,
            "burst_score": request.burst_score,
            "mechanism_score": request.mechanism_score,
            "sources": request.sources,
            "high_conf_source_count": request.high_conf_source_count,
            "most_recent_date": request.most_recent_date,
            "text": request.text,
            "reaction": request.event,
            "drug": request.drug,
        }

        result = fusion_engine.detect_signal(
            drug=request.drug,
            event=request.event,
            signal_data=signal_data,
            total_cases=request.total_cases,
            contingency_table=contingency_table,
            clinical_features=clinical_features,
            time_series=time_series,
            sources=request.sources,
            label_reactions=request.label_reactions,
        )

        # Convert result to Pydantic response model
        result_dict = result.to_dict()
        
        # Build components response
        components_dict = result_dict.get("components", {})
        layer2_dict = components_dict.get("layer2", {})
        
        components_response = ComponentsResponse(
            rarity=components_dict.get("rarity", 0.0),
            seriousness=components_dict.get("seriousness", 0.0),
            recency=components_dict.get("recency", 0.0),
            interactions=Interactions(**components_dict.get("interactions", {})),
            tunneling=components_dict.get("tunneling", 0.0),
            layer2=Layer2Components(**layer2_dict) if layer2_dict else None,
        )
        
        return FusionScoreResponse(
            drug=result_dict["drug"],
            event=result_dict["event"],
            count=result_dict["count"],
            fusion_score=result_dict["fusion_score"],
            quantum_score_layer1=result_dict["quantum_score_layer1"],
            quantum_score_layer2=result_dict["quantum_score_layer2"],
            alert_level=result_dict["alert_level"],
            quantum_rank=result_dict.get("quantum_rank"),
            classical_rank=result_dict.get("classical_rank"),
            percentile=result_dict.get("percentile"),
            components=components_response,
            bayesian=result_dict.get("bayesian"),
        )

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fusion/batch", response_model=List[FusionScoreResponse])
async def detect_fusion_batch(request: BatchQuantumSignalRequest):
    """Batch fusion detection; ranks signals by fusion score."""
    try:
        # Claude's Improvement #2: Use Pydantic's dict() instead of manual mapping
        signal_payloads = [
            {
                **item.dict(exclude_none=True),
                'reaction': item.event  # Map event → reaction (required by engine)
            }
            for item in request.signals
        ]

        # Get total_cases from first signal (or calculate from all signals)
        total_cases = (
            request.signals[0].total_cases 
            if request.signals and request.signals[0].total_cases 
            else sum(s.count for s in request.signals)
        )

        results = fusion_engine.detect_signals_batch(
            signals=signal_payloads,
            total_cases=total_cases,
            sources=None,  # Could extract from signals if needed
            label_reactions=None
        )

        # Convert results to Pydantic response models
        response_list = []
        for result in results:
            result_dict = result.to_dict()
            components_dict = result_dict.get("components", {})
            layer2_dict = components_dict.get("layer2", {})
            
            components_response = ComponentsResponse(
                rarity=components_dict.get("rarity", 0.0),
                seriousness=components_dict.get("seriousness", 0.0),
                recency=components_dict.get("recency", 0.0),
                interactions=Interactions(**components_dict.get("interactions", {})),
                tunneling=components_dict.get("tunneling", 0.0),
                layer2=Layer2Components(**layer2_dict) if layer2_dict else None,
            )
            
            response_list.append(FusionScoreResponse(
                drug=result_dict["drug"],
                event=result_dict["event"],
                count=result_dict["count"],
                fusion_score=result_dict["fusion_score"],
                quantum_score_layer1=result_dict["quantum_score_layer1"],
                quantum_score_layer2=result_dict["quantum_score_layer2"],
                alert_level=result_dict["alert_level"],
                quantum_rank=result_dict.get("quantum_rank"),
                classical_rank=result_dict.get("classical_rank"),
                percentile=result_dict.get("percentile"),
                components=components_response,
                bayesian=result_dict.get("bayesian"),
            ))
        
        return response_list

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

