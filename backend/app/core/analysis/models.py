from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field
import uuid


# ---------------------------
# Dimension & filter models
# ---------------------------

class DimensionFilter(BaseModel):
    """
    Represents a single dimension filter, e.g. events, seriousness, outcomes.

    - values:      list of values (["serious", "death"])
    - operator:    "OR" → any value; "AND" → all values must apply (future)
    - merge_strategy:
        - "APPEND":   add new values to previous (used in refinement)
        - "REPLACE":  replace previous values
        - "INTERSECT":keep only overlapping values (future)
    """
    values: List[str] = Field(default_factory=list)
    operator: Literal["OR", "AND"] = "OR"
    merge_strategy: Literal["APPEND", "REPLACE", "INTERSECT"] = "APPEND"


class SignalQueryFilters(BaseModel):
    """
    Fully structured representation of what subset of cases we want.

    This is what gets:
    - Persisted with the analysis
    - Turned into SQL/Supabase queries
    - Passed around between chat ↔ analysis views
    """
    drugs: DimensionFilter = Field(default_factory=DimensionFilter)
    events: DimensionFilter = Field(default_factory=DimensionFilter)
    seriousness_or_outcome: DimensionFilter = Field(default_factory=DimensionFilter)

    age_min: Optional[int] = None
    age_max: Optional[int] = None
    sex: Optional[str] = None

    region_codes: List[str] = Field(default_factory=list)
    time_window: Optional[str] = Field(
        default=None,
        description="LAST_6_MONTHS, LAST_12_MONTHS, SINCE_2020, CUSTOM, etc.",
    )

    refinement_mode: bool = False
    base_query_id: Optional[str] = None  # ID of previous analysis/query, if refinement

    # Helpful to keep original user language:
    raw_text: Optional[str] = None
    previous_raw_text: Optional[str] = None
    intent: Optional[str] = Field(default=None, description="filter, count, comparison, trend")

    def to_signal_query_spec(self) -> "SignalQuerySpec":
        """
        Convert SignalQueryFilters to SignalQuerySpec for QueryRouter.
        
        This bridges conversational filters to the fusion engine.
        """
        from app.core.signal_detection.query_router import SignalQuerySpec
        
        return SignalQuerySpec(
            drugs=self.drugs.values,
            reactions=self.events.values,
            seriousness_only=bool(self.seriousness_or_outcome.values),
            age_min=self.age_min,
            age_max=self.age_max,
            region_codes=self.region_codes,
            time_window=self.time_window,
            raw_text=self.raw_text,
        )

    class Config:
        extra = "ignore"


# ---------------------------
# Analysis & responses
# ---------------------------

class ViewSpec(BaseModel):
    """
    Controls how we present the analysis result.

    - page_size:      how many rows per page
    - include_charts: whether to generate charts
    - columns:        which columns to show in the table
    """
    page_size: int = 50
    include_charts: bool = True
    columns: List[str] = Field(
        default_factory=lambda: ["case_id", "drug", "event", "serious", "onset_date"]
    )


class QueryConfirmation(BaseModel):
    """
    Confirmation object sent back to UI before/with execution.

    - human_readable: "Serious OR death AND fever"
    - logic_expression: "(serious OR death) AND (fever)"
    - estimated_count: optional fast pre-count (can be None)
    """
    filters: SignalQueryFilters
    human_readable: str
    logic_expression: str
    estimated_count: Optional[int] = None


class AIMessageAction(BaseModel):
    """
    An actionable button in the chat UI.
    """
    type: Literal["open_analysis", "reset_context", "confirm_query"] = "open_analysis"
    label: str
    analysis_id: Optional[str] = None


class AnalysisHandle(BaseModel):
    """
    Represents a completed analysis definition (filters + view).
    The detail page uses this.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: Optional[str] = None
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    filters: SignalQueryFilters
    view: ViewSpec
    summary_text: str
    estimated_count: Optional[int] = None

    # Phase 2/3 hooks:
    owner_user_id: Optional[str] = None  # for saved analyses, alerts, etc.


class SavedAnalysis(BaseModel):
    """
    A saved/bookmarked analysis definition persisted in the database.
    
    Simple bookmark pointing to an analysis. Initially can filter by session_id;
    later will tie to owner_user_id when auth is integrated.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    analysis_id: str  # Reference to AnalysisHandle.id (may be in-memory)
    name: str
    owner_user_id: Optional[str] = None  # TODO: tie to auth user id later
    session_id: Optional[str] = None  # Optional: originating session
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AnalysisRow(BaseModel):
    """
    One row in the detailed table. Adapt columns to your schema.
    """
    case_id: str
    drug: str
    event: str
    serious: bool
    outcome: Optional[str] = None
    onset_date: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    region: Optional[str] = None


class AnalysisDetailResponse(BaseModel):
    """
    Response for /analysis/{id}.
    """
    handle: AnalysisHandle
    rows: List[AnalysisRow]
    total_count: int
    page: int
    page_size: int


class AIQueryResponse(BaseModel):
    """
    Response returned by /api/v1/ai/query (chat).

    - message:            natural language answer
    - actions:            buttons (e.g. "Generate detailed report")
    - analysis_handle:    optional, when this reply corresponds to a cohort
    - confirmation:       what we understood
    - requires_confirmation: if true, UI should ask user to confirm before running
    - context:            opaque object you can send back on next request
    """
    message: str
    actions: List[AIMessageAction] = Field(default_factory=list)
    analysis_handle: Optional[AnalysisHandle] = None
    confirmation: Optional[QueryConfirmation] = None
    requires_confirmation: bool = False
    context: Dict[str, Any] = Field(default_factory=dict)


# ---------------------------
# Stats models for charts
# ---------------------------

class TimeBucketCount(BaseModel):
    """Time bucket with count (e.g., "2024-01" -> 42)."""
    bucket: str  # e.g. "2024-01"
    count: int


class CategoryCount(BaseModel):
    """Category with count (e.g., "FEMALE" -> 25)."""
    category: str  # e.g. "FEMALE", "MALE", "UNKNOWN", "<18", "18-39", etc.
    count: int


class AnalysisStats(BaseModel):
    """
    Aggregated stats for charts.

    Computed server-side from AnalysisRow data.
    """
    total_count: int
    time_series: List[TimeBucketCount] = Field(default_factory=list)
    by_age_bucket: List[CategoryCount] = Field(default_factory=list)
    by_sex: List[CategoryCount] = Field(default_factory=list)
    by_region: List[CategoryCount] = Field(default_factory=list)
