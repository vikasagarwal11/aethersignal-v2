# Phase 3 — Existing Implementation Inventory

**Purpose:** Comprehensive mapping of existing backend functionality against Phase 3 UI → Data Contract requirements.

**Date:** 2025-01-XX  
**Status:** Pre-Phase 4 Assessment

---

## Executive Summary

This document inventories what has already been implemented before the mock UI work, and what needs to be built to fulfill the Phase 3 Data Contract.

### High-Level Status

| Category | Status | Coverage |
|----------|--------|----------|
| **Authentication & Multi-Tenant** | ✅ Complete | Full user auth, org scoping |
| **Database Schema** | ✅ Mostly Complete | Core tables exist, some gaps |
| **Session Management** | ✅ Complete | Sessions API fully implemented |
| **File Upload & Ingestion** | ✅ Complete | Multi-format parsing, AI extraction |
| **Signal Detection (Statistical)** | ✅ Complete | PRR, ROR, IC, MGPS, EBGM implemented |
| **Signal Detection (Advanced)** | ✅ Partial | Temporal, Quantum Fusion exist, needs integration |
| **KPIs & Aggregations** | ✅ Partial | Basic stats exist, needs enhancement |
| **Deep Analysis (Trajectory)** | ❌ Missing | No forecast/trajectory models |
| **Deep Analysis (Evidence)** | ✅ Partial | Source tracking exists, needs formalization |
| **Deep Analysis (Cases)** | ✅ Complete | Case querying works |
| **Deep Analysis (Audit)** | ❌ Missing | No audit event logging system |
| **AI Assistant / Chat** | ✅ Partial | NLP query engine exists, needs session context |
| **Priority Signal Ranking** | ✅ Partial | Statistical ranking exists, needs AI confidence scoring |

---

## 1️⃣ GLOBAL CONTEXT

### ✅ Implemented

**Multi-Tenant Support:**
- ✅ `user_profiles` table with `organization` field
- ✅ Row-Level Security (RLS) policies
- ✅ Organization-scoped data isolation
- ✅ `pv_cases` table has `organization` and `user_id` fields

**Session Management:**
- ✅ `upload_sessions` table (migration 009)
- ✅ Organization-scoped sessions
- ✅ Session API (`/api/v1/sessions`)
- ✅ Session creation, listing, detail endpoints

### 🔄 Needs Enhancement

- ⚠️ Session-to-signal association (for Deep Analysis modal context)
- ⚠️ Session-scoped KPI calculations

---

## 2️⃣ CONTEXT BAR

### ❌ Not Implemented (Mock Only)

**Required Fields:**
- `org_id` (UUID) - ✅ Available from user context
- `dataset_ids` (UUID[]) - ❌ No dataset concept yet
- `scope_type` (enum: org/product) - ❌ Not implemented

**Status:** This is currently UI-only in the mock. Needs:
- Dataset abstraction (FAERS, EudraVigilance as first-class entities)
- Scope type filtering logic

---

## 3️⃣ SESSIONS PANEL (Left Rail)

### ✅ Implemented

**API Endpoints:**
- ✅ `GET /api/v1/sessions` - List sessions
- ✅ `POST /api/v1/sessions` - Create session
- ✅ `GET /api/v1/sessions/{id}` - Session detail

**Data Model (`upload_sessions` table):**
- ✅ `id` (UUID) - Session ID
- ✅ `name` (TEXT) - Session label
- ✅ `started_at` (TIMESTAMP) - Creation time
- ✅ `organization` (TEXT) - Org scope
- ✅ `files_count` (INTEGER) - File count
- ✅ `cases_created` (INTEGER) - Case count
- ✅ `status` (TEXT) - active/completed/failed

**Response Models:**
- ✅ `SessionSummary` - List view
- ✅ `SessionDetail` - Detail view with files and stats

### 🔄 Needs Enhancement

**Required by Phase 3:**
- ⚠️ `source_manifest` (object) - Not in current schema
- ⚠️ CFR-style timestamp formatting (`YYYY-MM-DD HH:MM UTC`)
- ⚠️ `ingestion_status` enum - Currently just `status`, may need mapping

---

## 4️⃣ SAFETY SNAPSHOT KPIs

### ✅ Partially Implemented

**API Endpoint:**
- ✅ `GET /api/v1/signals/stats` - Returns:
  - `total_cases`
  - `critical_signals` (count where priority=critical)
  - `serious_events` (count where serious=true)
  - `unique_drugs` (count distinct drug_name)
  - `unique_reactions` (count distinct reaction)

**Current Implementation:**
- ✅ Aggregates from `pv_cases` table
- ✅ Supports `organization` filter
- ✅ Supports `dataset` (source) filter
- ✅ Supports `session_date` filter

### 🔄 Needs Enhancement

**Missing Fields (Phase 3):**
- ⚠️ `delta` (string) - Trend indicators ("+12.3% vs last month")
- ⚠️ `trend_direction` (enum) - up/down/stable
- ⚠️ `comparison_period` (string) - What period is compared

**Missing Logic:**
- ⚠️ Comparison with previous periods (needs time-series aggregation)
- ⚠️ "Products Monitored" calculation (needs drug normalization)

---

## 5️⃣ AI PRIORITY SIGNALS

### ✅ Partially Implemented

**API Endpoint:**
- ✅ `GET /api/v1/signals/priority` - Returns top priority signals
- ✅ `GET /api/v1/signals/statistical` - Statistical signal detection

**Current Data:**
- ✅ `drug` / `drug_name`
- ✅ `event` / `reaction`
- ✅ `prr` (Proportional Reporting Ratio)
- ✅ `case_count` / `a` (cases)
- ✅ `priority` (calculated from signal strength + case count)
- ✅ `signal_strength` (strong/moderate/weak/none)
- ✅ `methods_flagged` (array of methods: PRR, ROR, IC)
- ✅ `ror`, `ic` values

### ❌ Missing (Critical for Phase 3)

**AI Confidence Scoring:**
- ❌ `ai_confidence` (float 0-1) - **NOT IMPLEMENTED**
- ❌ Composite ML model for signal ranking
- ❌ AI-based priority assignment

**Velocity & Trend:**
- ❌ `velocity_pct` (float) - Week-over-week change %
- ❌ `velocity_direction` (enum) - Increasing/Decreasing/Stable
- ❌ Temporal pattern analysis integration

**Additional Fields:**
- ❌ `rank` (number) - Explicit ranking (1 = highest)
- ❌ `recommendation` (enum) - Escalate/Monitor/Defer
- ❌ `prr_confidence_interval` (object) - Lower/upper bounds (has `prr_ci_lower`/`prr_ci_upper` but not structured)
- ❌ `drug_id` (UUID) - Normalized drug identifier
- ❌ `meddra_pt_id` (UUID) - MedDRA code

**Action Buttons:**
- ⚠️ Advisory actions exist conceptually but no API endpoints for "Escalate/Monitor/Defer"

**Signal Detection Engines:**
- ✅ `backend/app/core/signal_detection/disproportionality_analysis.py` - PRR, ROR
- ✅ `backend/app/core/signal_detection/bayesian_signal_detection.py` - IC, MGPS, EBGM
- ✅ `backend/app/core/signal_detection/temporal_pattern_detection.py` - Temporal analysis
- ✅ `backend/app/core/signal_detection/quantum_fusion_api.py` - Quantum-Bayesian fusion
- ⚠️ **Needs integration** into unified priority signal endpoint

---

## 6️⃣ SIGNALS TABLE (Triage Layer)

### ✅ Implemented

**API Endpoints:**
- ✅ `GET /api/v1/signals` - List all signals
- ✅ `GET /api/v1/signals/statistical` - Filtered by method/threshold
- ✅ `GET /api/v1/signals/drug-event/{drug}/{event}` - Single signal detail

**Data Model:**
- ✅ `drug_name` / `drug`
- ✅ `event_term` / `reaction`
- ✅ `prr`
- ✅ `case_count`
- ✅ `serious_flag` (from `serious` boolean)
- ✅ `priority_level` (from `priority` field)

**Filtering:**
- ✅ `organization` filter
- ✅ `dataset` (source) filter
- ✅ `session_date` filter
- ✅ `method` filter (PRR, ROR, IC, all)
- ✅ `threshold` filter (standard/strict/sensitive)
- ✅ `min_cases` filter

### 🔄 Needs Enhancement

**Sorting & Pagination:**
- ⚠️ Server-side sorting (currently client-side in mock)
- ⚠️ Pagination support (`limit`/`offset` or cursor-based)

**Search:**
- ❌ `search_query` (text search for drug/event) - Not implemented

**Additional Fields:**
- ⚠️ `serious_count` (separate from flag) - Not explicitly returned

---

## 7️⃣ DEEP ANALYSIS MODAL — TAB CONTRACTS

---

### 7.1️⃣ Trajectory Tab

### ❌ Not Implemented (Critical Gap)

**Missing Components:**
- ❌ Time-series case aggregation (historical data)
- ❌ Forecast model (predictive trajectory)
- ❌ Confidence bands (95% CI)
- ❌ Scenario modeling (no action vs intervention)
- ❌ Horizon selector logic (30d / 90d / 6m / 12m)
- ❌ Velocity calculation
- ❌ "Hospitalizations avoided" projection

**Data Requirements (Phase 3):**
- ❌ `time_series[]` array with historical + forecast points
- ❌ `scenario_no_action` vs `scenario_intervention` forecasts
- ❌ `projected_cases_final` / `projected_cases_intervention`
- ❌ `hospitalizations_avoided` calculation

**Status:** This is the **biggest gap** for Phase 4. Requires:
1. Time-series aggregation from `pv_cases.onset_date`
2. Forecast model implementation (statistical or ML)
3. Confidence interval calculation
4. Scenario modeling logic

---

### 7.2️⃣ Evidence Tab

### ✅ Partially Implemented

**Current State:**
- ✅ `pv_cases.source` field exists (FAERS, E2B, etc.)
- ✅ Source-based filtering works

**Missing Components:**
- ❌ `evidence_sources[]` structured data per signal
- ❌ Source freshness tracking (`last_updated`, `new_this_week`)
- ❌ Source weight/reliability scoring
- ❌ Cross-source deduplication metadata
- ❌ Logic summary generation

**Data Requirements (Phase 3):**
- ❌ `evidence_sources[].source_type` enum (FAERS/Literature/Early Signals)
- ❌ `evidence_sources[].item_count`
- ❌ `evidence_sources[].last_updated` timestamp
- ❌ `evidence_sources[].new_this_week` count
- ❌ `evidence_sources[].source_weight` float
- ❌ `deduplication_status` string
- ❌ `logic_summary` string

**Status:** Core data exists (`source` field), but needs:
1. Evidence aggregation API per signal
2. Freshness tracking (timestamps on cases)
3. Source categorization (Literature vs FAERS vs Social)
4. Deduplication logic

---

### 7.3️⃣ Cases Tab

### ✅ Implemented

**API Endpoints:**
- ✅ `GET /api/v1/signals/drug-event/{drug}/{event}` - Returns cases for a signal
- ✅ Case querying from `pv_cases` table

**Data Model (`pv_cases` table):**
- ✅ `case_id` (TEXT)
- ✅ `age` / `age_yrs` (NUMERIC)
- ✅ `sex` (TEXT)
- ✅ `serious` (BOOLEAN)
- ✅ `outcome` (TEXT)
- ✅ `onset_date` (DATE)
- ✅ `country` (TEXT)
- ✅ `source` (TEXT)

**Filtering:**
- ✅ Organization-scoped (via RLS)
- ✅ Drug-event filtering

### 🔄 Needs Enhancement

**Missing Features:**
- ⚠️ Pagination for case list (currently returns all)
- ⚠️ Date range filtering (Phase 3 requirement)
- ⚠️ "Serious only" filter toggle
- ⚠️ Case detail expansion (currently flat list)

**Additional Fields:**
- ⚠️ `report_date` exists but may need formatting

**Status:** Core functionality works, needs UI-friendly filtering and pagination.

---

### 7.4️⃣ Audit Tab

### ❌ Not Implemented (Critical for Compliance)

**Missing Components:**
- ❌ Audit event table
- ❌ Event logging system
- ❌ CFR Part 11-compliant timestamps
- ❌ Actor attribution (AI vs User)

**Data Requirements (Phase 3):**
- ❌ `audit_events` table with:
  - `event_id` (UUID)
  - `signal_id` (UUID) - Optional, can be null for global events
  - `event_type` (enum)
  - `timestamp` (TIMESTAMP UTC)
  - `actor` (enum: AI/User)
  - `actor_name` (string)
  - `details` (string)
  - `metadata` (JSONB)

**Event Types Needed:**
- ❌ `query_executed` - Signal detection query run
- ❌ `trajectory_generated` - Forecast model executed
- ❌ `recommendation_issued` - AI recommendation created
- ❌ `analysis_viewed` - User opened deep analysis
- ❌ `filters_applied` - User applied filters
- ❌ `report_generated` - User exported report

**Status:** This is a **critical gap** for regulatory compliance. Needs:
1. `audit_events` table creation
2. Audit logging middleware/service
3. Event type enum definition
4. API endpoint to retrieve audit timeline per signal

---

## 8️⃣ AI ASSISTANT PANEL

### ✅ Partially Implemented

**API Endpoints:**
- ✅ `POST /api/v1/ai-query` - Natural language query
- ✅ `POST /api/v1/enhanced-ai-query` - Enhanced NLP + fusion
- ✅ `POST /api/v1/fusion-query` - Fusion engine from filters

**Current Features:**
- ✅ NLP query interpretation (`ConversationalQueryInterpreter`)
- ✅ Filter extraction from natural language
- ✅ Signal querying based on interpreted filters
- ✅ Response generation

**Components:**
- ✅ `backend/app/core/nlp/enhanced_parser.py` - Query interpretation
- ✅ `backend/app/core/analysis/models.py` - `SignalQueryFilters` model
- ✅ `backend/app/api/ai_query.py` - Main AI query endpoint
- ✅ `backend/app/api/enhanced_ai_query_api.py` - Enhanced endpoint
- ✅ `backend/app/api/semantic_chat_engine.py` - Chat engine

### ❌ Missing (Phase 3 Requirements)

**Chat Context:**
- ❌ Chat message persistence (no `chat_messages` table)
- ❌ Session-scoped chat context
- ❌ Message history retrieval
- ❌ Referenced signal tracking

**Data Requirements:**
- ❌ `chat_messages` table with:
  - `message_id` (UUID)
  - `session_id` (UUID)
  - `org_id` (UUID)
  - `role` (enum: user/assistant)
  - `text` (TEXT)
  - `timestamp` (TIMESTAMP)
  - `referenced_signal_ids` (UUID[])
  - `interpreted_filters` (JSONB)

**Menu Actions:**
- ❌ "View interpreted filters" - Needs filter serialization
- ❌ "Evidence & sources" - Needs evidence API integration
- ❌ "Audit trail" - Needs audit system
- ❌ "Confirm & generate report" - Needs report generation
- ❌ "Adjust filters" - Needs filter editing UI

**Status:** Core NLP works, but needs:
1. Chat message persistence
2. Session context management
3. Action menu integration
4. Signal reference tracking

---

## 9️⃣ UPLOAD MODAL

### ✅ Implemented

**API Endpoints:**
- ✅ `POST /api/v1/files/upload` - File upload
- ✅ `GET /api/v1/files/{file_id}/status` - Upload status
- ✅ `POST /api/v1/intelligent-ingest` - Intelligent ingestion pipeline

**Current Features:**
- ✅ Multi-format support (PDF, Word, Excel, CSV, XML, Email, Images)
- ✅ File type detection
- ✅ AI extraction (Claude/Anthropic)
- ✅ Progress tracking
- ✅ Duplicate detection
- ✅ Session association
- ✅ Organization scoping

**Data Model (`file_upload_history` table):**
- ✅ `id` (UUID)
- ✅ `filename` (TEXT)
- ✅ `file_size_bytes` (BIGINT)
- ✅ `file_type` (TEXT)
- ✅ `upload_status` (TEXT) - queued/uploading/processing/completed/failed
- ✅ `organization` (TEXT)
- ✅ `uploaded_at` (TIMESTAMP)
- ✅ `processing_started_at` / `processing_completed_at`
- ✅ `session_id` (UUID) - Via `file_uploads` table
- ✅ Statistics (`total_cases`, `total_events`, etc.)

### 🔄 Needs Enhancement

**Missing Fields (Phase 3):**
- ⚠️ `progress` (0-100) - Currently has status but not numeric progress
- ⚠️ `mime_type` - May exist but not explicitly returned
- ⚠️ `error_message` - May exist in `processing_error` field
- ⚠️ `inner_files[]` - For ZIP archives, not structured

**ZIP Handling:**
- ✅ ZIP upload works
- ⚠️ Inner file tracking needs formalization

**Status:** Core upload works well. Needs:
1. Progress percentage calculation
2. Structured inner_files array for ZIPs
3. Error message standardization

---

## 📊 SUMMARY: What Exists vs What's Needed

### ✅ Fully Implemented (Ready for Phase 4)

1. **Authentication & Multi-Tenancy**
   - User profiles, organization scoping, RLS

2. **Session Management**
   - Sessions API, org-scoped sessions, session detail

3. **File Upload & Ingestion**
   - Multi-format parsing, AI extraction, progress tracking

4. **Statistical Signal Detection**
   - PRR, ROR, IC, MGPS, EBGM calculations
   - Signal strength determination
   - Priority labeling

5. **Case Management**
   - Case storage, querying, filtering

### 🔄 Partially Implemented (Needs Enhancement)

1. **KPIs**
   - ✅ Basic stats exist
   - ❌ Trend/delta calculations missing
   - ❌ Comparison period logic missing

2. **Priority Signals**
   - ✅ Statistical ranking exists
   - ❌ AI confidence scoring missing
   - ❌ Velocity calculations missing
   - ❌ Recommendation generation missing

3. **Signals Table**
   - ✅ Core querying works
   - ⚠️ Pagination needs enhancement
   - ❌ Text search missing

4. **Evidence Tab**
   - ✅ Source field exists
   - ❌ Structured evidence API missing
   - ❌ Freshness tracking missing

5. **AI Assistant**
   - ✅ NLP query engine works
   - ❌ Chat persistence missing
   - ❌ Session context missing
   - ❌ Action menu integration missing

6. **Upload Modal**
   - ✅ Core upload works
   - ⚠️ Progress percentage needs formalization

### ❌ Not Implemented (Critical Gaps)

1. **Trajectory Tab (Forecast Models)**
   - ❌ Time-series aggregation
   - ❌ Forecast model
   - ❌ Confidence bands
   - ❌ Scenario modeling
   - ❌ Velocity calculations
   - **Status:** **Major gap, requires new model development**

2. **Audit Tab (Event Logging)**
   - ❌ Audit events table
   - ❌ Event logging system
   - ❌ CFR Part 11 compliance
   - **Status:** **Critical for regulatory compliance**

3. **Context Bar (Dataset Abstraction)**
   - ❌ Dataset as first-class entity
   - ❌ Scope type filtering
   - **Status:** **Architectural enhancement needed**

4. **AI Confidence Scoring**
   - ❌ ML model for signal ranking
   - ❌ Composite scoring algorithm
   - **Status:** **Requires model development**

---

## 🎯 Phase 4 Implementation Priorities

### Priority 1: Critical Gaps (Must Have)

1. **Audit System** - Regulatory compliance requirement
2. **Trajectory/Forecast Models** - Core value proposition
3. **AI Confidence Scoring** - Differentiates from basic statistical tools

### Priority 2: Enhancements (Should Have)

1. **KPIs with Trends** - Better UX
2. **Chat Persistence** - Better UX
3. **Evidence API** - Completes Deep Analysis modal
4. **Priority Signal Velocity** - Adds temporal intelligence

### Priority 3: Nice to Have

1. **Dataset Abstraction** - Architectural improvement
2. **Text Search** - UX enhancement
3. **Progress Percentage** - UX polish

---

## 📝 Notes for Phase 4

### Database Schema Gaps

**New Tables Needed:**
- `audit_events` - Event logging
- `chat_messages` - Chat persistence
- `datasets` - Dataset abstraction (optional)
- `signal_rankings` - Cached AI confidence scores (optional)

**Table Enhancements:**
- `upload_sessions.source_manifest` (JSONB column)
- `pv_cases.drug_id` (normalized drug UUID)
- `pv_cases.meddra_pt_id` (MedDRA code UUID)

### API Endpoint Gaps

**New Endpoints Needed:**
- `GET /api/v1/signals/{signal_id}/trajectory` - Forecast data
- `GET /api/v1/signals/{signal_id}/evidence` - Evidence sources
- `GET /api/v1/signals/{signal_id}/audit` - Audit timeline
- `POST /api/v1/signals/{signal_id}/actions` - Escalate/Monitor/Defer
- `GET /api/v1/chat/messages` - Chat history
- `POST /api/v1/chat/messages` - Send message

**Endpoint Enhancements:**
- `GET /api/v1/signals/stats` - Add trend/delta calculations
- `GET /api/v1/signals/priority` - Add AI confidence, velocity, recommendations
- `GET /api/v1/signals` - Add pagination, text search
- `GET /api/v1/files/{file_id}/status` - Add progress percentage

### Model/Algorithm Gaps

**New Models Needed:**
- Forecast model (statistical or ML-based)
- AI confidence scoring model (composite ML)
- Velocity calculation algorithm
- Recommendation generation logic

**Integration Needed:**
- Temporal pattern detection → Priority signals
- Quantum fusion → Priority signals
- All signal detection engines → Unified ranking

---

**Document Status:** Complete  
**Next Step:** Phase 4 planning based on this inventory

