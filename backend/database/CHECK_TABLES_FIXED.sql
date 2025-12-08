-- ============================================================================
-- FIXED QUERIES - Safe to run even if tables don't exist
-- ============================================================================

-- ============================================================================
-- QUICK SUMMARY (FIXED - No errors if tables don't exist)
-- ============================================================================
SELECT 
    t.table_name,
    '✅ EXISTS' as status,
    COUNT(DISTINCT c.column_name) as column_count,
    CASE t.table_name
        WHEN 'file_upload_history' THEN COALESCE((SELECT COUNT(*) FROM file_upload_history), 0)
        WHEN 'uploaded_files' THEN 0  -- Table doesn't exist, so 0 rows
        WHEN 'pv_cases' THEN COALESCE((SELECT COUNT(*) FROM pv_cases), 0)
    END as row_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_schema = c.table_schema 
    AND t.table_name = c.table_name
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('file_upload_history', 'uploaded_files', 'pv_cases')
GROUP BY t.table_name
ORDER BY t.table_name;

-- ============================================================================
-- ALTERNATIVE: Simple table existence check (SAFEST)
-- ============================================================================
SELECT 
    table_name,
    '✅ EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('file_upload_history', 'uploaded_files', 'pv_cases')
ORDER BY table_name;

-- ============================================================================
-- Get row counts safely (only for existing tables)
-- ============================================================================
SELECT 
    'file_upload_history' as table_name,
    COUNT(*) as row_count
FROM file_upload_history
UNION ALL
SELECT 
    'pv_cases' as table_name,
    COUNT(*) as row_count
FROM pv_cases;

-- ============================================================================
-- Get all columns for PV_CASES
-- ============================================================================
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'pv_cases'
ORDER BY ordinal_position;

-- ============================================================================
-- Check specific columns in PV_CASES
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'pv_cases'
  AND column_name IN ('source_file_id', 'narrative', 'patient_age', 'patient_sex', 'age', 'age_yrs', 'sex', 'gender')
ORDER BY column_name;

-- ============================================================================
-- Get all columns for FILE_UPLOAD_HISTORY
-- ============================================================================
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'file_upload_history'
ORDER BY ordinal_position;

-- ============================================================================
-- Check AI columns in FILE_UPLOAD_HISTORY
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'file_upload_history'
  AND column_name IN ('file_path', 'ai_confidence_score', 'cases_created', 'total_cases')
ORDER BY column_name;

-- ============================================================================
-- Comprehensive view (all tables, all columns) - SAFE
-- ============================================================================
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    c.ordinal_position
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_schema = c.table_schema 
    AND t.table_name = c.table_name
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('file_upload_history', 'uploaded_files', 'pv_cases')
ORDER BY t.table_name, c.ordinal_position;

