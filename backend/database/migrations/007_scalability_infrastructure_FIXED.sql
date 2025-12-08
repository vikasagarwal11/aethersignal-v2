-- Database Migration: Scalability & Performance Optimization (FIXED)
-- Version: 007_scalability_infrastructure_fixed
-- Date: 2024-12-08
-- Purpose: Enable 10M+ record performance with partitioning, indexes, and caching
-- FIXES: Changed patient_age to age_yrs (matches current schema)

-- ============================================================================
-- 1. TABLE PARTITIONING BY DATE (for time-based queries)
-- ============================================================================

-- Create partitioned table for pv_cases
-- This allows querying only relevant time periods (HUGE performance boost)

-- First, create new partitioned table
-- NOTE: Cannot use INCLUDING ALL because PRIMARY KEY must include partition key (event_date)
-- Solution: Use LIKE without INCLUDING ALL (copies structure but not constraints)
-- Then manually add composite PK that includes partition key
CREATE TABLE IF NOT EXISTS pv_cases_partitioned (
    LIKE pv_cases INCLUDING DEFAULTS INCLUDING STORAGE INCLUDING COMMENTS
) PARTITION BY RANGE (event_date);

-- Create composite primary key that includes partition key (required by PostgreSQL)
-- This ensures uniqueness across all partitions
-- Only add if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pv_cases_partitioned_pkey' 
        AND conrelid = 'pv_cases_partitioned'::regclass
    ) THEN
        ALTER TABLE pv_cases_partitioned 
        ADD PRIMARY KEY (id, event_date);
    END IF;
END $$;

-- Create partitions for each year (example: 2020-2025)
CREATE TABLE IF NOT EXISTS pv_cases_2020 PARTITION OF pv_cases_partitioned
    FOR VALUES FROM ('2020-01-01') TO ('2021-01-01');

CREATE TABLE IF NOT EXISTS pv_cases_2021 PARTITION OF pv_cases_partitioned
    FOR VALUES FROM ('2021-01-01') TO ('2022-01-01');

CREATE TABLE IF NOT EXISTS pv_cases_2022 PARTITION OF pv_cases_partitioned
    FOR VALUES FROM ('2022-01-01') TO ('2023-01-01');

CREATE TABLE IF NOT EXISTS pv_cases_2023 PARTITION OF pv_cases_partitioned
    FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

CREATE TABLE IF NOT EXISTS pv_cases_2024 PARTITION OF pv_cases_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS pv_cases_2025 PARTITION OF pv_cases_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Default partition for future dates
CREATE TABLE IF NOT EXISTS pv_cases_future PARTITION OF pv_cases_partitioned
    DEFAULT;

-- Note: To migrate existing data, run: INSERT INTO pv_cases_partitioned SELECT * FROM pv_cases;

-- ============================================================================
-- 2. INTELLIGENT MULTI-COLUMN INDEXES
-- ============================================================================

-- Composite index for common query patterns
-- "serious bleeding events for anticoagulants"
CREATE INDEX IF NOT EXISTS idx_serious_drug_event 
    ON pv_cases(serious, drug_name, reaction) 
    WHERE serious = true;

-- Index for geographic queries
-- "events in Asia"
CREATE INDEX IF NOT EXISTS idx_country_event_date 
    ON pv_cases(reporter_country, event_date DESC);

-- Index for age-based queries
-- "elderly patients" - FIXED: Changed patient_age to age_yrs
CREATE INDEX IF NOT EXISTS idx_age_serious 
    ON pv_cases(age_yrs, serious) 
    WHERE age_yrs > 65;

-- Enable trigram extension for pattern matching (MUST BE BEFORE GIN indexes)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for drug class queries (uses pattern matching)
CREATE INDEX IF NOT EXISTS idx_drug_name_pattern 
    ON pv_cases USING gin(drug_name gin_trgm_ops);

-- Index for reaction pattern matching
CREATE INDEX IF NOT EXISTS idx_reaction_pattern 
    ON pv_cases USING gin(reaction gin_trgm_ops);

-- Full-text search index for narratives
CREATE INDEX IF NOT EXISTS idx_narrative_fts 
    ON pv_cases USING gin(to_tsvector('english', narrative));

-- Index for outcome queries
CREATE INDEX IF NOT EXISTS idx_outcome_date 
    ON pv_cases(outcome, event_date DESC) 
    WHERE outcome IS NOT NULL;

-- ============================================================================
-- 3. MATERIALIZED VIEWS FOR COMMON AGGREGATIONS
-- ============================================================================

-- Pre-computed drug-event signal counts
-- Refreshed periodically (fast queries!)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_drug_event_signals AS
SELECT 
    drug_name,
    reaction,
    COUNT(*) as case_count,
    COUNT(*) FILTER (WHERE serious = true) as serious_count,
    AVG(prr) as avg_prr,
    AVG(ror) as avg_ror,
    AVG(ic) as avg_ic,
    BOOL_OR(is_statistical_signal) as has_signal,  -- FIXED: Use BOOL_OR instead of MAX for boolean
    MAX(signal_strength) as max_signal_strength
FROM pv_cases
WHERE drug_name IS NOT NULL 
  AND reaction IS NOT NULL
GROUP BY drug_name, reaction
HAVING COUNT(*) >= 3;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_signals_drug_event 
    ON mv_drug_event_signals(drug_name, reaction);

CREATE INDEX IF NOT EXISTS idx_mv_signals_count 
    ON mv_drug_event_signals(case_count DESC);

-- Daily statistics (for dashboards) - FIXED: Changed patient_age to age_yrs
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_statistics AS
SELECT 
    DATE(event_date) as date,
    COUNT(*) as total_cases,
    COUNT(*) FILTER (WHERE serious = true) as serious_cases,
    COUNT(DISTINCT drug_name) as unique_drugs,
    COUNT(DISTINCT reaction) as unique_reactions,
    COUNT(DISTINCT reporter_country) as countries_reporting,
    AVG(age_yrs) as avg_patient_age
FROM pv_cases
WHERE event_date IS NOT NULL
GROUP BY DATE(event_date);

CREATE INDEX IF NOT EXISTS idx_mv_daily_date 
    ON mv_daily_statistics(date DESC);

-- Geographic distribution
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_geographic_distribution AS
SELECT 
    reporter_country,
    COUNT(*) as case_count,
    COUNT(*) FILTER (WHERE serious = true) as serious_count,
    COUNT(DISTINCT drug_name) as unique_drugs,
    COUNT(DISTINCT reaction) as unique_reactions
FROM pv_cases
WHERE reporter_country IS NOT NULL
GROUP BY reporter_country;

CREATE INDEX IF NOT EXISTS idx_mv_geo_country 
    ON mv_geographic_distribution(reporter_country);

-- ============================================================================
-- 4. QUERY PERFORMANCE FUNCTIONS
-- ============================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_performance_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_drug_event_signals;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_geographic_distribution;
    
    -- Update statistics for query planner
    ANALYZE pv_cases;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (would be called by cron or scheduler)
COMMENT ON FUNCTION refresh_performance_views IS 'Refresh materialized views - run hourly or after bulk inserts';

-- Function to get query performance recommendations
CREATE OR REPLACE FUNCTION get_query_recommendations()
RETURNS TABLE(
    recommendation TEXT,
    benefit TEXT,
    impact TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Missing index detected' as recommendation,
        'Would improve query performance' as benefit,
        'HIGH' as impact
    WHERE EXISTS (
        SELECT 1 FROM pg_stat_user_tables 
        WHERE schemaname = 'public' 
        AND seq_scan > 1000
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. CACHE TABLE FOR QUERY RESULTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS query_cache (
    cache_key TEXT PRIMARY KEY,
    query_hash TEXT NOT NULL,
    result_data JSONB NOT NULL,
    query_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT NOW()
);

-- Index for cache cleanup
CREATE INDEX IF NOT EXISTS idx_query_cache_expires 
    ON query_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_query_cache_hash 
    ON query_cache(query_hash);

-- Function to get or set cache
CREATE OR REPLACE FUNCTION get_cached_query(p_cache_key TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Try to get from cache
    SELECT result_data INTO result
    FROM query_cache
    WHERE cache_key = p_cache_key
      AND expires_at > NOW();
    
    IF FOUND THEN
        -- Update hit count and last accessed
        UPDATE query_cache
        SET hit_count = hit_count + 1,
            last_accessed = NOW()
        WHERE cache_key = p_cache_key;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM query_cache
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. QUERY PATTERN LEARNING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS query_patterns (
    id SERIAL PRIMARY KEY,
    query_pattern TEXT NOT NULL,
    execution_count INTEGER DEFAULT 1,
    avg_duration_ms FLOAT,
    last_executed TIMESTAMP DEFAULT NOW(),
    optimization_applied JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for finding common patterns
CREATE INDEX IF NOT EXISTS idx_query_patterns_count 
    ON query_patterns(execution_count DESC);

-- Function to learn from query execution
CREATE OR REPLACE FUNCTION learn_query_pattern(
    p_pattern TEXT,
    p_duration_ms FLOAT
)
RETURNS void AS $$
BEGIN
    INSERT INTO query_patterns (query_pattern, avg_duration_ms)
    VALUES (p_pattern, p_duration_ms)
    ON CONFLICT (query_pattern) DO UPDATE
    SET execution_count = query_patterns.execution_count + 1,
        avg_duration_ms = (query_patterns.avg_duration_ms * query_patterns.execution_count + p_duration_ms) 
                         / (query_patterns.execution_count + 1),
        last_executed = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create unique constraint for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_query_patterns_unique 
    ON query_patterns(query_pattern);

-- ============================================================================
-- 7. SOURCE TRACKING FOR DATA FUSION
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type TEXT NOT NULL,  -- 'faers', 'e2b', 'internal', etc.
    source_name TEXT,
    confidence_score FLOAT DEFAULT 0.8,
    priority_rank INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add source_id to pv_cases if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pv_cases' AND column_name = 'source_id'
    ) THEN
        ALTER TABLE pv_cases ADD COLUMN source_id UUID REFERENCES data_sources(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pv_cases_source 
    ON pv_cases(source_id);

-- ============================================================================
-- 8. PERFORMANCE MONITORING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value FLOAT NOT NULL,
    metric_unit TEXT,
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_time 
    ON performance_metrics(recorded_at DESC);

-- Function to record performance metric
CREATE OR REPLACE FUNCTION record_performance_metric(
    p_name TEXT,
    p_value FLOAT,
    p_unit TEXT DEFAULT 'ms'
)
RETURNS void AS $$
BEGIN
    INSERT INTO performance_metrics (metric_name, metric_value, metric_unit)
    VALUES (p_name, p_value, p_unit);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. VACUUM AND MAINTENANCE
-- ============================================================================

-- Auto-vacuum settings for large tables
ALTER TABLE pv_cases SET (
    autovacuum_vacuum_scale_factor = 0.02,
    autovacuum_analyze_scale_factor = 0.01
);

ALTER TABLE file_uploads SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);

-- ============================================================================
-- 10. VERIFICATION & STATISTICS
-- ============================================================================

-- View for performance overview
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
WHERE expires_at > NOW();

-- Comments
COMMENT ON TABLE pv_cases_partitioned IS 'Partitioned version of pv_cases for improved query performance on date ranges';
COMMENT ON MATERIALIZED VIEW mv_drug_event_signals IS 'Pre-computed signal statistics - refresh hourly';
COMMENT ON TABLE query_cache IS 'Query result cache - reduces database load for repeated queries';
COMMENT ON TABLE query_patterns IS 'Learned query patterns for automatic optimization';

-- Verification query
SELECT 
    'Migration 007_scalability_infrastructure_fixed completed' as status,
    (SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'public') as materialized_views,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%') as custom_indexes,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'pv_cases_%') as partitions;

-- Show performance improvements
SELECT 
    'Performance infrastructure ready!' as message,
    'Run refresh_performance_views() after bulk inserts' as next_step;

