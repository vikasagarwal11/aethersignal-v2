-- ============================================================================
-- PERFORMANCE OPTIMIZATION: Composite Index for GROUP BY Queries
-- ============================================================================
-- This index optimizes the signals aggregation query that groups by
-- drug_name and reaction, which is the most common query pattern
-- ============================================================================

-- Composite index for GROUP BY (drug_name, reaction) queries
-- This dramatically speeds up the signals aggregation endpoint
CREATE INDEX IF NOT EXISTS idx_pv_cases_drug_reaction_composite 
ON pv_cases(drug_name, reaction, serious, source, organization)
WHERE drug_name IS NOT NULL AND reaction IS NOT NULL;

-- Index for stats queries (filters by source and organization)
CREATE INDEX IF NOT EXISTS idx_pv_cases_source_org_serious
ON pv_cases(source, organization, serious)
WHERE source IS NOT NULL;

-- Partial index for serious cases (common filter)
CREATE INDEX IF NOT EXISTS idx_pv_cases_serious_partial
ON pv_cases(drug_name, reaction, source)
WHERE serious = true AND drug_name IS NOT NULL AND reaction IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if indexes were created
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'pv_cases'
  AND indexname IN (
    'idx_pv_cases_drug_reaction_composite',
    'idx_pv_cases_source_org_serious',
    'idx_pv_cases_serious_partial'
  )
ORDER BY indexname;

-- ============================================================================
-- PERFORMANCE TEST
-- ============================================================================

-- Test query (should use the new composite index)
EXPLAIN ANALYZE
SELECT 
    drug_name,
    reaction,
    COUNT(*) as cases,
    COUNT(*) FILTER (WHERE serious = true) as serious_count
FROM pv_cases
WHERE drug_name IS NOT NULL AND reaction IS NOT NULL
GROUP BY drug_name, reaction
ORDER BY cases DESC
LIMIT 100;

-- Expected: Should show "Index Scan using idx_pv_cases_drug_reaction_composite"
-- ============================================================================

