-- ============================================================================
-- DATABASE SCHEMA CHECK QUERIES
-- Run these in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================================================

-- ============================================================================
-- 1. CHECK WHICH TABLES EXIST
-- ============================================================================
-- Lists all tables in the public schema

SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- 2. CHECK SPECIFIC TABLES (file_upload_history, uploaded_files, pv_cases)
-- ============================================================================

SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('file_upload_history', 'uploaded_files', 'pv_cases')
ORDER BY table_name;

-- ============================================================================
-- 3. GET ALL COLUMNS FOR PV_CASES TABLE
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
-- 4. CHECK SPECIFIC COLUMNS IN PV_CASES
-- ============================================================================
-- Check if source_file_id, narrative, patient_age, patient_sex exist

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
-- 5. GET ALL COLUMNS FOR FILE_UPLOAD_HISTORY TABLE
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
-- 6. CHECK AI-SPECIFIC COLUMNS IN FILE_UPLOAD_HISTORY
-- ============================================================================
-- Check if file_path, ai_confidence_score, cases_created exist

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
-- 7. GET ALL COLUMNS FOR UPLOADED_FILES TABLE (if it exists)
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
  AND table_name = 'uploaded_files'
ORDER BY ordinal_position;

-- ============================================================================
-- 8. GET TABLE ROW COUNTS
-- ============================================================================

SELECT 
    'file_upload_history' as table_name,
    COUNT(*) as row_count
FROM file_upload_history
UNION ALL
SELECT 
    'uploaded_files' as table_name,
    COUNT(*) as row_count
FROM uploaded_files
UNION ALL
SELECT 
    'pv_cases' as table_name,
    COUNT(*) as row_count
FROM pv_cases;

-- ============================================================================
-- 9. COMPREHENSIVE TABLE INFO (ALL IN ONE)
-- ============================================================================
-- Shows table name, column name, data type, nullable, default for all three tables

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

-- ============================================================================
-- 10. CHECK FOREIGN KEY RELATIONSHIPS
-- ============================================================================
-- See if pv_cases has foreign key to file_upload_history or uploaded_files

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND (tc.table_name = 'pv_cases' OR tc.table_name = 'file_upload_history' OR tc.table_name = 'uploaded_files')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 11. CHECK INDEXES ON TABLES
-- ============================================================================

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('file_upload_history', 'uploaded_files', 'pv_cases')
ORDER BY tablename, indexname;

-- ============================================================================
-- 12. CHECK ROW LEVEL SECURITY (RLS) STATUS
-- ============================================================================

SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('file_upload_history', 'uploaded_files', 'pv_cases')
ORDER BY tablename;

-- ============================================================================
-- 13. GET TABLE CREATION DATE (if available)
-- ============================================================================
-- Note: PostgreSQL doesn't track table creation date by default
-- This shows the oldest row's created_at if tables have that column

SELECT 
    'file_upload_history' as table_name,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record,
    COUNT(*) as total_rows
FROM file_upload_history
UNION ALL
SELECT 
    'uploaded_files' as table_name,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record,
    COUNT(*) as total_rows
FROM uploaded_files
UNION ALL
SELECT 
    'pv_cases' as table_name,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record,
    COUNT(*) as total_rows
FROM pv_cases;

-- ============================================================================
-- QUICK SUMMARY QUERY (RUN THIS FIRST)
-- ============================================================================
-- Shows table existence, column count, and row count in one view

SELECT 
    t.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ NOT FOUND'
    END as status,
    COUNT(DISTINCT c.column_name) as column_count,
    CASE t.table_name
        WHEN 'file_upload_history' THEN (SELECT COUNT(*) FROM file_upload_history)
        WHEN 'uploaded_files' THEN (SELECT COUNT(*) FROM uploaded_files)
        WHEN 'pv_cases' THEN (SELECT COUNT(*) FROM pv_cases)
    END as row_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_schema = c.table_schema 
    AND t.table_name = c.table_name
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('file_upload_history', 'uploaded_files', 'pv_cases')
GROUP BY t.table_name
ORDER BY t.table_name;

