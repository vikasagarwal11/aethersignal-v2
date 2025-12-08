-- ============================================================================
-- VERIFICATION QUERIES FOR MIGRATION 003
-- Run these in Supabase SQL Editor to verify all columns were added
-- ============================================================================

-- Check ALL new columns in pv_cases (should be 15 total)
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'pv_cases' 
  AND column_name IN (
    -- Validation fields (8)
    'completeness_status',
    'missing_fields',
    'validation_errors',
    'validation_passed',
    'requires_manual_review',
    'reviewed_at',
    'reviewed_by',
    'reviewer_notes',
    -- Reporter fields (3)
    'reporter_type',
    'reporter_country',
    'reporter_qualification',
    -- Date fields (3)
    'drug_start_date',
    'drug_end_date',
    'receipt_date',
    -- Patient field (1)
    'patient_initials'
  )
ORDER BY column_name;

-- Expected: 15 rows

-- Check ALL new columns in file_upload_history (should be 3 total)
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'file_upload_history' 
  AND column_name IN (
    'total_valid_cases',
    'total_invalid_cases',
    'validation_summary'
  )
ORDER BY column_name;

-- Expected: 3 rows

-- Check if indexes were created
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'pv_cases'
  AND indexname LIKE 'idx_pv_cases%'
ORDER BY indexname;

-- Expected: 3 indexes
-- idx_pv_cases_completeness
-- idx_pv_cases_requires_review
-- idx_pv_cases_validation

-- Check if trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'pv_cases'
  AND trigger_name = 'update_validation_stats';

-- Expected: 1 row

-- Check if view was created
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'incomplete_cases_review';

-- Expected: 1 row (view)

-- Check if function was created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_file_upload_validation_stats';

-- Expected: 1 row (function)

-- ============================================================================
-- SUMMARY COUNT QUERY (What you already ran)
-- ============================================================================
SELECT 
    'pv_cases' as table_name,
    COUNT(*) FILTER (WHERE column_name IN (
        'completeness_status', 'missing_fields', 'validation_errors', 
        'validation_passed', 'requires_manual_review', 'reporter_type',
        'reporter_country', 'drug_start_date', 'patient_initials'
    )) as new_columns_added
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'pv_cases'
UNION ALL
SELECT 
    'file_upload_history' as table_name,
    COUNT(*) FILTER (WHERE column_name IN (
        'total_valid_cases', 'total_invalid_cases', 'validation_summary'
    )) as new_columns_added
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'file_upload_history';

-- This query only checks 9 of the 15 columns added to pv_cases
-- The migration actually adds 15 columns total to pv_cases

