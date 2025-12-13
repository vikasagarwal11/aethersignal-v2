# AetherSignal Database Schema & API Reference

**Purpose:** Complete reference document for existing database schema and APIs to enable integration with new wireframe design.

**Date:** 2025-01-XX  
**Status:** Current Production Schema

---

## 📋 Table of Contents

1. [Database Schema Overview](#database-schema-overview)
2. [Core Tables](#core-tables)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Relationships](#relationships)
6. [Integration with New Wireframe](#integration-with-new-wireframe)

---

## 🗄️ Database Schema Overview

**Database:** PostgreSQL (Supabase)  
**Multi-Tenant:** Yes (organization-scoped)  
**Authentication:** Supabase Auth (`auth.users`)

### Key Concepts

- **Organization**: Multi-tenant isolation (`TEXT` field on all tables)
- **Session**: Immutable analysis snapshot tied to data ingestion
- **Signal**: Statistical safety signal detected from cases
- **Case**: Individual adverse event report

---

## 📊 Core Tables

### 1. `user_profiles`

**Purpose:** Extended user information beyond Supabase Auth.

**Schema:**
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    organization TEXT NOT NULL,
    role TEXT DEFAULT 'scientist' CHECK (role IN ('super_admin', 'admin', 'scientist', 'viewer')),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_user_profiles_organization` - Fast org lookups
- `idx_user_profiles_email` - Fast email lookups

**RLS:** Enabled (Row-Level Security)

---

### 2. `pv_cases` (Pharmacovigilance Cases)

**Purpose:** Core table storing individual adverse event reports.

**Schema:**
```sql
CREATE TABLE pv_cases (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant & Ownership
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization TEXT NOT NULL,
    
    -- Case Identifiers
    case_id TEXT,
    primaryid TEXT,
    
    -- Drug Information
    drug_name TEXT,
    drug_count INTEGER,
    
    -- Reaction/Event Information
    reaction TEXT,
    reaction_count INTEGER,
    
    -- Patient Demographics
    age NUMERIC,
    age_yrs NUMERIC,
    sex TEXT,
    gender TEXT,
    country TEXT,
    
    -- Seriousness & Outcomes
    serious BOOLEAN,
    seriousness TEXT,
    outcome TEXT,
    
    -- Dates
    onset_date DATE,
    event_date DATE,
    report_date DATE,
    receive_date DATE,
    
    -- Source & Metadata
    source TEXT DEFAULT 'FAERS',
    raw_data JSONB,
    
    -- Statistical Signal Detection Fields (Migration 004)
    prr FLOAT,                    -- Proportional Reporting Ratio
    prr_ci_lower FLOAT,          -- PRR 95% CI lower bound
    prr_ci_upper FLOAT,          -- PRR 95% CI upper bound
    prr_is_signal BOOLEAN DEFAULT false,
    
    ror FLOAT,                    -- Reporting Odds Ratio
    ror_ci_lower FLOAT,
    ror_ci_upper FLOAT,
    ror_is_signal BOOLEAN DEFAULT false,
    
    ic FLOAT,                     -- Information Component (Bayesian)
    ic025 FLOAT,                  -- IC 2.5% lower bound
    ic_is_signal BOOLEAN DEFAULT false,
    
    -- Overall Signal Assessment
    is_statistical_signal BOOLEAN DEFAULT false,
    signal_strength TEXT,         -- 'strong', 'moderate', 'weak', 'none'
    signal_methods TEXT[],        -- Array of methods that flagged: ['PRR', 'ROR', 'IC']
    signal_detected_at TIMESTAMP,
    signal_priority TEXT,         -- 'Critical', 'High', 'Medium'
    
    -- Metadata
    statistics_calculated_at TIMESTAMP,
    statistics_version TEXT DEFAULT '1.0',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_pv_cases_user_id` - User lookups
- `idx_pv_cases_organization` - Organization filtering
- `idx_pv_cases_drug_name` - Drug filtering
- `idx_pv_cases_reaction` - Reaction filtering
- `idx_pv_cases_case_id` - Case ID lookups
- `idx_pv_cases_source` - Source filtering
- `idx_pv_cases_created_at` - Date range queries
- `idx_pv_cases_user_drug` - Composite (user_id, drug_name)
- `idx_pv_cases_user_reaction` - Composite (user_id, reaction)
- `idx_pv_cases_is_signal` - Partial index (WHERE is_statistical_signal = true)
- `idx_pv_cases_signal_strength` - Partial index (WHERE signal_strength IN ('strong', 'moderate'))
- `idx_pv_cases_drug_event` - Composite (drug_name, reaction)

**RLS:** Enabled

**Key Features:**
- Multi-tenant isolation via `organization`
- Statistical signal detection fields (PRR, ROR, IC)
- Signal strength classification
- JSONB `raw_data` for flexible metadata storage

---

### 3. `upload_sessions`

**Purpose:** Represents immutable analysis sessions tied to data ingestion.

**Schema:**
```sql
CREATE TABLE upload_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    
    -- Multi-Tenant
    organization TEXT,  -- Added in Migration 009
    
    -- Session Metadata
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active',  -- 'active', 'completed', 'failed'
    is_auto BOOLEAN DEFAULT false, -- Auto-generated vs user-created
    
    -- Statistics
    files_count INTEGER DEFAULT 0,
    cases_created INTEGER DEFAULT 0,
    valid_cases INTEGER DEFAULT 0,
    invalid_cases INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_upload_sessions_organization` - Org filtering (Migration 009)
- `idx_upload_sessions_org_date` - Composite (organization, started_at DESC)

**Functions:**
- `get_or_create_session_for_upload(org_name TEXT)` - Auto-creates session per org per day

**Key Features:**
- Organization-scoped (multi-tenant)
- Auto-session creation per organization per day
- Tracks file and case counts
- Immutable (no updates to historical data)

---

### 4. `file_upload_history`

**Purpose:** Tracks file uploads and processing status.

**Schema:**
```sql
CREATE TABLE file_upload_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization TEXT NOT NULL,
    
    -- File Metadata
    filename TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_hash_md5 TEXT,
    file_type TEXT,  -- 'pdf', 'csv', 'xlsx', etc.
    
    -- Upload Metadata
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    upload_status TEXT DEFAULT 'processing',  -- 'queued', 'uploading', 'processing', 'completed', 'failed'
    
    -- Statistics
    total_cases INTEGER DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    total_drugs INTEGER DEFAULT 0,
    total_serious_cases INTEGER DEFAULT 0,
    total_fatal_cases INTEGER DEFAULT 0,
    
    -- Date Range
    earliest_date DATE,
    latest_date DATE,
    
    -- Source
    source TEXT DEFAULT 'FAERS',
    
    -- Processing Metadata
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    
    -- Statistics Tracking
    stats_calculated_at TIMESTAMP WITH TIME ZONE,
    stats_status TEXT DEFAULT 'pending',  -- 'pending', 'completed', 'failed'
    
    -- Additional Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- Tracks upload progress and status
- Stores file statistics (cases, events, drugs)
- Date range tracking
- Error handling with `processing_error`
- JSONB metadata for flexibility

---

### 5. `file_uploads`

**Purpose:** Junction table linking files to sessions.

**Schema:**
```sql
-- Fields added via migrations
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS organization TEXT;
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS session_id UUID;
```

**Triggers:**
- `assign_session_to_upload()` - Auto-assigns session_id if NULL

---

### 6. `saved_analyses`

**Purpose:** Bookmark/save analysis results for later review.

**Schema:**
```sql
CREATE TABLE saved_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id TEXT NOT NULL,
    name TEXT NOT NULL,
    owner_user_id TEXT NULL,
    session_id TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes:**
- `idx_saved_analyses_owner` - User lookups
- `idx_saved_analyses_analysis` - Analysis ID lookups

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
- Uses Supabase Auth JWT tokens
- Organization scoping via user's `organization` field

---

### 1. Signals API (`/api/v1/signals`)

#### `GET /api/v1/signals/stats`

**Purpose:** Get aggregated KPI statistics.

**Query Parameters:**
- `organization` (optional): Filter by organization
- `dataset` (optional): Filter by source (FAERS, EudraVigilance, etc.)
- `session_date` (optional): Filter by session date (YYYY-MM-DD)

**Response:**
```json
{
  "total_cases": 12487,
  "critical_signals": 37,
  "serious_events": 624,
  "unique_drugs": 86,
  "unique_reactions": 156
}
```

**Implementation:** Aggregates from `pv_cases` table with optional filters.

---

#### `GET /api/v1/signals`

**Purpose:** List all signals with filtering.

**Query Parameters:**
- `organization` (optional)
- `dataset` (optional)
- `session_date` (optional)
- `priority` (optional): 'Critical', 'High', 'Medium'
- `serious_only` (optional): boolean
- `limit` (optional): default 100
- `offset` (optional): default 0

**Response:**
```json
[
  {
    "id": "uuid",
    "drug": "Aspirin",
    "reaction": "Gastrointestinal bleeding",
    "prr": 15.3,
    "prr_ci_lower": 12.1,
    "prr_ci_upper": 19.4,
    "prr_is_signal": true,
    "ror": 14.8,
    "ror_ci_lower": 11.5,
    "ror_ci_upper": 18.9,
    "ror_is_signal": true,
    "ic": 3.85,
    "ic025": 3.21,
    "ic_is_signal": true,
    "cases": 234,
    "priority": "Critical",
    "serious": true,
    "dataset": "FAERS",
    "organization": "Global Safety Org",
    "is_statistical_signal": true,
    "signal_strength": "strong",
    "methods_flagged": ["PRR", "ROR", "IC"]
  }
]
```

---

#### `GET /api/v1/signals/statistical`

**Purpose:** Get signals using specific statistical methods.

**Query Parameters:**
- `method`: 'prr', 'ror', 'ic', or 'all'
- `threshold`: 'standard', 'strict', or 'sensitive'
- `min_cases`: Minimum case count (default 3)
- `dataset` (optional)
- `session_date` (optional)

**Thresholds:**
- **standard**: PRR≥2, ROR>1, IC025>0, n≥3 (FDA/WHO guidelines)
- **strict**: PRR≥3, ROR>1.5, IC025>0.5, n≥5 (reduced false positives)
- **sensitive**: PRR≥1.5, ROR>0.8, IC025>-0.5, n≥2 (catch more signals)

---

#### `GET /api/v1/signals/priority`

**Purpose:** Get top priority signals for investigation.

**Query Parameters:**
- `limit`: Number of signals (default 10, max 100)
- `min_strength`: 'weak', 'moderate', or 'strong' (default 'moderate')

**Response:**
```json
[
  {
    "drug": "Aspirin",
    "event": "Gastrointestinal bleeding",
    "case_count": 234,
    "prr": 15.3,
    "ror": 14.8,
    "ic": 3.85,
    "signal_strength": "strong",
    "methods_flagged": ["PRR", "ROR", "IC"],
    "priority": "Critical",
    "requires_investigation": true
  }
]
```

---

#### `GET /api/v1/signals/drug-event/{drug}/{event}`

**Purpose:** Get detailed signal information for a specific drug-event pair.

**Response:** Same as `/api/v1/signals` single signal format.

---

### 2. Sessions API (`/api/v1/sessions`)

#### `GET /api/v1/sessions`

**Purpose:** List all sessions for an organization.

**Query Parameters:**
- `organization` (optional): Filter by organization
- `limit` (optional): default 50
- `offset` (optional): default 0

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Session 1",
    "started_at": "2025-12-11T09:05:00Z",
    "files_count": 3,
    "cases_created": 120,
    "valid_cases": 118,
    "invalid_cases": 2,
    "status": "completed",
    "is_current": false
  }
]
```

---

#### `POST /api/v1/sessions`

**Purpose:** Create a new session.

**Request Body:**
```json
{
  "name": "Session 1",
  "description": "Q4 batch upload",
  "organization": "Global Safety Org"
}
```

**Response:** `SessionSummary` object.

---

#### `GET /api/v1/sessions/{session_id}`

**Purpose:** Get detailed session information.

**Response:**
```json
{
  "id": "uuid",
  "name": "Session 1",
  "started_at": "2025-12-11T09:05:00Z",
  "files_count": 3,
  "cases_created": 120,
  "valid_cases": 118,
  "invalid_cases": 2,
  "status": "completed",
  "files": [
    {
      "id": "uuid",
      "filename": "faers_q3_2025.csv",
      "file_size_bytes": 5242880,
      "upload_status": "completed",
      "total_cases": 40
    }
  ],
  "stats": {
    "total_cases": 120,
    "total_serious": 45,
    "date_range": {
      "earliest": "2025-07-01",
      "latest": "2025-09-30"
    }
  }
}
```

---

### 3. Files API (`/api/v1/files`)

#### `POST /api/v1/files/upload`

**Purpose:** Upload a file for processing.

**Request:** Multipart form data
- `file`: File to upload
- `session_id` (optional): Link to existing session
- `organization` (optional): Organization scope

**Response:**
```json
{
  "file_id": "uuid",
  "filename": "faers_q3_2025.csv",
  "file_size": 5242880,
  "status": "queued",
  "message": "File uploaded successfully"
}
```

---

#### `GET /api/v1/files/{file_id}/status`

**Purpose:** Get file processing status.

**Response:**
```json
{
  "file_id": "uuid",
  "filename": "faers_q3_2025.csv",
  "status": "processing",
  "progress": 65,
  "message": "Processing cases...",
  "cases_created": 78
}
```

---

### 4. AI Query API (`/api/v1/ai-query`)

#### `POST /api/v1/ai-query`

**Purpose:** Natural language query interface for safety data.

**Request Body:**
```json
{
  "query": "Show me serious bleeding events for Aspirin",
  "organization": "Global Safety Org",
  "session_id": "uuid"
}
```

**Response:**
```json
{
  "response": "Found 234 serious gastrointestinal bleeding events for Aspirin...",
  "filters": {
    "drug": "Aspirin",
    "reaction": "Gastrointestinal bleeding",
    "serious": true
  },
  "results": [
    {
      "drug": "Aspirin",
      "reaction": "Gastrointestinal bleeding",
      "case_count": 234,
      "prr": 15.3
    }
  ]
}
```

---

## 📐 Data Models (Pydantic)

### SignalStats
```python
class SignalStats(BaseModel):
    total_cases: int
    critical_signals: int
    serious_events: int
    unique_drugs: int
    unique_reactions: int
```

### Signal
```python
class Signal(BaseModel):
    id: str
    drug: str
    reaction: str
    prr: float
    prr_ci_lower: Optional[float] = None
    prr_ci_upper: Optional[float] = None
    prr_is_signal: Optional[bool] = None
    ror: Optional[float] = None
    ror_ci_lower: Optional[float] = None
    ror_ci_upper: Optional[float] = None
    ror_is_signal: Optional[bool] = None
    ic: Optional[float] = None
    ic025: Optional[float] = None
    ic_is_signal: Optional[bool] = None
    cases: int
    priority: str
    serious: bool
    dataset: str
    organization: Optional[str] = None
    is_statistical_signal: Optional[bool] = None
    signal_strength: Optional[str] = None  # 'strong', 'moderate', 'weak', 'none'
    methods_flagged: Optional[List[str]] = None  # ['PRR', 'ROR', 'IC']
```

### SessionSummary
```python
class SessionSummary(BaseModel):
    id: str
    name: str
    started_at: datetime
    files_count: int
    cases_created: int
    valid_cases: int
    invalid_cases: int
    status: str
    is_current: bool = False
```

---

## 🔗 Relationships

```
user_profiles (1) ──< (many) pv_cases
user_profiles (1) ──< (many) file_upload_history
upload_sessions (1) ──< (many) file_uploads
file_upload_history (1) ──< (many) pv_cases (via source_file_id)
saved_analyses (many) ──> (1) upload_sessions (via session_id)
```

**Multi-Tenant Isolation:**
- All tables have `organization` field
- RLS policies enforce org-level access control
- Queries automatically filter by user's organization

---

## 🔄 Integration with New Wireframe

### ✅ What Already Exists (Can Reuse)

#### 1. **Sessions Panel (Left Rail)**
- ✅ `upload_sessions` table with all required fields
- ✅ `GET /api/v1/sessions` endpoint
- ✅ Organization-scoped sessions
- ✅ File and case counts

**Wireframe Mapping:**
- Session list → `GET /api/v1/sessions`
- Timestamp → `started_at` (format as "YYYY-MM-DD HH:MM UTC")
- File count → `files_count`
- Case count → `cases_created`

---

#### 2. **Safety Snapshot KPIs**
- ✅ `GET /api/v1/signals/stats` endpoint
- ✅ Returns: total_cases, critical_signals, serious_events, unique_drugs

**Wireframe Mapping:**
- Total Cases → `total_cases`
- Critical Signals → `critical_signals`
- Serious Events → `serious_events`
- Products Monitored → `unique_drugs`

**Missing for Wireframe:**
- ⚠️ Trend indicators (delta, % change)
- ⚠️ Comparison period logic

---

#### 3. **Signals Table**
- ✅ `GET /api/v1/signals` endpoint
- ✅ Drug, Reaction, PRR, Cases, Priority fields
- ✅ Filtering by priority, serious, organization

**Wireframe Mapping:**
- Drug → `drug`
- Reaction → `reaction`
- PRR → `prr`
- Cases → `cases`
- Serious → `serious` (boolean)
- Priority → `priority` ('Critical', 'High', 'Medium')

**Missing for Wireframe:**
- ⚠️ Server-side pagination (limit/offset exists but needs enhancement)
- ⚠️ Text search (drug/event search)

---

#### 4. **Priority Signals (Statistical)**
- ✅ `GET /api/v1/signals/priority` endpoint
- ✅ Signal strength classification
- ✅ PRR, ROR, IC calculations
- ✅ Priority labeling

**Wireframe Mapping:**
- Drug → `drug`
- Reaction → `reaction`
- PRR → `prr`
- Cases → `case_count`
- Priority → `priority`

**Missing for Wireframe:**
- ❌ AI Confidence Score (0-1) - **NOT IMPLEMENTED**
- ❌ Rank number - **NOT IMPLEMENTED**
- ❌ Velocity (% change, direction) - **NOT IMPLEMENTED**
- ❌ Recommendation (Escalate/Monitor/Defer) - **NOT IMPLEMENTED**
- ❌ Trend indicator - **PARTIAL** (has signal_strength, not temporal trend)

---

#### 5. **File Upload**
- ✅ `POST /api/v1/files/upload` endpoint
- ✅ `GET /api/v1/files/{file_id}/status` endpoint
- ✅ Progress tracking
- ✅ Session association

**Wireframe Mapping:**
- File name → `filename`
- Size → `file_size_bytes`
- Type → `file_type`
- Status → `upload_status`
- Progress → `progress` (needs enhancement)

---

#### 6. **Cases Data**
- ✅ `pv_cases` table has all required fields
- ✅ Querying via signals API

**Wireframe Mapping:**
- Case ID → `case_id`
- Age → `age` / `age_yrs`
- Sex → `sex`
- Serious → `serious`
- Outcome → `outcome`
- Onset Date → `onset_date`

**Missing for Wireframe:**
- ⚠️ Paginated case listing endpoint
- ⚠️ Date range filtering
- ⚠️ Serious-only filter

---

### ❌ What's Missing (Need to Build)

#### 1. **Deep Analysis Modal - Trajectory Tab**
- ❌ Time-series aggregation
- ❌ Forecast model (30d/90d/6m/12m horizons)
- ❌ Confidence bands (95% CI)
- ❌ Scenario modeling (no action vs intervention)
- ❌ Velocity calculations
- ❌ "Hospitalizations avoided" projections

**Required:**
- New endpoint: `GET /api/v1/signals/{signal_id}/trajectory`
- New table or view: `signal_trajectories` (optional, can compute on-demand)
- Forecast model implementation

---

#### 2. **Deep Analysis Modal - Evidence Tab**
- ❌ Structured evidence API per signal
- ❌ Source freshness tracking
- ❌ Cross-source deduplication metadata
- ❌ Logic summary generation

**Required:**
- New endpoint: `GET /api/v1/signals/{signal_id}/evidence`
- Enhancement to `pv_cases.source` tracking

---

#### 3. **Deep Analysis Modal - Audit Tab**
- ❌ Audit events table
- ❌ Event logging system
- ❌ CFR Part 11-compliant timestamps

**Required:**
- New table: `audit_events`
- New endpoint: `GET /api/v1/signals/{signal_id}/audit`
- Audit logging middleware/service

**Schema Needed:**
```sql
CREATE TABLE audit_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID,  -- Optional, can be NULL for global events
    org_id UUID,
    session_id UUID,
    event_type TEXT,  -- 'query_executed', 'trajectory_generated', etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actor TEXT,  -- 'AI' or 'User'
    actor_name TEXT,  -- User name if User
    user_id UUID,  -- If User
    details TEXT,
    metadata JSONB
);
```

---

#### 4. **AI Assistant Chat**
- ❌ Chat message persistence
- ❌ Session-scoped chat context
- ❌ Message history

**Required:**
- New table: `chat_messages`
- New endpoints:
  - `GET /api/v1/chat/messages?session_id=...`
  - `POST /api/v1/chat/messages`
- Enhanced NLP query engine (already exists, needs persistence)

**Schema Needed:**
```sql
CREATE TABLE chat_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    org_id UUID,
    role TEXT,  -- 'user' or 'assistant'
    text TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    referenced_signal_ids UUID[],
    interpreted_filters JSONB
);
```

---

#### 5. **AI Confidence Scoring**
- ❌ ML model for composite signal ranking
- ❌ AI confidence score (0-1)

**Required:**
- New field: `ai_confidence` on signals (computed, not stored)
- New endpoint enhancement: Add AI confidence to priority signals
- Model implementation or scoring algorithm

---

#### 6. **Priority Signal Velocity**
- ❌ Week-over-week velocity calculation
- ❌ Velocity direction (Increasing/Decreasing/Stable)

**Required:**
- Time-series aggregation of cases over time
- Velocity calculation algorithm
- New fields: `velocity_pct`, `velocity_direction`

---

#### 7. **Recommendation Generation**
- ❌ Recommendation logic (Escalate/Monitor/Defer)

**Required:**
- Business logic/rules engine
- New field: `recommendation` on priority signals

---

#### 8. **KPI Trends**
- ❌ Delta/trend calculations
- ❌ Comparison period logic

**Required:**
- Time-series aggregation
- Comparison logic (current vs previous period)
- New fields: `delta`, `trend_direction`, `comparison_period`

---

## 🎯 Implementation Priority

### Phase 4.1: Critical Missing Features
1. **Audit System** - Regulatory compliance
2. **Trajectory/Forecast Models** - Core value proposition
3. **AI Confidence Scoring** - Differentiation

### Phase 4.2: Enhancements
1. **Chat Persistence** - Better UX
2. **Evidence API** - Completes Deep Analysis modal
3. **Velocity Calculations** - Temporal intelligence

### Phase 4.3: Nice to Have
1. **KPI Trends** - Better UX
2. **Text Search** - UX enhancement
3. **Recommendation Engine** - Decision support

---

## 📝 Notes for AI Assistants (Grok/ChatGPT)

### What You Can Reuse
- All database tables exist and are production-ready
- Most API endpoints exist and return correct data
- Multi-tenant isolation is implemented
- Statistical signal detection is complete

### What Needs Extension
- Add new endpoints for Deep Analysis modal (Trajectory, Evidence, Audit)
- Add new tables for chat and audit
- Enhance existing endpoints with missing fields (AI confidence, velocity, recommendations)
- Add time-series aggregation for trajectories and trends

### Integration Pattern
1. **Wireframe → API Contract**: Map each UI element to an API endpoint
2. **Reuse Existing**: Use current endpoints where possible (sessions, signals, stats)
3. **Extend Existing**: Add missing fields to current endpoints (trends, velocity)
4. **Build New**: Create new endpoints/tables for new features (trajectory, audit, chat)

### Database Access
- Use Supabase client (already initialized in all API files)
- All queries must filter by `organization` for multi-tenant isolation
- Use RLS policies (already enabled)

---

**Document Status:** Complete  
**Last Updated:** 2025-01-XX  
**Next Step:** Use this document to plan Phase 4 implementation

