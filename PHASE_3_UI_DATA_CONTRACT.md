# PHASE 3 — UI → DATA CONTRACT

**AetherSignal: Pre-Signal Safety Intelligence MVP**

**Version:** 1.0  
**Date:** 2025-01-XX  
**Status:** Contract of Intent (Not Implementation)

---

## 0️⃣ Guiding Principles (Read This First)

### What This Contract Defines

* What each UI element represents conceptually
* What data it expects (shape, not source code)
* Where that data comes from conceptually
* What is intentionally *out of scope*

### What This Contract Does NOT Define

* Database schemas (Phase 4)
* Model algorithms (Phase 4)
* Ingestion pipelines (Phase 4)
* API endpoints (Phase 4)

**This is a contract of intent, not implementation.**

---

## 1️⃣ GLOBAL CONTEXT (Applies Everywhere)

### Conceptual Entities (Foundational)

| Entity | Description | Example |
|--------|-------------|---------|
| **Organization** | A tenant (e.g., pharma company, safety group) | "Global Safety Org" |
| **Session** | Immutable analysis snapshot tied to ingestion | "Session S-2025-12-11-01" |
| **Signal** | Aggregated drug–event risk candidate | "Aspirin + GI Bleeding" |
| **Case** | Individual adverse event report | "CASE-2341" |
| **Source** | Origin of data (FAERS, literature, etc.) | "FAERS", "Literature" |

### Scope Context

Every UI element is **scoped by**:
* `org_id` (multi-tenant isolation)
* `session_id` (analytical context)

**Changing context rehydrates the entire page** — no partial updates.

---

## 2️⃣ CONTEXT BAR (Top of Signals Page)

### UI Elements

* Organization selector badge
* Dataset selector badge (FAERS + EudraVigilance)
* Scope indicator badge (Organization / Product)
* Filter: "Serious only" checkbox
* "Clear filters" button

### Data Contract

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `org_id` | UUID | Active organization identifier | `"550e8400-e29b-41d4-a716-446655440000"` |
| `dataset_ids` | UUID[] | Active datasets in scope | `["faers-uuid", "eudravigilance-uuid"]` |
| `scope_type` | enum | Analysis boundary | `"organization"` or `"product"` |
| `filter_serious_only` | boolean | Filter to serious cases only | `true` or `false` |

### Behavior

* Changing `org_id` → Entire page rehydrates with new org's data
* Changing `dataset_ids` → KPI and signals recalculate
* Changing `scope_type` → Signal ranking may change
* Filters are applied server-side (not client-side filtering)

---

## 3️⃣ SESSIONS PANEL (Left Rail)

### Purpose

Reproducible analytical snapshots. Each session represents a frozen point in time.

### UI Elements

* Session list (Recent sessions)
* Session metadata (timestamp, file count, case count)
* Current view summary (aggregated stats)
* "Sessions" vs "Saved" tab toggle

### Data Contract

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `session_id` | UUID | Immutable session identifier | `"S-2025-12-11-01"` |
| `org_id` | UUID | Organization owning this session | |
| `created_at` | timestamp | Ingestion/creation time (UTC) | `"2025-12-11 09:05:00 UTC"` |
| `label` | string | Human-readable session name | `"Session 1"` |
| `file_count` | number | Number of files ingested | `3` |
| `case_count` | number | Total cases in this session | `120` |
| `source_manifest` | object | Summary of data sources | `{ faers: {...}, eudravigilance: {...} }` |
| `ingestion_status` | enum | Status of ingestion | `"completed"`, `"processing"`, `"failed"` |

### Constraints

* Sessions are **read-only** (immutable)
* No edits, no merges
* Selecting a session → Rehydrates all page data for that session
* Sessions are scoped by `org_id`

### Backend (Future)

```typescript
interface Session {
  session_id: UUID;
  org_id: UUID;
  created_at: timestamp;
  label: string;
  file_count: number;
  case_count: number;
  source_manifest: {
    sources: Array<{
      source_type: "FAERS" | "EudraVigilance" | "Literature" | "Social";
      file_count: number;
      case_count: number;
      ingested_at: timestamp;
    }>;
  };
  ingestion_status: "completed" | "processing" | "failed";
}
```

---

## 4️⃣ SAFETY SNAPSHOT KPIs

### Purpose

Portfolio-level situational awareness metrics for executives and safety leadership.

### UI Cards

1. **Total Cases** — Volume context
2. **Critical Signals** — How many signals require attention
3. **Serious Events** — Regulatory relevance
4. **Products Monitored** — Scope of responsibility

### Data Contract

| KPI | Required Data | SQL-like Logic | Scope |
|-----|---------------|----------------|-------|
| **Total Cases** | `count(case_id)` | `SELECT COUNT(DISTINCT case_id) FROM cases WHERE org_id = ? AND session_id = ?` | Current session |
| **Critical Signals** | `count(signal_id WHERE priority = 'critical')` | `SELECT COUNT(*) FROM signals WHERE org_id = ? AND session_id = ? AND priority = 'critical'` | Current session |
| **Serious Events** | `count(case_id WHERE serious = true)` | `SELECT COUNT(*) FROM cases WHERE org_id = ? AND session_id = ? AND serious = true` | Current session |
| **Products Monitored** | `count(DISTINCT drug_id)` | `SELECT COUNT(DISTINCT drug_id) FROM signals WHERE org_id = ? AND session_id = ?` | Current session |

### Additional Fields

| Field | Type | Description |
|-------|------|-------------|
| `delta` | string | Change indicator | `"+12.3% vs last month"` |
| `trend_direction` | enum | up/down/stable | |
| `comparison_period` | string | What period is compared | `"last month"`, `"since yesterday"` |

### Data Source

* Aggregated case tables (session-scoped)
* Signal scoring outputs (session-scoped)
* Product metadata (org-scoped)

### Behavior

* Updates when session changes
* Updates when filters change
* Real-time calculation (not cached for long periods)

---

## 5️⃣ AI PRIORITY SIGNALS (Core Value Proposition)

### Purpose

Ranked pre-signal safety issues identified via composite intelligence scoring. These are **pre-signal indicators** — may not meet regulatory thresholds yet.

### UI Elements

* Drug name + Event term
* AI confidence score (%)
* Rank number
* Velocity indicator (% WoW)
* PRR value
* Case count
* Trend direction (Increasing/Decreasing/Stable)
* Action buttons (Escalate / Monitor / Defer)
* Recommendation chip

### Data Contract

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `signal_id` | UUID | Unique signal identifier | |
| `org_id` | UUID | Organization scope | |
| `session_id` | UUID | Session scope | |
| `drug_name` | string | Drug/product name | `"Aspirin"` |
| `drug_id` | UUID | Normalized drug identifier | |
| `event_term` | string | MedDRA PT (Preferred Term) | `"Gastrointestinal bleeding"` |
| `meddra_pt_id` | UUID | MedDRA code | |
| `ai_confidence` | float | ML prediction probability | `0.95` (0-1 scale) |
| `rank` | number | Priority ranking (1 = highest) | `1` |
| `velocity_pct` | float | Week-over-week change % | `+18.0` |
| `velocity_direction` | enum | Direction of change | `"Increasing"`, `"Decreasing"`, `"Stable"` |
| `prr` | float | Proportional Reporting Ratio | `15.3` |
| `prr_confidence_interval` | object | 95% CI | `{ lower: 12.1, upper: 19.4 }` |
| `case_count` | number | Total cases for this drug-event pair | `234` |
| `priority_level` | enum | Critical / High / Medium | `"critical"` |
| `recommendation` | enum | Escalate / Monitor / Defer | `"Escalate"` |
| `trend` | enum | Increasing / Decreasing / Stable | `"Increasing"` |
| `confidence_level` | string | High / Med / Low | `"High"` |
| `severity_indicator` | enum | Critical / High / Medium | `"critical"` |

### Ranking Factors (Composite Score)

| Factor | Weight | Description |
|--------|--------|-------------|
| Disproportionality | High | PRR, EBGM metrics |
| Temporal Velocity | High | Rate of increase |
| Novelty | Medium | Deviation from baseline |
| Cross-source Corroboration | Medium | Multiple sources agree |
| Case Severity | Medium | Serious case ratio |

### Action Buttons

**Important Constraint:**
* Action buttons are **advisory only**
* No auto-execution, ever
* Human decision remains authoritative
* Selection is logged to audit trail

### Backend (Future)

```typescript
interface PrioritySignal {
  signal_id: UUID;
  org_id: UUID;
  session_id: UUID;
  drug_name: string;
  drug_id: UUID;
  event_term: string;
  meddra_pt_id: UUID;
  ai_confidence: number; // 0-1
  rank: number;
  velocity_pct: number;
  velocity_direction: "Increasing" | "Decreasing" | "Stable";
  prr: number;
  prr_confidence_interval: { lower: number; upper: number };
  case_count: number;
  priority_level: "Critical" | "High" | "Medium";
  recommendation: "Escalate" | "Monitor" | "Defer";
  trend: "Increasing" | "Decreasing" | "Stable";
  confidence_level: "High" | "Med" | "Low";
  computed_at: timestamp;
}
```

---

## 6️⃣ SIGNALS TABLE (Triage Layer)

### Purpose

Operational triage view for safety analysts. Provides breadth-first visibility and filtering.

### UI Elements

* Sortable columns (Drug, Reaction, PRR, Cases, Serious, Priority)
* Filter buttons (Critical / High / Medium)
* Search input
* "View details" button per row
* Left accent bar (priority visual encoding)
* Row tints (severity encoding)

### Data Contract

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `signal_id` | UUID | Unique signal identifier | |
| `drug_name` | string | Drug/product name | `"Aspirin"` |
| `event_term` | string | MedDRA PT | `"Gastrointestinal bleeding"` |
| `prr` | float | Proportional Reporting Ratio | `15.3` |
| `case_count` | number | Total cases | `234` |
| `serious_flag` | boolean | Has serious cases | `true` |
| `serious_count` | number | Count of serious cases | `187` |
| `priority_level` | enum | Critical / High / Medium | `"Critical"` |

### Filters

| Filter | Type | Description |
|--------|------|-------------|
| `priority_filter` | enum[] | Filter by priority levels | `["Critical", "High"]` |
| `serious_only` | boolean | Filter to serious cases | `true` or `false` |
| `search_query` | string | Text search (drug/event) | `"aspirin"` |

### Behavior

* Clicking row → Opens Deep Analysis Modal (Trajectory tab)
* Table is **read-only**
* Sorting/filtering happens server-side
* Pagination: 50 rows per page (configurable)

### Backend (Future)

```typescript
interface SignalTableRow {
  signal_id: UUID;
  drug_name: string;
  event_term: string;
  prr: number;
  case_count: number;
  serious_flag: boolean;
  serious_count: number;
  priority_level: "Critical" | "High" | "Medium";
  org_id: UUID;
  session_id: UUID;
}
```

---

## 7️⃣ DEEP ANALYSIS MODAL — TAB CONTRACTS

The Deep Analysis Modal provides inspection-ready evidence for a single signal across four analytical lenses.

---

### 7.1️⃣ Trajectory Tab (Predictive Intelligence Core)

### Purpose

Forward-looking risk evolution visualization. Answers: "Is this getting worse? How fast? What if we intervene?"

### UI Elements

* Forecast horizon selector (30d / 90d / 6m / 12m)
* Scenario toggle (No action / Early intervention)
* Historical case counts (bar chart)
* Forecast projections (dashed bars)
* Confidence bands (95% CI shaded area)
* Forecast boundary marker (vertical line)
* Velocity indicator (large %)
* Projection insight callout (human impact)
* Metadata badges (Confidence, Recommendation)

### Data Contract

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `signal_id` | UUID | Signal being analyzed | |
| `time_series` | array | Historical + forecast data points | |
| `time_series[].date` | date | Month/date identifier | `"2025-01"` |
| `time_series[].observed_cases` | number | Historical case count (if historical) | `120` |
| `time_series[].forecast_cases` | number | Forecasted case count | `265` |
| `time_series[].lower_bound` | number | 95% CI lower bound | `235` |
| `time_series[].upper_bound` | number | 95% CI upper bound | `295` |
| `time_series[].is_historical` | boolean | Observed vs forecast | `true` or `false` |
| `velocity_pct` | float | Week-over-week velocity | `+18.0` |
| `velocity_direction` | enum | Increasing / Decreasing / Stable | `"Increasing"` |
| `scenario_no_action` | object | Forecast data for "no action" scenario | |
| `scenario_intervention` | object | Forecast data for "intervention" scenario | |
| `current_cases` | number | Cases at latest historical point | `234` |
| `projected_cases_final` | number | Final projected cases (no action) | `420` |
| `projected_cases_intervention` | number | Final projected cases (intervention) | `295` |
| `hospitalizations_avoided` | number | Estimated hospitalizations prevented | `44` |
| `confidence_level` | string | Model confidence | `"High"` |

### Model Output Only

* These are **predictions**, not facts
* No raw case editing
* No manual overrides
* Uncertainty is explicitly shown (confidence bands)

### Backend (Future)

```typescript
interface TrajectoryData {
  signal_id: UUID;
  historical: Array<{
    date: string; // "YYYY-MM"
    cases: number;
    lower: number;
    upper: number;
  }>;
  forecast: {
    noAction: Array<{
      date: string;
      cases: number;
      lower: number;
      upper: number;
    }>;
    intervention: Array<{
      date: string;
      cases: number;
      lower: number;
      upper: number;
    }>;
  };
  velocity_pct: number;
  velocity_direction: "Increasing" | "Decreasing" | "Stable";
  projected_cases_final: number;
  projected_cases_intervention: number;
  hospitalizations_avoided: number;
  confidence_level: "High" | "Med" | "Low";
  model_version: string;
  computed_at: timestamp;
}
```

---

### 7.2️⃣ Evidence Tab (Explainability & Source Transparency)

### Purpose

Source transparency and provenance. Shows where the signal comes from across data sources.

### UI Elements

* Source breakdown cards (FAERS, Literature, Early Signals)
* Count per source
* Freshness indicators ("Last update: X days ago")
* "New this week" badges
* Deduplication notice
* Logic summary

### Data Contract

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `signal_id` | UUID | Signal being analyzed | |
| `evidence_sources` | array | Evidence per source | |
| `evidence_sources[].source_type` | enum | FAERS / Literature / Early Signals | `"FAERS"` |
| `evidence_sources[].item_count` | number | Count of items from this source | `234` |
| `evidence_sources[].last_updated` | timestamp | When source data was last updated | `"2025-12-08 10:00:00 UTC"` |
| `evidence_sources[].new_this_week` | number | New items added this week | `12` |
| `evidence_sources[].source_weight` | float | Reliability/weight for composite scoring | `0.8` |
| `deduplication_status` | string | Cross-source deduplication status | `"resolved"` |
| `logic_summary` | string | How composite score was derived | |

### Backend (Future)

```typescript
interface EvidenceData {
  signal_id: UUID;
  evidence_sources: Array<{
    source_type: "FAERS" | "Literature" | "Early Signals" | "Social";
    item_count: number;
    last_updated: timestamp;
    new_this_week?: number;
    source_weight?: number;
    source_details?: {
      faers_count?: number;
      literature_count?: number;
      early_signals_count?: number;
    };
  }>;
  deduplication_status: "resolved" | "pending";
  cross_source_deduplication_count: number;
  logic_summary: string;
  model_version: string;
  computed_at: timestamp;
}
```

---

### 7.3️⃣ Cases Tab (Individual Report Traceability)

### Purpose

Individual report inspection. Allows analysts to verify signal validity by reviewing underlying cases.

### UI Elements

* Case table (Case ID, Age, Sex, Serious, Outcome, Onset Date)
* Filters (Serious only, Date range)
* Pagination controls
* "View details" links (future: expandable rows)

### Data Contract

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `case_id` | string | Case identifier | `"CASE-2341"` |
| `signal_id` | UUID | Parent signal | |
| `age` | number | Patient age | `65` |
| `sex` | enum | M / F / U | `"F"` |
| `serious` | boolean | Serious case flag | `true` |
| `outcome` | string | Outcome description | `"Hospitalized"` |
| `onset_date` | date | Onset date | `"2025-06-14"` |
| `country` | string | Country code | `"US"` |
| `source` | enum | Source of this case | `"FAERS"` |
| `report_date` | date | When case was reported | |

### Constraints

* **Read-only** (no editing)
* No follow-up workflows
* No regulatory submission actions
* Cases are managed in source systems (Argus, Veeva, LS)

### Backend (Future)

```typescript
interface SafetyCase {
  case_id: string;
  signal_id: UUID;
  org_id: UUID;
  session_id: UUID;
  age: number;
  sex: "M" | "F" | "U";
  serious: boolean;
  outcome: string;
  onset_date: date;
  country: string;
  source: "FAERS" | "EudraVigilance" | "Literature" | "Social";
  report_date: date;
  source_case_id: string; // Original ID in source system
}
```

---

### 7.4️⃣ Audit Tab (Inspection & Governance)

### Purpose

CFR Part 11-compliant audit trail. Chronological log of analytical events related to this signal.

### UI Elements

* Timeline view (vertical)
* Event dots (color-coded by actor)
* Event descriptions
* Timestamps (UTC)
* Actor attribution (AI vs User + username)

### Data Contract

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `event_id` | UUID | Unique event identifier | |
| `signal_id` | UUID | Signal this event relates to | |
| `event_type` | enum | Type of event | `"query_executed"`, `"trajectory_generated"`, `"recommendation_issued"`, `"analysis_viewed"`, `"filters_applied"`, `"report_generated"` |
| `timestamp` | timestamp | Event time (UTC, CFR Part 11 compliant) | `"2025-12-11 09:15:02 UTC"` |
| `actor` | enum | AI / User | `"AI"` or `"User"` |
| `actor_name` | string | Username (if User) | `"AR"` |
| `details` | string | Event description/details | `"Signal detection pipeline run for aspirin_gi_bleeding"` |
| `metadata` | object | Additional event context | `{ model_version: "v2.3.1", horizon: "6m" }` |

### Event Types

| Event Type | Description | Actor |
|------------|-------------|-------|
| `query_executed` | Signal detection query run | AI |
| `trajectory_generated` | Forecast model executed | AI |
| `recommendation_issued` | AI recommendation created | AI |
| `analysis_viewed` | User opened deep analysis | User |
| `filters_applied` | User applied filters | User |
| `report_generated` | User exported report | User |

### Constraints

* All events are **immutable** (append-only)
* All timestamps in UTC
* Actor attribution required
* Complete traceability from signal detection to recommendation

### Backend (Future)

```typescript
interface AuditEvent {
  event_id: UUID;
  signal_id: UUID;
  org_id: UUID;
  session_id: UUID;
  event_type: "query_executed" | "trajectory_generated" | "recommendation_issued" | "analysis_viewed" | "filters_applied" | "report_generated";
  timestamp: timestamp; // UTC, CFR Part 11 compliant
  actor: "AI" | "User";
  actor_name?: string; // If User
  user_id?: UUID; // If User
  details: string;
  metadata?: {
    model_version?: string;
    horizon?: string;
    scenario?: string;
    filters?: object;
    [key: string]: any;
  };
}
```

---

## 8️⃣ AI ASSISTANT PANEL (Right Rail)

### Purpose

Conversational reasoning layer for guided safety analysis. Assists, not replaces, human judgment.

### UI Elements

* Chat messages (user + assistant)
* Message menu (⋮) with options:
  * View interpreted filters
  * Evidence & sources
  * Audit trail
  * Confirm & generate report
  * Adjust filters
* Tab: "AI Assistant" vs "Analyses"
* Chat input (auto-expanding textarea)
* Send button

### Data Contract

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `message_id` | UUID | Unique message identifier | |
| `session_id` | UUID | Session context | |
| `org_id` | UUID | Organization scope | |
| `role` | enum | user / assistant | `"user"` |
| `text` | string | Message content | `"Show me serious bleeding events for Drug A"` |
| `timestamp` | timestamp | Message time | |
| `referenced_signal_ids` | UUID[] | Signals referenced in conversation | |
| `interpreted_filters` | object | Filters extracted from query | `{ drug: "Drug A", serious: true, period: "12 months" }` |
| `has_menu` | boolean | Whether message has action menu | `true` |

### Guardrails

* Read-only recommendations
* Explainable outputs
* Session-scoped context
* No automated decisions
* Human confirmation required for actions

### Backend (Future)

```typescript
interface ChatMessage {
  message_id: UUID;
  session_id: UUID;
  org_id: UUID;
  role: "user" | "assistant";
  text: string;
  timestamp: timestamp;
  referenced_signal_ids?: UUID[];
  interpreted_filters?: {
    drug?: string;
    event?: string;
    serious?: boolean;
    period?: string;
    [key: string]: any;
  };
  has_menu?: boolean;
  metadata?: object;
}
```

---

## 9️⃣ UPLOAD MODAL (Data Ingestion Entry Point)

### Purpose

Create new immutable analysis sessions by uploading safety data files.

### UI Elements

* File selection (drag-and-drop or file picker)
* File list table (name, type, size, status, progress)
* Status badges (Queued, Uploading, Processing, Completed, Failed)
* Progress bars
* Action buttons ("Start upload", "Mark all complete" — mock)
* CFR Part 11 audit note

### Data Contract

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `upload_id` | UUID | Upload transaction identifier | |
| `org_id` | UUID | Organization performing upload | |
| `filename` | string | Original filename | `"faers_q3_2025.zip"` |
| `file_type` | enum | CSV / Parquet / ZIP | `"ZIP"` |
| `file_size` | number | Size in bytes | `125829120` (120 MB) |
| `mime_type` | string | MIME type | `"application/zip"` |
| `status` | enum | queued / uploading / processing / completed / failed | `"uploading"` |
| `progress` | number | Progress percentage (0-100) | `42` |
| `session_id` | UUID | Session created from this upload | (after completion) |
| `uploaded_at` | timestamp | Upload start time | |
| `completed_at` | timestamp | Processing completion time | |
| `error_message` | string | Error details (if failed) | |
| `inner_files` | array | Files within ZIP (after unpack) | |

### ZIP Archive Behavior

* ZIP = **atomic upload** (treated as single unit)
* Inner files logged post-unpack
* Progress shows overall ZIP progress until unpacking
* After unpack, inner files appear in table

### Constraints

* One upload → One session (1:1 relationship)
* Sessions are immutable (upload cannot be "replaced")
* CFR Part 11 timestamps attached per ingestion event
* All upload events logged to audit trail

### Backend (Future)

```typescript
interface UploadItem {
  upload_id: UUID;
  org_id: UUID;
  filename: string;
  file_type: "CSV" | "Parquet" | "ZIP" | "JSON";
  file_size: number;
  mime_type: string;
  status: "queued" | "uploading" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  session_id?: UUID; // Created after processing completes
  uploaded_at: timestamp;
  completed_at?: timestamp;
  error_message?: string;
  storage_path: string; // S3/Supabase path
  inner_files?: Array<{
    filename: string;
    file_type: string;
    size: number;
  }>;
  audit_log_id: UUID; // Link to audit trail
}
```

---

## 🔟 ADDITIONAL UI ELEMENTS

### Navigation Pills (Top Bar)

* Dashboard / Signals / Analyses / Settings
* Active page indicator
* Navigation state (client-side routing)

**Data:** None (UI state only)

---

### Theme Toggle (Top Bar)

* Light / Dark mode toggle
* Persists to localStorage
* Applies `dark` class to `<html>`

**Data:** Theme preference (UI state only)

---

## ✅ PHASE 3 — COMPLETE

### Summary

This contract defines:

✅ **What each UI element represents**  
✅ **What data it expects (shape)**  
✅ **Where data comes from conceptually**  
✅ **What is intentionally out of scope**  

### Next Steps

* **Phase 4** will define:
  * Database schemas (Supabase)
  * API endpoints and contracts
  * Ingestion pipeline specifications
  * Signal computation algorithms
  * Forecast model integration
  * Auth + multi-org enforcement

---

**Document Status:** Complete  
**Phase:** 3 of 4  
**Next:** Phase 4 — Implementation

