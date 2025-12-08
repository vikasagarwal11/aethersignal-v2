-- ============================================================================
-- MIGRATION 003: Case Validation and Completeness Tracking
-- ============================================================================
-- Adds ICH E2B compliance validation and incomplete case handling
-- Compatible with existing schema
-- ============================================================================

-- Add validation and completeness fields to pv_cases
ALTER TABLE pv_cases
ADD COLUMN IF NOT EXISTS completeness_status TEXT DEFAULT 'complete',
ADD COLUMN IF NOT EXISTS missing_fields JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS validation_errors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS validation_passed BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID,
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Add check constraint for completeness_status
ALTER TABLE pv_cases
DROP CONSTRAINT IF EXISTS pv_cases_completeness_status_check;

ALTER TABLE pv_cases
ADD CONSTRAINT pv_cases_completeness_status_check 
CHECK (completeness_status IN ('complete', 'incomplete', 'pending_review', 'reviewed', 'rejected'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pv_cases_completeness 
ON pv_cases(completeness_status) 
WHERE completeness_status != 'complete';

CREATE INDEX IF NOT EXISTS idx_pv_cases_requires_review 
ON pv_cases(requires_manual_review) 
WHERE requires_manual_review = TRUE;

CREATE INDEX IF NOT EXISTS idx_pv_cases_validation 
ON pv_cases(validation_passed) 
WHERE validation_passed = FALSE;

-- Add reporter information fields (ICH E2B requirement)
ALTER TABLE pv_cases
ADD COLUMN IF NOT EXISTS reporter_type TEXT,
ADD COLUMN IF NOT EXISTS reporter_country TEXT,
ADD COLUMN IF NOT EXISTS reporter_qualification TEXT;

-- Add date fields (ICH E2B requirement)
ALTER TABLE pv_cases
ADD COLUMN IF NOT EXISTS drug_start_date DATE,
ADD COLUMN IF NOT EXISTS drug_end_date DATE,
ADD COLUMN IF NOT EXISTS receipt_date DATE;

-- Add patient initials (ICH E2B requirement)
ALTER TABLE pv_cases
ADD COLUMN IF NOT EXISTS patient_initials TEXT;

-- Comments
COMMENT ON COLUMN pv_cases.completeness_status IS 'ICH E2B completeness: complete, incomplete, pending_review, reviewed, rejected';
COMMENT ON COLUMN pv_cases.missing_fields IS 'Array of field names that are missing for ICH E2B compliance';
COMMENT ON COLUMN pv_cases.validation_errors IS 'Array of validation error messages';
COMMENT ON COLUMN pv_cases.validation_passed IS 'Whether case passed ICH E2B minimum criteria validation';
COMMENT ON COLUMN pv_cases.requires_manual_review IS 'Flag for cases that need human review';
COMMENT ON COLUMN pv_cases.reporter_type IS 'Reporter qualification: HCP, Consumer, Other';
COMMENT ON COLUMN pv_cases.patient_initials IS 'Patient initials for identification';

-- Add file processing status fields to file_upload_history
ALTER TABLE file_upload_history
ADD COLUMN IF NOT EXISTS total_valid_cases INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_invalid_cases INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS validation_summary JSONB DEFAULT '{}'::jsonb;

-- Update trigger to sync cases_created with total_cases
CREATE OR REPLACE FUNCTION update_file_upload_validation_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate validation stats when cases are updated
    UPDATE file_upload_history
    SET 
        total_valid_cases = (
            SELECT COUNT(*) 
            FROM pv_cases 
            WHERE source_file_id = NEW.source_file_id 
              AND validation_passed = TRUE
        ),
        total_invalid_cases = (
            SELECT COUNT(*) 
            FROM pv_cases 
            WHERE source_file_id = NEW.source_file_id 
              AND validation_passed = FALSE
        ),
        validation_summary = (
            SELECT jsonb_build_object(
                'complete', COUNT(*) FILTER (WHERE completeness_status = 'complete'),
                'incomplete', COUNT(*) FILTER (WHERE completeness_status = 'incomplete'),
                'pending_review', COUNT(*) FILTER (WHERE completeness_status = 'pending_review')
            )
            FROM pv_cases 
            WHERE source_file_id = NEW.source_file_id
        )
    WHERE id = NEW.source_file_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_validation_stats ON pv_cases;
CREATE TRIGGER update_validation_stats
    AFTER INSERT OR UPDATE ON pv_cases
    FOR EACH ROW
    WHEN (NEW.source_file_id IS NOT NULL)
    EXECUTE FUNCTION update_file_upload_validation_stats();

-- Create view for incomplete cases that need review
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
ORDER BY pc.created_at DESC;

COMMENT ON VIEW incomplete_cases_review IS 'Cases that need manual review for completeness';

-- Verification query
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
-- pv_cases: 9 new columns
-- file_upload_history: 3 new columns

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
