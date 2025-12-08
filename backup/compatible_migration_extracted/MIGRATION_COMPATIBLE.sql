-- ============================================================================
-- MIGRATION: Enhance Existing Tables for AI File Processing
-- ============================================================================
-- This migration adds AI processing fields to your existing tables
-- without creating conflicts or losing data.
--
-- Tables being enhanced:
-- 1. file_upload_history - Add AI processing fields
-- 2. pv_cases - Add link to uploaded files and narrative field
-- ============================================================================

-- ============================================================================
-- PART 1: ENHANCE file_upload_history FOR AI PROCESSING
-- ============================================================================

-- Add file_path for local file storage
ALTER TABLE file_upload_history
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Add AI confidence score (0.00 to 1.00)
ALTER TABLE file_upload_history
ADD COLUMN IF NOT EXISTS ai_confidence_score NUMERIC(3,2);

-- Add progress field for real-time updates (0-100)
ALTER TABLE file_upload_history
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- Add status message for frontend display
ALTER TABLE file_upload_history
ADD COLUMN IF NOT EXISTS status_message TEXT;

-- Rename total_cases to cases_created for consistency with frontend
-- (Keep total_cases as alias, add cases_created as the main field)
ALTER TABLE file_upload_history
ADD COLUMN IF NOT EXISTS cases_created INTEGER DEFAULT 0;

-- Comment on columns
COMMENT ON COLUMN file_upload_history.file_path IS 'Local file storage path';
COMMENT ON COLUMN file_upload_history.ai_confidence_score IS 'AI extraction confidence (0.00-1.00)';
COMMENT ON COLUMN file_upload_history.progress IS 'Processing progress percentage (0-100)';
COMMENT ON COLUMN file_upload_history.status_message IS 'Human-readable status message for UI';
COMMENT ON COLUMN file_upload_history.cases_created IS 'Number of cases created from this file';


-- ============================================================================
-- PART 2: ENHANCE pv_cases TO LINK WITH UPLOADED FILES
-- ============================================================================

-- Add source_file_id to link cases to uploaded files
ALTER TABLE pv_cases
ADD COLUMN IF NOT EXISTS source_file_id UUID REFERENCES file_upload_history(id) ON DELETE SET NULL;

-- Add narrative field for AI-generated case narratives
ALTER TABLE pv_cases
ADD COLUMN IF NOT EXISTS narrative TEXT;

-- Add AI extraction metadata
ALTER TABLE pv_cases
ADD COLUMN IF NOT EXISTS ai_extracted BOOLEAN DEFAULT FALSE;

-- Add AI confidence for this specific case
ALTER TABLE pv_cases
ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3,2);

-- Comment on columns
COMMENT ON COLUMN pv_cases.source_file_id IS 'Reference to file_upload_history.id that created this case';
COMMENT ON COLUMN pv_cases.narrative IS 'AI-generated or manually entered case narrative';
COMMENT ON COLUMN pv_cases.ai_extracted IS 'Whether this case was created by AI extraction';
COMMENT ON COLUMN pv_cases.ai_confidence IS 'AI confidence for this specific case extraction (0.00-1.00)';


-- ============================================================================
-- PART 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on source_file_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_pv_cases_source_file 
ON pv_cases(source_file_id) 
WHERE source_file_id IS NOT NULL;

-- Index on ai_extracted for filtering AI vs manual cases
CREATE INDEX IF NOT EXISTS idx_pv_cases_ai_extracted 
ON pv_cases(ai_extracted) 
WHERE ai_extracted = TRUE;

-- Index on upload_status for quick status queries
CREATE INDEX IF NOT EXISTS idx_file_upload_history_status 
ON file_upload_history(upload_status);

-- Index on processing timestamps
CREATE INDEX IF NOT EXISTS idx_file_upload_history_processing 
ON file_upload_history(processing_started_at, processing_completed_at);


-- ============================================================================
-- PART 4: CREATE HELPER FUNCTION TO SYNC total_cases
-- ============================================================================

-- Function to keep total_cases in sync with cases_created
CREATE OR REPLACE FUNCTION sync_file_upload_cases()
RETURNS TRIGGER AS $$
BEGIN
    -- When cases_created is updated, also update total_cases
    IF NEW.cases_created IS DISTINCT FROM OLD.cases_created THEN
        NEW.total_cases := NEW.cases_created;
    END IF;
    
    -- When total_cases is updated, also update cases_created
    IF NEW.total_cases IS DISTINCT FROM OLD.total_cases THEN
        NEW.cases_created := NEW.total_cases;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep fields in sync
DROP TRIGGER IF EXISTS sync_file_upload_cases_trigger ON file_upload_history;
CREATE TRIGGER sync_file_upload_cases_trigger
    BEFORE UPDATE ON file_upload_history
    FOR EACH ROW
    EXECUTE FUNCTION sync_file_upload_cases();


-- ============================================================================
-- PART 5: CREATE VIEW FOR AI PROCESSING STATUS
-- ============================================================================

-- View that shows AI processing progress with better field names
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
ORDER BY uploaded_at DESC;

COMMENT ON VIEW file_processing_status IS 'Simplified view of file processing status for API';


-- ============================================================================
-- PART 6: UPDATE EXISTING DATA (if any)
-- ============================================================================

-- Initialize progress to 100 for any completed uploads
UPDATE file_upload_history
SET progress = 100
WHERE upload_status = 'completed' AND progress IS NULL;

-- Initialize progress to 0 for pending uploads
UPDATE file_upload_history
SET progress = 0
WHERE upload_status = 'processing' AND progress IS NULL;

-- Set cases_created from total_cases for existing records
UPDATE file_upload_history
SET cases_created = total_cases
WHERE cases_created IS NULL AND total_cases IS NOT NULL;


-- ============================================================================
-- PART 7: VERIFICATION QUERIES
-- ============================================================================

-- Verify columns were added to file_upload_history
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'file_upload_history'
      AND column_name IN ('file_path', 'ai_confidence_score', 'progress', 'status_message', 'cases_created');
    
    IF col_count = 5 THEN
        RAISE NOTICE '✓ All 5 AI columns added to file_upload_history';
    ELSE
        RAISE WARNING '⚠ Only % of 5 columns added to file_upload_history', col_count;
    END IF;
END $$;

-- Verify columns were added to pv_cases
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'pv_cases'
      AND column_name IN ('source_file_id', 'narrative', 'ai_extracted', 'ai_confidence');
    
    IF col_count = 4 THEN
        RAISE NOTICE '✓ All 4 AI columns added to pv_cases';
    ELSE
        RAISE WARNING '⚠ Only % of 4 columns added to pv_cases', col_count;
    END IF;
END $$;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Show final table structure
SELECT 
    'file_upload_history' as table_name,
    COUNT(*) as total_columns,
    COUNT(*) FILTER (WHERE column_name IN ('file_path', 'ai_confidence_score', 'progress', 'status_message', 'cases_created')) as new_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'file_upload_history'
UNION ALL
SELECT 
    'pv_cases' as table_name,
    COUNT(*) as total_columns,
    COUNT(*) FILTER (WHERE column_name IN ('source_file_id', 'narrative', 'ai_extracted', 'ai_confidence')) as new_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pv_cases';

-- ============================================================================
-- NOTES FOR BACKEND TEAM
-- ============================================================================

-- The backend should now use:
-- - file_upload_history instead of uploaded_files
-- - cases_created field for number of cases
-- - progress field (0-100) for real-time updates
-- - status_message for UI display
-- - source_file_id in pv_cases to link to file_upload_history
-- 
-- All existing statistics fields are preserved:
-- - total_events, total_drugs, total_serious_cases, total_fatal_cases
-- - earliest_date, latest_date
-- - stats_calculated_at, stats_status
