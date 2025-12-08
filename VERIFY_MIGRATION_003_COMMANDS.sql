-- ============================================================================
-- VERIFICATION COMMANDS FOR MIGRATION 003
-- Copy and paste each section into Supabase SQL Editor
-- ============================================================================

-- 1. CHECK ALL COLUMNS IN pv_cases TABLE
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'pv_cases' 
  AND column_name IN (
    'completeness_status', 'missing_fields', 'validation_errors',
    'validation_passed', 'requires_manual_review', 'reviewed_at',
    'reviewed_by', 'reviewer_notes', 'reporter_type',
    'reporter_country', 'reporter_qualification', 'drug_start_date',
    'drug_end_date', 'receipt_date', 'patient_initials'
  )
ORDER BY column_name;

-- Expected: 15 rows


-- 2. CHECK ALL COLUMNS IN file_upload_history TABLE
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'file_upload_history' 
  AND column_name IN (
    'total_valid_cases', 'total_invalid_cases', 'validation_summary'
  )
ORDER BY column_name;

-- Expected: 3 rows


-- 3. CHECK INDEXES WERE CREATED
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'pv_cases'
  AND indexname IN (
    'idx_pv_cases_completeness',
    'idx_pv_cases_requires_review',
    'idx_pv_cases_validation'
  )
ORDER BY indexname;

-- Expected: 3 rows


-- 4. CHECK TRIGGER EXISTS
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'pv_cases'
  AND trigger_name = 'update_validation_stats';

-- Expected: 1 row


-- 5. CHECK FUNCTION EXISTS
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_file_upload_validation_stats';

-- Expected: 1 row (function)


-- 6. CHECK VIEW EXISTS
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'incomplete_cases_review';

-- Expected: 1 row (view)


-- 7. CHECK CONSTRAINT EXISTS
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'pv_cases'
  AND tc.constraint_name = 'pv_cases_completeness_status_check';

-- Expected: 1 row


-- 8. COUNT ALL NEW COLUMNS (QUICK CHECK)
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

-- Expected output:
-- pv_cases: 9 new columns (or 15 if counting all)
-- file_upload_history: 3 new columns


-- 9. TEST VIEW WORKS
SELECT * FROM incomplete_cases_review LIMIT 5;

-- Expected: Returns incomplete cases or empty if all complete


-- 10. CHECK SAMPLE DATA (if cases exist)
SELECT 
    id,
    drug_name,
    reaction,
    completeness_status,
    validation_passed,
    missing_fields,
    requires_manual_review
FROM pv_cases
ORDER BY created_at DESC
LIMIT 5;

-- Expected: Shows cases with validation fields populated


-- 11. CHECK FILE UPLOAD VALIDATION STATS (if files uploaded)
SELECT 
    filename,
    total_valid_cases,
    total_invalid_cases,
    validation_summary
FROM file_upload_history
ORDER BY uploaded_at DESC
LIMIT 5;

-- Expected: Shows files with validation stats

