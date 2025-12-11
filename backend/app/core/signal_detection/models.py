# backend/app/core/signal_detection/models.py

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from uuid import uuid4


class DimensionFilter(BaseModel):
    """Represents OR within a dimension, AND across dimensions."""
    values: List[str] = Field(default_factory=list)
    operator: str = "OR"  # could be extended later


class SignalQueryFilters(BaseModel):
    """High-level filters for a query."""
    drugs: DimensionFilter = DimensionFilter()
    events: DimensionFilter = DimensionFilter()
    seriousness_or_outcome: DimensionFilter = DimensionFilter()
    region_codes: DimensionFilter = DimensionFilter()
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    time_window: Optional[str] = None  # e.g. "LAST_12_MONTHS", "YEAR_2024"


class ViewSpec(BaseModel):
    """How to display this analysis."""
    primary_view: str = "summary+table"  # or "table", "chart", etc.
    include_charts: List[str] = Field(default_factory=list)
    columns: List[str] = Field(default_factory=list)


class AnalysisHandle(BaseModel):
    """Handle for a single analysis definition."""
    id: str
    filters: SignalQueryFilters
    view: ViewSpec
    title: Optional[str] = None

    @staticmethod
    def new(filters: SignalQueryFilters, view: ViewSpec, title: Optional[str] = None) -> "AnalysisHandle":
        return AnalysisHandle(
            id=str(uuid4()),
            filters=filters,
            view=view,
            title=title,
        )
