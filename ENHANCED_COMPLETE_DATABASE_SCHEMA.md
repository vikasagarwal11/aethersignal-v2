# Complete AetherSignal Database Schema & API Reference

**Purpose:** Complete technical reference for database schema, APIs, and system architecture to enable AI-assisted development and wireframe integration.

**Generated:** 2025-12-13  
**Database:** PostgreSQL (Supabase)  
**Status:** Production Schema (from migration files)

---

## 📋 Quick Navigation

- [Complete Schema Documentation](#complete-schema-documentation) - Full database schema from migrations
- [API Endpoints Reference](#api-endpoints-reference) - All REST API endpoints
- [Database Functions](#database-functions) - All stored procedures and functions
- [Triggers & Views](#triggers--views) - Database automation
- [Integration Guide](#integration-guide) - How to use this with the new wireframe

---

## 📊 Complete Schema Documentation

> **Note:** For the most detailed schema, see: [`COMPLETE_DATABASE_SCHEMA.md`](./COMPLETE_DATABASE_SCHEMA.md)

### Summary of Database Objects

| Type | Count | Description |
|------|-------|-------------|
| **Tables** | 12 | Core data storage tables |
| **Functions** | 4+ | Stored procedures and helper functions |
| **Triggers** | 8+ | Automated database operations |
| **Views** | 6+ | Pre-defined query views |
| **Indexes** | 50+ | Performance optimization indexes |

---

## 📊 Tables Overview

### Core Tables

1. **`user_profiles`** - Extended user information beyond Supabase Auth
2. **`pv_cases`** - Pharmacovigilance case data (52+ columns)
3. **`upload_sessions`** - Immutable analysis sessions
4. **`file_upload_history`** - File upload tracking (31 columns)
5. **`file_uploads`** - Alternative file upload tracking table
6. **`saved_analyses`** - Bookmarked analysis results
7. **`signal_detection_config`** - Signal detection configuration (hierarchical)

### Performance & Infrastructure Tables

8. **`query_cache`** - Query result caching
9. **`query_patterns`** - Query pattern learning
10. **`performance_metrics`** - Performance monitoring
11. **`data_sources`** - Data source metadata
12. **`pv_cases_partitioned`** - Partitioned version for scalability

---

## 🔌 API Endpoints Reference

### Base URL
```
http://localhost:8000/api/v1
```

### Signals API (`/api/v1/signals`)

#### `GET /api/v1/signals/stats`
Get aggregated KPI statistics.

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

#### `GET /api/v1/signals`
List all signals with filtering.

**Query Parameters:**
- `organization` (optional): Filter by organization
- `dataset` (optional): Filter by source
- `session_date` (optional): Filter by session date
- `priority` (optional): 'Critical', 'High', 'Medium'
- `serious_only` (optional): boolean
- `limit` (optional): default 100
- `offset` (optional): default 0

#### `GET /api/v1/signals/statistical`
Get signals using specific statistical methods (PRR, ROR, IC).

**Query Parameters:**
- `method`: 'prr', 'ror', 'ic', or 'all'
- `threshold`: 'standard', 'strict', or 'sensitive'
- `min_cases`: Minimum case count

#### `GET /api/v1/signals/priority`
Get top priority signals for investigation.

#### `GET /api/v1/signals/drug-event/{drug}/{event}`
Get detailed signal information for a specific drug-event pair.

---

### Sessions API (`/api/v1/sessions`)

#### `GET /api/v1/sessions`
List all sessions for an organization.

#### `POST /api/v1/sessions`
Create a new session.

#### `GET /api/v1/sessions/{session_id}`
Get detailed session information.

---

### Files API (`/api/v1/files`)

#### `POST /api/v1/files/upload`
Upload a file for processing.

#### `GET /api/v1/files/{file_id}/status`
Get file processing status.

---

### AI Query API (`/api/v1/ai-query`)

#### `POST /api/v1/ai-query`
Natural language query interface.

**Request:**
```json
{
  "query": "Show me serious bleeding events for Aspirin",
  "organization": "Global Safety Org",
  "session_id": "uuid"
}
```

---

## ⚙️ Database Functions

### Session Management Functions

#### `get_or_create_session_for_upload(org_name TEXT)`
Automatically creates or retrieves a session for the current day and organization.

**Returns:** UUID (session_id)

**Usage:** Called by triggers when files are uploaded.

---

#### `assign_session_to_upload()`
Trigger function that automatically assigns a session_id to uploaded files.

**Returns:** NEW record with session_id set

---

#### `update_session_stats()`
Trigger function that updates session statistics when files are added/removed.

**Returns:** NEW/OLD record

---

### File Processing Functions

#### `sync_file_upload_cases()`
Keeps `cases_created` and `total_cases` fields in sync.

**Returns:** NEW record with synchronized fields

---

#### `mark_duplicate_uploads()`
Automatically marks duplicate file uploads based on file hash.

**Returns:** NEW record with duplicate flags set

---

#### `update_file_upload_validation_stats()`
Updates validation statistics when cases are updated.

**Returns:** NEW record

---

## 🔄 Triggers

| Trigger Name | Table | Function | Purpose |
|-------------|-------|----------|---------|
| `assign_session_on_upload_insert` | `file_uploads` | `assign_session_to_upload()` | Auto-assign session to uploads |
| `update_session_stats_trigger` | `file_uploads` | `update_session_stats()` | Update session counts |
| `sync_file_upload_cases_trigger` | `file_upload_history` | `sync_file_upload_cases()` | Sync case count fields |
| `mark_duplicates_on_insert` | `file_uploads` | `mark_duplicate_uploads()` | Mark duplicate files |
| `update_validation_stats` | `pv_cases` | `update_file_upload_validation_stats()` | Update validation stats |
| `update_file_uploads_updated_at` | `file_uploads` | `update_updated_at_column()` | Auto-update timestamps |
| `update_uploaded_files_updated_at` | `uploaded_files` | `update_updated_at_column()` | Auto-update timestamps |
| `signal_config_updated_at` | `signal_detection_config` | `update_signal_config_updated_at()` | Auto-update timestamps |

---

## 👁️ Views

| View Name | Purpose |
|-----------|---------|
| `duplicate_files_view` | Analyze duplicate file uploads |
| `upload_statistics` | Upload stats aggregated by date |
| `session_summary_view` | Session summaries with actual counts |
| `file_processing_status` | Simplified file processing status |
| `incomplete_cases_review` | Cases needing manual review |
| `v_performance_overview` | Performance metrics overview |

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

## 📐 Key Data Models

### Signal Model
```typescript
interface Signal {
  id: string;
  drug: string;
  reaction: string;
  prr: number;
  prr_ci_lower?: number;
  prr_ci_upper?: number;
  prr_is_signal?: boolean;
  ror?: number;
  ror_ci_lower?: number;
  ror_ci_upper?: number;
  ror_is_signal?: boolean;
  ic?: number;
  ic025?: number;
  ic_is_signal?: boolean;
  cases: number;
  priority: string;
  serious: boolean;
  dataset: string;
  organization?: string;
  is_statistical_signal?: boolean;
  signal_strength?: string;  // 'strong', 'moderate', 'weak', 'none'
  methods_flagged?: string[];  // ['PRR', 'ROR', 'IC']
}
```

### Session Model
```typescript
interface Session {
  id: string;
  name: string;
  started_at: datetime;
  files_count: number;
  cases_created: number;
  valid_cases: number;
  invalid_cases: number;
  status: string;
  organization: string;
}
```

### Case Model
```typescript
interface PvCase {
  id: string;
  user_id: string;
  organization: string;
  case_id?: string;
  drug_name?: string;
  reaction?: string;
  age?: number;
  sex?: string;
  serious: boolean;
  outcome?: string;
  onset_date?: date;
  source: string;
  // Statistical fields
  prr?: number;
  ror?: number;
  ic?: number;
  signal_strength?: string;
  // ... (52+ total columns)
}
```

---

## 🔄 Integration Guide

### For Wireframe Integration

#### ✅ What Already Exists

1. **Sessions Panel** → `GET /api/v1/sessions`
2. **KPIs** → `GET /api/v1/signals/stats`
3. **Signals Table** → `GET /api/v1/signals`
4. **Priority Signals** → `GET /api/v1/signals/priority`
5. **File Upload** → `POST /api/v1/files/upload`
6. **Cases Data** → Query `pv_cases` table

#### ❌ What Needs to Be Built

1. **Trajectory API** → `GET /api/v1/signals/{signal_id}/trajectory`
2. **Evidence API** → `GET /api/v1/signals/{signal_id}/evidence`
3. **Audit API** → `GET /api/v1/signals/{signal_id}/audit`
4. **Chat Messages API** → `GET/POST /api/v1/chat/messages`
5. **AI Confidence Scoring** → Enhance priority signals endpoint

#### 🔧 Database Tables to Create

1. **`audit_events`** - Event logging for compliance
2. **`chat_messages`** - Chat conversation persistence
3. **`signal_trajectories`** (optional) - Cached trajectory data

---

## 📚 Additional Resources

- **Detailed Schema:** [`COMPLETE_DATABASE_SCHEMA.md`](./COMPLETE_DATABASE_SCHEMA.md) - Complete table definitions
- **Phase 3 Contract:** [`PHASE_3_UI_DATA_CONTRACT.md`](./PHASE_3_UI_DATA_CONTRACT.md) - UI requirements
- **Implementation Inventory:** [`PHASE_3_EXISTING_IMPLEMENTATION_INVENTORY.md`](./PHASE_3_EXISTING_IMPLEMENTATION_INVENTORY.md) - What exists vs what's needed

---

**Document Status:** Complete  
**Last Updated:** 2025-12-13

