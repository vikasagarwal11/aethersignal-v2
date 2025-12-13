# Complete AetherSignal Database Schema Documentation

**Generated:** 2025-12-13  
**Source:** Migration files and schema references  
**Database:** PostgreSQL (Supabase)

> ⚠️ **Note:** This document is generated from migration files. For the most up-to-date schema, run `pg_dump --schema-only` against the live database.

**Purpose:** Complete technical reference document for sharing with AI assistants (Grok, ChatGPT) to understand the entire database structure, including all tables, columns, indexes, functions, triggers, views, and constraints.

---

## 📋 Document Contents

This document contains:

- ✅ **12 Tables** - Complete column definitions with types, defaults, constraints
- ✅ **4+ Functions** - All stored procedures and helper functions
- ✅ **8+ Triggers** - Database automation and business logic
- ✅ **6+ Views** - Pre-defined query views
- ✅ **50+ Indexes** - Performance optimization indexes
- ✅ **All Constraints** - Primary keys, foreign keys, CHECK constraints
- ✅ **Column Comments** - Field descriptions and documentation

---

## 🚀 How to Use This Document

### For AI Assistants (Grok/ChatGPT):

1. **Understand Existing Schema** - Review all tables to see what data structures exist
2. **Plan New Features** - Identify what tables/columns to use or create
3. **Integrate Wireframe** - Map UI requirements to existing database structures
4. **API Development** - Understand data models for endpoint development

### Quick Reference:

- See **ENHANCED_COMPLETE_DATABASE_SCHEMA.md** for API endpoints and integration guide
- See **DATABASE_SCHEMA_AND_API_REFERENCE.md** for wireframe mapping
- See **PHASE_3_UI_DATA_CONTRACT.md** for UI requirements

---

---

## 📊 Tables

### Table: `data_sources`

| Column Name | Definition | Description |
|------------|------------|-------------|
| `confidence_score` | `FLOAT DEFAULT 0.8` |  |
| `created_at` | `TIMESTAMP DEFAULT NOW()` |  |
| `id` | `UUID PRIMARY KEY DEFAULT uuid_generate_v4()` |  |
| `is_active` | `BOOLEAN DEFAULT true` |  |
| `metadata` | `JSONB` |  |
| `priority_rank` | `INTEGER DEFAULT 5` |  |
| `source_name` | `TEXT` |  |
| `source_type` | `TEXT NOT NULL` |  |

---

### Table: `file_upload_history`

| Column Name | Definition | Description |
|------------|------------|-------------|
| `ai_confidence_score` | `NUMERIC(3,2)` | AI extraction confidence (0.00-1.00) |
| `cases_created` | `INTEGER DEFAULT 0` | Number of cases created from this file |
| `created_at` | `TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |  |
| `earliest_date` | `DATE` |  |
| `file_hash_md5` | `TEXT` |  |
| `file_path` | `TEXT` | Local file storage path |
| `file_size_bytes` | `BIGINT NOT NULL` |  |
| `file_type` | `TEXT` |  |
| `filename` | `TEXT NOT NULL` |  |
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` |  |
| `latest_date` | `DATE` |  |
| `metadata` | `JSONB DEFAULT '{}'::jsonb` |  |
| `organization` | `TEXT NOT NULL` |  |
| `processing_completed_at` | `TIMESTAMP WITH TIME ZONE` |  |
| `processing_error` | `TEXT` |  |
| `processing_started_at` | `TIMESTAMP WITH TIME ZONE` |  |
| `progress` | `INTEGER DEFAULT 0` | Processing progress percentage (0-100) |
| `source` | `TEXT DEFAULT 'FAERS'` |  |
| `stats_calculated_at` | `TIMESTAMP WITH TIME ZONE` |  |
| `stats_status` | `TEXT DEFAULT 'pending'` |  |
| `status_message` | `TEXT` | Human-readable status message for UI |
| `total_cases` | `INTEGER DEFAULT 0` |  |
| `total_drugs` | `INTEGER DEFAULT 0` |  |
| `total_events` | `INTEGER DEFAULT 0` |  |
| `total_fatal_cases` | `INTEGER DEFAULT 0` |  |
| `total_serious_cases` | `INTEGER DEFAULT 0` |  |
| `total_valid_cases` | `INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_invalid_cases INTEGER DEFAULT ...` |  |
| `updated_at` | `TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |  |
| `upload_status` | `TEXT DEFAULT 'processing'` |  |
| `uploaded_at` | `TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |  |
| `user_id` | `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` |  |

---

### Table: `file_uploads`

**Description:** Tracks all file uploads with duplicate detection

| Column Name | Definition | Description |
|------------|------------|-------------|
| `cases_created` | `INTEGER DEFAULT 0` |  |
| `cases_invalid` | `INTEGER DEFAULT 0` |  |
| `cases_valid` | `INTEGER DEFAULT 0` |  |
| `created_at` | `TIMESTAMP DEFAULT NOW()` |  |
| `duplicate_action` | `TEXT` | Action taken for duplicate: skip, replace, or keep |
| `duplicate_of_id` | `UUID REFERENCES file_uploads(id)` |  |
| `error_message` | `TEXT` |  |
| `file_hash` | `TEXT NOT NULL` | SHA-256 hash for duplicate detection |
| `file_metadata` | `JSONB` |  |
| `file_path` | `TEXT NOT NULL` |  |
| `file_size` | `BIGINT NOT NULL` |  |
| `filename` | `TEXT NOT NULL` |  |
| `id` | `UUID PRIMARY KEY DEFAULT uuid_generate_v4()` |  |
| `is_duplicate` | `BOOLEAN DEFAULT false` | Automatically set to true if hash matches existing file |
| `organization` | `TEXT` |  |
| `original_format` | `TEXT` |  |
| `processing_completed_at` | `TIMESTAMP` |  |
| `processing_started_at` | `TIMESTAMP` |  |
| `session_id` | `UUID` | Optional session ID - stores as text until sessions table created |
| `status` | `TEXT NOT NULL DEFAULT 'uploaded'` |  |
| `updated_at` | `TIMESTAMP DEFAULT NOW()` |  |
| `uploaded_at` | `TIMESTAMP NOT NULL DEFAULT NOW()` |  |
| `user_id` | `TEXT` |  |

---

### Table: `performance_metrics`

| Column Name | Definition | Description |
|------------|------------|-------------|
| `id` | `SERIAL PRIMARY KEY` |  |
| `metric_name` | `TEXT NOT NULL` |  |
| `metric_unit` | `TEXT` |  |
| `metric_value` | `FLOAT NOT NULL` |  |
| `recorded_at` | `TIMESTAMP DEFAULT NOW()` |  |

---

### Table: `pv_cases`

| Column Name | Definition | Description |
|------------|------------|-------------|
| `age` | `NUMERIC` |  |
| `age_yrs` | `NUMERIC` |  |
| `ai_confidence` | `NUMERIC(3,2)` |  |
| `ai_extracted` | `BOOLEAN DEFAULT FALSE` |  |
| `case_id` | `TEXT` |  |
| `completeness_status` | `TEXT DEFAULT 'complete',
ADD COLUMN IF NOT EXISTS missing_fields JSONB DEFAULT '...` |  |
| `country` | `TEXT` |  |
| `created_at` | `TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |  |
| `drug_count` | `INTEGER` |  |
| `drug_name` | `TEXT` |  |
| `drug_start_date` | `DATE,
ADD COLUMN IF NOT EXISTS drug_end_date DATE,
ADD COLUMN IF NOT EXISTS rece...` |  |
| `event_date` | `DATE` |  |
| `gender` | `TEXT` |  |
| `ic` | `FLOAT` | Information Component - Bayesian signal detection metric (WHO VigiBase) |
| `ic025` | `FLOAT` |  |
| `ic_is_signal` | `BOOLEAN DEFAULT false` |  |
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` |  |
| `is_statistical_signal` | `BOOLEAN DEFAULT false` |  |
| `narrative` | `TEXT` |  |
| `onset_date` | `DATE` |  |
| `organization` | `TEXT NOT NULL` |  |
| `outcome` | `TEXT` |  |
| `patient_initials` | `TEXT` |  |
| `prr` | `FLOAT` | Proportional Reporting Ratio - FDA/WHO standard signal detection metric |
| `prr_ci_lower` | `FLOAT` |  |
| `prr_ci_upper` | `FLOAT` |  |
| `prr_is_signal` | `BOOLEAN DEFAULT false` |  |
| `raw_data` | `JSONB` |  |
| `reaction` | `TEXT` |  |
| `reaction_count` | `INTEGER` |  |
| `receive_date` | `DATE` |  |
| `report_date` | `DATE` |  |
| `reporter_type` | `TEXT,
ADD COLUMN IF NOT EXISTS reporter_country TEXT,
ADD COLUMN IF NOT EXISTS r...` |  |
| `ror` | `FLOAT` | Reporting Odds Ratio - Alternative signal detection metric |
| `ror_ci_lower` | `FLOAT` |  |
| `ror_ci_upper` | `FLOAT` |  |
| `ror_is_signal` | `BOOLEAN DEFAULT false` |  |
| `serious` | `BOOLEAN` |  |
| `seriousness` | `TEXT` |  |
| `sex` | `TEXT` |  |
| `signal_detected_at` | `TIMESTAMP` |  |
| `signal_methods` | `TEXT[]` |  |
| `signal_priority` | `TEXT` |  |
| `signal_strength` | `TEXT` | Overall signal strength: strong (all methods), moderate (2 methods), weak (1 method), none |
| `source` | `TEXT DEFAULT 'FAERS'` |  |
| `source_file_id` | `UUID REFERENCES file_upload_history(id) ON DELETE SET NULL` |  |
| `source_id` | `UUID REFERENCES data_sources(id)` |  |
| `statistics_calculated_at` | `TIMESTAMP` |  |
| `statistics_version` | `TEXT DEFAULT '1.0'` |  |
| `updated_at` | `TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |  |
| `upload_id` | `UUID REFERENCES file_uploads(id)` |  |
| `user_id` | `UUID REFERENCES auth.users(id) ON DELETE CASCADE` |  |

---

### Table: `pv_cases_partitioned`

**Description:** Partitioned version of pv_cases for improved query performance on date ranges

| Column Name | Definition | Description |
|------------|------------|-------------|
| `LIKE` | `pv_cases INCLUDING DEFAULTS INCLUDING STORAGE INCLUDING COMMENTS` |  |

---

### Table: `query_cache`

**Description:** Query result cache - reduces database load for repeated queries

| Column Name | Definition | Description |
|------------|------------|-------------|
| `cache_key` | `TEXT PRIMARY KEY` |  |
| `created_at` | `TIMESTAMP DEFAULT NOW()` |  |
| `expires_at` | `TIMESTAMP NOT NULL` |  |
| `hit_count` | `INTEGER DEFAULT 0` |  |
| `last_accessed` | `TIMESTAMP DEFAULT NOW()` |  |
| `query_hash` | `TEXT NOT NULL` |  |
| `query_text` | `TEXT` |  |
| `result_data` | `JSONB NOT NULL` |  |

---

### Table: `query_patterns`

**Description:** Learned query patterns for automatic optimization

| Column Name | Definition | Description |
|------------|------------|-------------|
| `avg_duration_ms` | `FLOAT` |  |
| `created_at` | `TIMESTAMP DEFAULT NOW()` |  |
| `execution_count` | `INTEGER DEFAULT 1` |  |
| `id` | `SERIAL PRIMARY KEY` |  |
| `last_executed` | `TIMESTAMP DEFAULT NOW()` |  |
| `optimization_applied` | `JSONB` |  |
| `query_pattern` | `TEXT NOT NULL` |  |

---

### Table: `saved_analyses`

| Column Name | Definition | Description |
|------------|------------|-------------|
| `analysis_id` | `TEXT NOT NULL` |  |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` |  |
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` |  |
| `name` | `TEXT NOT NULL` |  |
| `owner_user_id` | `TEXT NULL` |  |
| `session_id` | `TEXT NULL` |  |

---

### Table: `signal_detection_config`

| Column Name | Definition | Description |
|------------|------------|-------------|
| `config` | `JSONB NOT NULL DEFAULT '{}'::jsonb` |  |
| `created_at` | `TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |  |
| `created_by` | `UUID REFERENCES auth.users(id)` |  |
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` |  |
| `level` | `TEXT NOT NULL CHECK (level IN ('platform'` |  |
| `notes` | `TEXT` |  |
| `organization` | `TEXT` |  |
| `updated_at` | `TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |  |
| `user_id` | `UUID REFERENCES auth.users(id) ON DELETE CASCADE` |  |

---

### Table: `upload_sessions`

**Description:** Explicit upload sessions - can be auto-created (by date) or user-created (named)

| Column Name | Definition | Description |
|------------|------------|-------------|
| `cases_created` | `INTEGER DEFAULT 0` |  |
| `created_at` | `TIMESTAMP DEFAULT NOW()` |  |
| `created_by` | `TEXT` |  |
| `description` | `TEXT` |  |
| `ended_at` | `TIMESTAMP` |  |
| `files_count` | `INTEGER DEFAULT 0` |  |
| `id` | `UUID PRIMARY KEY DEFAULT uuid_generate_v4()` |  |
| `invalid_cases` | `INTEGER DEFAULT 0` |  |
| `is_auto` | `BOOLEAN DEFAULT false` |  |
| `name` | `TEXT NOT NULL` |  |
| `organization` | `TEXT` | Organization that owns this session. Sessions are scoped per organization for multi-tenant support. |
| `started_at` | `TIMESTAMP NOT NULL DEFAULT NOW()` |  |
| `status` | `TEXT NOT NULL DEFAULT 'active'` |  |
| `updated_at` | `TIMESTAMP DEFAULT NOW()` |  |
| `valid_cases` | `INTEGER DEFAULT 0` |  |

---

### Table: `uploaded_files`

**Description:** Tracks file uploads and AI processing status

| Column Name | Definition | Description |
|------------|------------|-------------|
| `ai_confidence_score` | `NUMERIC` | Overall AI confidence in extraction (0-1) |
| `cases_created` | `INTEGER DEFAULT 0` | Number of pharmacovigilance cases extracted from file |
| `created_at` | `TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |  |
| `file_hash_md5` | `TEXT` |  |
| `file_path` | `TEXT` |  |
| `file_size_bytes` | `BIGINT NOT NULL` |  |
| `file_type` | `TEXT` |  |
| `filename` | `TEXT NOT NULL` |  |
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` |  |
| `metadata` | `JSONB DEFAULT '{}'::jsonb` |  |
| `organization` | `TEXT NOT NULL` |  |
| `processing_completed_at` | `TIMESTAMP WITH TIME ZONE` |  |
| `processing_error` | `TEXT` |  |
| `processing_started_at` | `TIMESTAMP WITH TIME ZONE` |  |
| `source` | `TEXT DEFAULT 'upload'` |  |
| `updated_at` | `TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |  |
| `upload_status` | `TEXT DEFAULT 'queued'` | Status: queued, processing, completed, failed |
| `uploaded_at` | `TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |  |
| `user_id` | `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` |  |

---

## ⚙️ Functions

### Function: `get_cached_query(p_cache_key TEXT)`

**Returns:** `JSONB AS`

**Definition:**
```sql
CREATE OR REPLACE FUNCTION get_cached_query(p_cache_key TEXT)
RETURNS JSONB AS
AS $$

$$ LANGUAGE plpgsql;
```

---

### Function: `get_or_create_session_for_upload(org_name TEXT DEFAULT NULL)`

**Returns:** `UUID AS`

**Definition:**
```sql
CREATE OR REPLACE FUNCTION get_or_create_session_for_upload(org_name TEXT DEFAULT NULL)
RETURNS UUID AS
AS $$

$$ LANGUAGE plpgsql;
```

---

### Function: `learn_query_pattern(
    p_pattern TEXT,
    p_duration_ms FLOAT
)`

**Returns:** `void AS`

**Definition:**
```sql
CREATE OR REPLACE FUNCTION learn_query_pattern(
    p_pattern TEXT,
    p_duration_ms FLOAT
)
RETURNS void AS
AS $$

$$ LANGUAGE plpgsql;
```

---

### Function: `record_performance_metric(
    p_name TEXT,
    p_value FLOAT,
    p_unit TEXT DEFAULT 'ms'
)`

**Returns:** `void AS`

**Definition:**
```sql
CREATE OR REPLACE FUNCTION record_performance_metric(
    p_name TEXT,
    p_value FLOAT,
    p_unit TEXT DEFAULT 'ms'
)
RETURNS void AS
AS $$

$$ LANGUAGE plpgsql;
```

---

## 🔄 Triggers

### Table: `file_upload_history`

**Trigger:** `sync_file_upload_cases_trigger`

- **Function:** `sync_file_upload_cases()`

---

### Table: `file_uploads`

**Trigger:** `update_file_uploads_updated_at`

- **Function:** `update_updated_at_column()`

**Trigger:** `mark_duplicates_on_insert`

- **Function:** `mark_duplicate_uploads()`

**Trigger:** `assign_session_on_upload_insert`

- **Function:** `assign_session_to_upload()`

**Trigger:** `update_session_stats_trigger`

- **Function:** `update_session_stats()`

---

### Table: `pv_cases`

**Trigger:** `DROP`

- **Function:** `update_file_upload_validation_stats()`

---

### Table: `signal_detection_config`

**Trigger:** `signal_config_updated_at`

- **Function:** `update_signal_config_updated_at()`

---

### Table: `uploaded_files`

**Trigger:** `update_uploaded_files_updated_at`

- **Function:** `update_uploaded_files_updated_at()`

---

## 👁️ Views

### View: `duplicate_files_view`

**Definition:**
```sql
CREATE OR REPLACE VIEW duplicate_files_view AS
SELECT 
    file_hash,
    COUNT(*) as duplicate_count,
    MIN(uploaded_at) as first_uploaded,
    MAX(uploaded_at) as last_uploaded,
    SUM(cases_created) as total_cases,
    ARRAY_AGG(id ORDER BY uploaded_at) as upload_ids,
    ARRAY_AGG(filename ORDER BY uploaded_at) as filenames
FROM file_uploads
GROUP BY file_hash
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, first_uploaded DESC
```

---

### View: `file_processing_status`

**Definition:**
```sql
CREATE OR REPLACE VIEW file_processing_status AS
SELECT 
    id,
    user_id,
    organization,
    filename,
    file_type,
    file_size_bytes,
    uploaded_at,
    upload_status as status,
    progress,
    status_message as message,
    cases_created,
    ai_confidence_score,
    processing_started_at,
    processing_completed_at,
    processing_error as error,
    metadata
FROM file_upload_history
ORDER BY uploaded_at DESC
```

---

### View: `incomplete_cases_review`

**Definition:**
```sql
CREATE OR REPLACE VIEW incomplete_cases_review AS
SELECT 
    pc.id,
    pc.drug_name,
    pc.reaction,
    pc.completeness_status,
    pc.missing_fields,
    pc.validation_errors,
    pc.source_file_id,
    fuh.filename,
    fuh.uploaded_at,
    pc.created_at,
    pc.requires_manual_review
FROM pv_cases pc
LEFT JOIN file_upload_history fuh ON pc.source_file_id = fuh.id
WHERE pc.completeness_status != 'complete'
   OR pc.requires_manual_review = TRUE
ORDER BY pc.created_at DESC
```

---

### View: `session_summary_view`

**Definition:**
```sql
CREATE OR REPLACE VIEW session_summary_view AS
SELECT 
    s.id,
    s.name,
    s.description,
    s.started_at,
    s.ended_at,
    s.status,
    s.is_auto,
    s.files_count,
    s.cases_created,
    s.valid_cases,
    s.invalid_cases,
    COUNT(DISTINCT fu.id) as actual_files_count,
    COALESCE(SUM(fu.cases_created), 0) as actual_cases_created
FROM upload_sessions s
LEFT JOIN file_uploads fu ON s.id = fu.session_id
GROUP BY s.id, s.name, s.description, s.started_at, s.ended_at, s.status, s.is_auto, s.files_count, s.cases_created, s.valid_cases, s.invalid_cases
```

---

### View: `upload_statistics`

**Definition:**
```sql
CREATE OR REPLACE VIEW upload_statistics AS
SELECT 
    DATE(uploaded_at) as upload_date,
    COUNT(*) as total_uploads,
    COUNT(*) FILTER (WHERE is_duplicate = true) as duplicate_uploads,
    SUM(cases_created) as total_cases_created,
    SUM(file_size) as total_size_bytes,
    COUNT(DISTINCT session_id) as unique_sessions
FROM file_uploads
GROUP BY DATE(uploaded_at)
ORDER BY upload_date DESC
```

---

### View: `v_performance_overview`

**Definition:**
```sql
CREATE OR REPLACE VIEW v_performance_overview AS
SELECT 
    'Total Cases' as metric,
    COUNT(*)::text as value
FROM pv_cases
UNION ALL
SELECT 
    'Materialized Views' as metric,
    COUNT(*)::text as value
FROM pg_matviews
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Custom Indexes' as metric,
    COUNT(*)::text as value
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
UNION ALL
SELECT 
    'Cache Entries' as metric,
    COUNT(*)::text as value
FROM query_cache
WHERE expires_at > NOW()
```

---
