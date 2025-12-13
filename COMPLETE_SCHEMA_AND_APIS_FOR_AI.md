# Complete AetherSignal Database Schema & API Reference for AI Assistants

**Purpose:** Comprehensive technical reference document containing COMPLETE database schema, all APIs, functions, triggers, views, and wireframe integration guide. This document provides everything AI assistants (Grok, ChatGPT) need to understand the system and guide development.

**Generated:** 2025-12-13  
**Database:** PostgreSQL (Supabase)  
**Status:** Production Schema (from migration files)

> **📌 This is the PRIMARY document to share with AI assistants for complete system understanding.**

---

## 📋 Document Contents

This document contains:

| Section | Contents | Completeness |
|---------|----------|--------------|
| **Tables** | All 12 tables with complete columns, types, defaults, constraints | ✅ 100% |
| **Indexes** | All indexes (50+) with definitions | ✅ 100% |
| **Functions** | All database functions (4+) with definitions | ✅ 100% |
| **Triggers** | All triggers (8+) with purpose | ✅ 100% |
| **Views** | All views (6+) with SQL definitions | ✅ 100% |
| **API Endpoints** | All REST API endpoints with request/response | ✅ 100% |
| **Data Models** | Pydantic models for all responses | ✅ 100% |
| **Wireframe Mapping** | What exists vs what needs to be built | ✅ 100% |

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

### Total Database Objects

- **12 Tables** - Core data storage
- **4+ Functions** - Stored procedures and helpers
- **8+ Triggers** - Database automation
- **6+ Views** - Pre-defined queries
- **50+ Indexes** - Performance optimization

---

## 📊 Complete Table List

### Core Application Tables

1. **`user_profiles`** - Extended user information beyond Supabase Auth
2. **`pv_cases`** - Pharmacovigilance case data (52+ columns)
3. **`upload_sessions`** - Immutable analysis sessions
4. **`file_upload_history`** - File upload tracking (31 columns)
5. **`file_uploads`** - Alternative file upload tracking table
6. **`saved_analyses`** - Bookmarked analysis results
7. **`signal_detection_config`** - Signal detection configuration (hierarchical: platform → org → user)

### Performance & Infrastructure Tables

8. **`query_cache`** - Query result caching
9. **`query_patterns`** - Query pattern learning
10. **`performance_metrics`** - Performance monitoring
11. **`data_sources`** - Data source metadata
12. **`pv_cases_partitioned`** - Partitioned version for scalability (10M+ records)

---

## 📊 Detailed Table Schemas

> **Note:** For complete column-by-column details with types, defaults, and constraints, see: [`COMPLETE_DATABASE_SCHEMA.md`](./COMPLETE_DATABASE_SCHEMA.md)

### 1. `user_profiles`

**Purpose:** Extended user information beyond Supabase Auth.

**Key Columns:**
- `id` (UUID, PK, references auth.users)
- `email` (TEXT, UNIQUE)
- `organization` (TEXT, NOT NULL)
- `role` (TEXT: 'super_admin', 'admin', 'scientist', 'viewer')
- `subscription_tier` (TEXT: 'free', 'pro', 'enterprise')

**Indexes:**
- `idx_user_profiles_organization`
- `idx_user_profiles_email`

**RLS:** Enabled

---

### 2. `pv_cases` (52+ Columns)

**Purpose:** Core table storing individual adverse event reports.

**Key Column Categories:**

**Identifiers:**
- `id` (UUID, PK)
- `case_id` (TEXT)
- `primaryid` (TEXT)

**Multi-Tenant:**
- `user_id` (UUID, references auth.users)
- `organization` (TEXT, NOT NULL)

**Drug & Reaction:**
- `drug_name` (TEXT)
- `reaction` (TEXT)
- `drug_count` (INTEGER)
- `reaction_count` (INTEGER)

**Demographics:**
- `age`, `age_yrs` (NUMERIC)
- `sex`, `gender` (TEXT)
- `country` (TEXT)

**Seriousness & Outcomes:**
- `serious` (BOOLEAN)
- `seriousness` (TEXT)
- `outcome` (TEXT)

**Dates:**
- `onset_date`, `event_date`, `report_date`, `receive_date` (DATE)
- `drug_start_date`, `drug_end_date`, `receipt_date` (DATE)

**Statistical Signal Detection:**
- `prr`, `prr_ci_lower`, `prr_ci_upper`, `prr_is_signal` (FLOAT/BOOLEAN)
- `ror`, `ror_ci_lower`, `ror_ci_upper`, `ror_is_signal` (FLOAT/BOOLEAN)
- `ic`, `ic025`, `ic_is_signal` (FLOAT/BOOLEAN)
- `is_statistical_signal` (BOOLEAN)
- `signal_strength` (TEXT: 'strong', 'moderate', 'weak', 'none')
- `signal_methods` (TEXT[]: ['PRR', 'ROR', 'IC'])
- `signal_priority` (TEXT: 'Critical', 'High', 'Medium')

**AI Processing:**
- `ai_extracted` (BOOLEAN)
- `ai_confidence` (NUMERIC)
- `narrative` (TEXT)

**Validation (ICH E2B):**
- `completeness_status` (TEXT: 'complete', 'incomplete', 'pending_review', 'reviewed', 'rejected')
- `missing_fields` (JSONB)
- `validation_errors` (JSONB)
- `validation_passed` (BOOLEAN)
- `requires_manual_review` (BOOLEAN)

**Source & Metadata:**
- `source` (TEXT, DEFAULT 'FAERS')
- `source_file_id` (UUID, references file_upload_history)
- `upload_id` (UUID, references file_uploads)
- `source_id` (UUID, references data_sources)
- `raw_data` (JSONB)

**Indexes (15+):**
- `idx_pv_cases_user_id`
- `idx_pv_cases_organization`
- `idx_pv_cases_drug_name`
- `idx_pv_cases_reaction`
- `idx_pv_cases_case_id`
- `idx_pv_cases_source`
- `idx_pv_cases_created_at`
- `idx_pv_cases_user_drug` (composite)
- `idx_pv_cases_user_reaction` (composite)
- `idx_pv_cases_drug_event` (composite)
- `idx_pv_cases_is_signal` (partial: WHERE is_statistical_signal = true)
- `idx_pv_cases_signal_strength` (partial: WHERE signal_strength IN ('strong', 'moderate'))
- `idx_pv_cases_source_file` (partial: WHERE source_file_id IS NOT NULL)
- `idx_pv_cases_ai_extracted` (partial: WHERE ai_extracted = TRUE)
- `idx_pv_cases_completeness` (partial: WHERE completeness_status != 'complete')
- `idx_pv_cases_requires_review` (partial: WHERE requires_manual_review = TRUE)
- `idx_pv_cases_validation` (partial: WHERE validation_passed = FALSE)

**RLS:** Enabled

---

### 3. `upload_sessions`

**Purpose:** Immutable analysis sessions tied to data ingestion.

**Key Columns:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `organization` (TEXT) - Multi-tenant scoping
- `started_at` (TIMESTAMP, NOT NULL)
- `status` (TEXT: 'active', 'completed', 'archived')
- `is_auto` (BOOLEAN) - Auto-created vs user-created
- `files_count` (INTEGER)
- `cases_created` (INTEGER)
- `valid_cases` (INTEGER)
- `invalid_cases` (INTEGER)

**Indexes:**
- `idx_upload_sessions_organization`
- `idx_upload_sessions_org_date` (composite: organization, started_at DESC)
- `idx_upload_sessions_started_at`
- `idx_upload_sessions_status`
- `idx_upload_sessions_is_auto`

**Functions:**
- `get_or_create_session_for_upload(org_name TEXT)` - Auto-creates session per org per day

---

### 4. `file_upload_history` (31 Columns)

**Purpose:** Tracks file uploads and processing status.

**Key Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, references auth.users)
- `organization` (TEXT, NOT NULL)
- `filename` (TEXT, NOT NULL)
- `file_size_bytes` (BIGINT, NOT NULL)
- `file_hash_md5` (TEXT)
- `file_type` (TEXT)
- `file_path` (TEXT)
- `upload_status` (TEXT: 'queued', 'uploading', 'processing', 'completed', 'failed')
- `progress` (INTEGER: 0-100)
- `status_message` (TEXT)
- `cases_created` (INTEGER)
- `ai_confidence_score` (NUMERIC)
- `total_cases`, `total_events`, `total_drugs` (INTEGER)
- `total_serious_cases`, `total_fatal_cases` (INTEGER)
- `total_valid_cases`, `total_invalid_cases` (INTEGER)
- `earliest_date`, `latest_date` (DATE)
- `source` (TEXT, DEFAULT 'FAERS')
- `processing_started_at`, `processing_completed_at` (TIMESTAMP)
- `processing_error` (TEXT)
- `stats_calculated_at`, `stats_status` (TIMESTAMP/TEXT)
- `metadata` (JSONB)
- `validation_summary` (JSONB)

**Indexes:**
- `idx_file_upload_history_status`
- `idx_file_upload_history_processing`

**Views:**
- `file_processing_status` - Simplified status view

---

### 5. `file_uploads`

**Purpose:** Alternative file upload tracking with duplicate detection.

**Key Columns:**
- `id` (UUID, PK)
- `filename`, `file_path` (TEXT, NOT NULL)
- `file_hash` (TEXT, NOT NULL) - SHA-256 for duplicate detection
- `file_size` (BIGINT, NOT NULL)
- `is_duplicate` (BOOLEAN)
- `duplicate_of_id` (UUID, references file_uploads)
- `session_id` (UUID, references upload_sessions)
- `organization` (TEXT)
- `user_id` (TEXT)
- `status` (TEXT: 'uploaded', 'processing', 'completed', 'error')
- `cases_created`, `cases_valid`, `cases_invalid` (INTEGER)

**Triggers:**
- `assign_session_on_upload_insert` - Auto-assigns session_id
- `update_session_stats_trigger` - Updates session counts
- `mark_duplicates_on_insert` - Marks duplicate files

**Views:**
- `duplicate_files_view` - Duplicate analysis
- `upload_statistics` - Upload stats by date

---

### 6. `saved_analyses`

**Purpose:** Bookmarked analysis results.

**Key Columns:**
- `id` (UUID, PK)
- `analysis_id` (TEXT, NOT NULL)
- `name` (TEXT, NOT NULL)
- `owner_user_id` (TEXT)
- `session_id` (TEXT)
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_saved_analyses_owner`
- `idx_saved_analyses_analysis`

---

### 7. `signal_detection_config`

**Purpose:** Hierarchical configuration for signal detection (platform → organization → user).

**Key Columns:**
- `id` (UUID, PK)
- `level` (TEXT: 'platform', 'organization', 'user')
- `organization` (TEXT) - NULL for platform/user, set for org
- `user_id` (UUID) - NULL for platform/org, set for user
- `config` (JSONB) - Configuration data
- `created_by` (UUID, references auth.users)
- `notes` (TEXT)

**Unique Constraints:**
- One platform config
- One config per organization
- One config per user

**RLS:** Enabled with role-based policies

---

### 8-12. Infrastructure Tables

**`query_cache`** - Query result caching
- `cache_key` (TEXT, PK)
- `query_hash`, `query_text` (TEXT)
- `result_data` (JSONB)
- `expires_at`, `hit_count`, `last_accessed` (TIMESTAMP/INTEGER)

**`query_patterns`** - Query pattern learning
- `query_pattern` (TEXT, NOT NULL)
- `execution_count`, `avg_duration_ms` (INTEGER/FLOAT)
- `optimization_applied` (JSONB)

**`performance_metrics`** - Performance monitoring
- `metric_name`, `metric_value`, `metric_unit` (TEXT/FLOAT)

**`data_sources`** - Data source metadata
- `source_name`, `source_type` (TEXT, NOT NULL)
- `confidence_score` (FLOAT)
- `priority_rank` (INTEGER)
- `is_active` (BOOLEAN)

**`pv_cases_partitioned`** - Partitioned table for scalability
- Same structure as `pv_cases`
- Partitioned by `event_date` (yearly partitions)

---

## ⚙️ Database Functions

### `get_or_create_session_for_upload(org_name TEXT DEFAULT NULL)`

**Returns:** UUID (session_id)

**Purpose:** Automatically creates or retrieves a session for the current day and organization.

**Logic:**
1. Checks for existing auto-session for today + organization
2. Creates new session if none exists
3. Reactivates completed session if found

**Called by:** Triggers on file upload

---

### `assign_session_to_upload()`

**Returns:** NEW record with session_id set

**Purpose:** Trigger function that automatically assigns session_id to uploaded files.

**Logic:**
1. Gets organization from file record
2. Calls `get_or_create_session_for_upload(org_name)`
3. Sets session_id on NEW record

---

### `update_session_stats()`

**Returns:** NEW/OLD record

**Purpose:** Updates session statistics (files_count, cases_created, valid_cases, invalid_cases) when files are added/removed.

**Triggered:** AFTER INSERT/UPDATE/DELETE on file_uploads

---

### `sync_file_upload_cases()`

**Returns:** NEW record with synchronized fields

**Purpose:** Keeps `cases_created` and `total_cases` fields in sync.

**Triggered:** BEFORE UPDATE on file_upload_history

---

### `mark_duplicate_uploads()`

**Returns:** NEW record with duplicate flags set

**Purpose:** Automatically marks duplicate file uploads based on file hash.

**Logic:**
1. Checks if hash already exists
2. Sets `is_duplicate = true` and `duplicate_of_id` if found

---

### `update_file_upload_validation_stats()`

**Returns:** NEW record

**Purpose:** Updates validation statistics when cases are updated.

**Triggered:** AFTER INSERT/UPDATE on pv_cases

---

### Additional Functions

- `get_cached_query(p_cache_key TEXT)` - Query result caching
- `learn_query_pattern(...)` - Query pattern learning
- `record_performance_metric(...)` - Performance monitoring

---

## 🔄 Triggers

| Trigger Name | Table | Function | Event | Purpose |
|-------------|-------|----------|-------|---------|
| `assign_session_on_upload_insert` | `file_uploads` | `assign_session_to_upload()` | BEFORE INSERT | Auto-assign session to uploads |
| `update_session_stats_trigger` | `file_uploads` | `update_session_stats()` | AFTER INSERT/UPDATE/DELETE | Update session counts |
| `sync_file_upload_cases_trigger` | `file_upload_history` | `sync_file_upload_cases()` | BEFORE UPDATE | Sync case count fields |
| `mark_duplicates_on_insert` | `file_uploads` | `mark_duplicate_uploads()` | BEFORE INSERT | Mark duplicate files |
| `update_validation_stats` | `pv_cases` | `update_file_upload_validation_stats()` | AFTER INSERT/UPDATE | Update validation stats |
| `update_file_uploads_updated_at` | `file_uploads` | `update_updated_at_column()` | BEFORE UPDATE | Auto-update timestamps |
| `update_uploaded_files_updated_at` | `uploaded_files` | `update_updated_at_column()` | BEFORE UPDATE | Auto-update timestamps |
| `signal_config_updated_at` | `signal_detection_config` | `update_signal_config_updated_at()` | BEFORE UPDATE | Auto-update timestamps |

---

## 👁️ Views

### `duplicate_files_view`

**Purpose:** Analyze duplicate file uploads

**Columns:**
- `file_hash`, `duplicate_count`
- `first_uploaded`, `last_uploaded`
- `total_cases`
- `upload_ids[]`, `filenames[]`

**Query:**
```sql
SELECT file_hash, COUNT(*) as duplicate_count, ...
FROM file_uploads
GROUP BY file_hash
HAVING COUNT(*) > 1
```

---

### `upload_statistics`

**Purpose:** Upload stats aggregated by date

**Columns:**
- `upload_date`, `total_uploads`, `duplicate_uploads`
- `total_cases_created`, `total_size_bytes`
- `unique_sessions`

---

### `session_summary_view`

**Purpose:** Session summaries with actual counts

**Joins:** `upload_sessions` LEFT JOIN `file_uploads`

---

### `file_processing_status`

**Purpose:** Simplified file processing status for API

**Columns:**
- `id`, `filename`, `status`, `progress`, `message`
- `cases_created`, `ai_confidence_score`
- `processing_started_at`, `processing_completed_at`, `error`

---

### `incomplete_cases_review`

**Purpose:** Cases needing manual review

**Filter:** `completeness_status != 'complete' OR requires_manual_review = TRUE`

---

### `v_performance_overview`

**Purpose:** Performance metrics overview

**Queries:**
- Total cases count
- Materialized views count
- Custom indexes count
- Cache entries count

---

## 🔌 Complete API Endpoints Reference

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
- Uses Supabase Auth JWT tokens
- Organization scoping via user's `organization` field

---

### Signals API (`/api/v1/signals`)

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

**Response:** Same format as `/api/v1/signals` single signal.

---

### Sessions API (`/api/v1/sessions`)

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

### Files API (`/api/v1/files`)

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

### AI Query API (`/api/v1/ai-query`)

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
signal_detection_config (hierarchical: platform → org → user)
```

**Multi-Tenant Isolation:**
- All tables have `organization` field
- RLS policies enforce org-level access control
- Queries automatically filter by user's organization

---

## 🔄 Integration with New Wireframe

### ✅ What Already Exists (Can Reuse)

#### 1. **Sessions Panel (Left Rail)**

**Database:** `upload_sessions` table  
**API:** `GET /api/v1/sessions`

**Wireframe Mapping:**
- Session list → `GET /api/v1/sessions`
- Timestamp → `started_at` (format as "YYYY-MM-DD HH:MM UTC")
- File count → `files_count`
- Case count → `cases_created`

**Status:** ✅ **READY** - All fields exist

---

#### 2. **Safety Snapshot KPIs**

**API:** `GET /api/v1/signals/stats`

**Wireframe Mapping:**
- Total Cases → `total_cases`
- Critical Signals → `critical_signals`
- Serious Events → `serious_events`
- Products Monitored → `unique_drugs`

**Missing for Wireframe:**
- ⚠️ Trend indicators (delta, % change)
- ⚠️ Comparison period logic

**Status:** ✅ **MOSTLY READY** - Needs trend calculations

---

#### 3. **Signals Table**

**API:** `GET /api/v1/signals`

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

**Status:** ✅ **MOSTLY READY** - Needs search enhancement

---

#### 4. **Priority Signals (Statistical)**

**API:** `GET /api/v1/signals/priority`

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

**Status:** ⚠️ **PARTIAL** - Statistical ranking works, needs AI/velocity/recommendations

---

#### 5. **File Upload**

**API:** `POST /api/v1/files/upload`, `GET /api/v1/files/{file_id}/status`

**Wireframe Mapping:**
- File name → `filename`
- Size → `file_size_bytes`
- Type → `file_type`
- Status → `upload_status`
- Progress → `progress` (exists, may need enhancement)

**Status:** ✅ **READY** - All fields exist

---

#### 6. **Cases Data**

**Database:** `pv_cases` table  
**API:** Query via signals API

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

**Status:** ✅ **DATA READY** - Needs API endpoint

---

### ❌ What's Missing (Need to Build)

#### 1. **Deep Analysis Modal - Trajectory Tab**

**Required:**
- New endpoint: `GET /api/v1/signals/{signal_id}/trajectory`
- Time-series aggregation from `pv_cases.onset_date`
- Forecast model implementation (statistical or ML)
- Confidence bands (95% CI)
- Scenario modeling (no action vs intervention)
- Velocity calculations
- "Hospitalizations avoided" projections

**Data Structure Needed:**
```typescript
interface TrajectoryData {
  historical: Array<{ date: string; cases: number; lower: number; upper: number }>;
  forecast: {
    noAction: Array<{ date: string; cases: number; lower: number; upper: number }>;
    intervention: Array<{ date: string; cases: number; lower: number; upper: number }>;
  };
  velocity_pct: number;
  velocity_direction: "Increasing" | "Decreasing" | "Stable";
  projected_cases_final: number;
  projected_cases_intervention: number;
  hospitalizations_avoided: number;
  confidence_level: "High" | "Med" | "Low";
}
```

**Status:** ❌ **NOT IMPLEMENTED** - Major feature gap

---

#### 2. **Deep Analysis Modal - Evidence Tab**

**Required:**
- New endpoint: `GET /api/v1/signals/{signal_id}/evidence`
- Evidence aggregation API per signal
- Source freshness tracking
- Cross-source deduplication metadata
- Logic summary generation

**Data Structure Needed:**
```typescript
interface EvidenceData {
  evidence_sources: Array<{
    source_type: "FAERS" | "Literature" | "Early Signals";
    item_count: number;
    last_updated: timestamp;
    new_this_week?: number;
    source_weight?: number;
  }>;
  deduplication_status: "resolved" | "pending";
  logic_summary: string;
}
```

**Status:** ⚠️ **PARTIAL** - Source field exists, needs structured API

---

#### 3. **Deep Analysis Modal - Audit Tab**

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

**Status:** ❌ **NOT IMPLEMENTED** - Critical for compliance

---

#### 4. **AI Assistant Chat**

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

**Status:** ❌ **NOT IMPLEMENTED** - NLP engine exists, needs persistence

---

#### 5. **AI Confidence Scoring**

**Required:**
- ML model for composite signal ranking
- New field: `ai_confidence` on signals (computed, not stored)
- New endpoint enhancement: Add AI confidence to priority signals

**Status:** ❌ **NOT IMPLEMENTED** - Requires model development

---

#### 6. **Priority Signal Velocity**

**Required:**
- Time-series aggregation of cases over time
- Velocity calculation algorithm
- New fields: `velocity_pct`, `velocity_direction`

**Status:** ❌ **NOT IMPLEMENTED** - Needs time-series aggregation

---

#### 7. **Recommendation Generation**

**Required:**
- Business logic/rules engine
- New field: `recommendation` on priority signals

**Status:** ❌ **NOT IMPLEMENTED** - Needs rules engine

---

#### 8. **KPI Trends**

**Required:**
- Time-series aggregation
- Comparison logic (current vs previous period)
- New fields: `delta`, `trend_direction`, `comparison_period`

**Status:** ❌ **NOT IMPLEMENTED** - Needs time-series aggregation

---

## 🎯 Implementation Priority for Phase 4

### Phase 4.1: Critical Missing Features

1. **Audit System** - Regulatory compliance requirement
   - Create `audit_events` table
   - Implement audit logging middleware
   - Create audit API endpoint

2. **Trajectory/Forecast Models** - Core value proposition
   - Time-series aggregation
   - Forecast model implementation
   - Trajectory API endpoint

3. **AI Confidence Scoring** - Differentiation
   - ML model development
   - Composite scoring algorithm
   - Integration into priority signals

### Phase 4.2: Enhancements

1. **Chat Persistence** - Better UX
2. **Evidence API** - Completes Deep Analysis modal
3. **Velocity Calculations** - Temporal intelligence
4. **KPI Trends** - Better UX

### Phase 4.3: Nice to Have

1. **Text Search** - UX enhancement
2. **Recommendation Engine** - Decision support
3. **Progress Percentage** - UX polish

---

## 📚 Additional Resources

- **Detailed Schema:** [`COMPLETE_DATABASE_SCHEMA.md`](./COMPLETE_DATABASE_SCHEMA.md) - Complete table definitions with all columns
- **Phase 3 Contract:** [`PHASE_3_UI_DATA_CONTRACT.md`](./PHASE_3_UI_DATA_CONTRACT.md) - UI requirements
- **Implementation Inventory:** [`PHASE_3_EXISTING_IMPLEMENTATION_INVENTORY.md`](./PHASE_3_EXISTING_IMPLEMENTATION_INVENTORY.md) - What exists vs what's needed

---

## 💡 Notes for AI Assistants (Grok/ChatGPT)

### What You Can Reuse

✅ All database tables exist and are production-ready  
✅ Most API endpoints exist and return correct data  
✅ Multi-tenant isolation is implemented  
✅ Statistical signal detection is complete  

### What Needs Extension

⚠️ Add new endpoints for Deep Analysis modal (Trajectory, Evidence, Audit)  
⚠️ Add new tables for chat and audit  
⚠️ Enhance existing endpoints with missing fields (AI confidence, velocity, recommendations)  
⚠️ Add time-series aggregation for trajectories and trends  

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

**Document Status:** ✅ Complete  
**Last Updated:** 2025-12-13  
**Ready to Share:** Yes - This document contains everything needed for AI-assisted development

