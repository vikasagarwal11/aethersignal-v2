-- ============================================================================
-- QUICK DATABASE CHECK - Run these in Supabase SQL Editor
-- ============================================================================

-- 1. CHECK IF CASES EXIST
-- ============================================================================
SELECT 
    COUNT(*) as total_cases,
    COUNT(DISTINCT drug_name) as unique_drugs,
    COUNT(DISTINCT reaction) as unique_reactions
FROM pv_cases;

-- Expected: Should show cases > 0 if uploads worked


-- 2. CHECK RECENT CASES
-- ============================================================================
SELECT 
    id,
    drug_name,
    reaction,
    age,
    sex,
    serious,
    source,
    completeness_status,
    validation_passed,
    created_at
FROM pv_cases
ORDER BY created_at DESC
LIMIT 10;

-- Expected: Should see your uploaded cases with drug_name and reaction


-- 3. CHECK FILE UPLOAD HISTORY
-- ============================================================================
SELECT 
    id,
    filename,
    upload_status,
    cases_created,
    total_valid_cases,
    total_invalid_cases,
    status_message,
    uploaded_at
FROM file_upload_history
ORDER BY uploaded_at DESC
LIMIT 10;

-- Expected: Should see your 5 test files with status "completed"


-- 4. CHECK SIGNAL AGGREGATION (What API Should Return)
-- ============================================================================
SELECT 
    drug_name as drug,
    reaction,
    COUNT(*) as cases,
    SUM(CASE WHEN serious THEN 1 ELSE 0 END) as serious_count,
    MIN(created_at) as first_case,
    MAX(created_at) as last_case
FROM pv_cases
WHERE drug_name IS NOT NULL 
  AND reaction IS NOT NULL
  AND drug_name != 'Unknown'
  AND reaction != 'Unknown'
GROUP BY drug_name, reaction
ORDER BY cases DESC;

-- Expected: Should show aggregated signals (drug + reaction combinations)
-- This is what the signals API should return


-- 5. CHECK FOR "Unknown" VALUES (Might Cause Issues)
-- ============================================================================
SELECT 
    drug_name,
    reaction,
    COUNT(*) as count
FROM pv_cases
WHERE drug_name = 'Unknown' OR reaction = 'Unknown'
GROUP BY drug_name, reaction;

-- Expected: Should be 0 or very few
-- If many, AI extraction might not be working properly


-- 6. CHECK VALIDATION STATUS
-- ============================================================================
SELECT 
    completeness_status,
    validation_passed,
    requires_manual_review,
    COUNT(*) as count
FROM pv_cases
GROUP BY completeness_status, validation_passed, requires_manual_review
ORDER BY count DESC;

-- Expected: Should show distribution of validation statuses


-- 7. CHECK BY SOURCE
-- ============================================================================
SELECT 
    source,
    COUNT(*) as count
FROM pv_cases
GROUP BY source;

-- Expected: Should show "AI_EXTRACTED" for uploaded files


-- 8. QUICK SUMMARY
-- ============================================================================
SELECT 
    'Total Cases' as metric,
    COUNT(*)::text as value
FROM pv_cases
UNION ALL
SELECT 
    'Completed Uploads',
    COUNT(*)::text
FROM file_upload_history
WHERE upload_status = 'completed'
UNION ALL
SELECT 
    'Total Cases Created',
    SUM(cases_created)::text
FROM file_upload_history
WHERE upload_status = 'completed'
UNION ALL
SELECT 
    'Valid Cases',
    COUNT(*)::text
FROM pv_cases
WHERE validation_passed = true
UNION ALL
SELECT 
    'Incomplete Cases',
    COUNT(*)::text
FROM pv_cases
WHERE requires_manual_review = true;

