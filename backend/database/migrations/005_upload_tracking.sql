-- Database Migration: File Upload Tracking & Duplicate Detection (FIXED)
-- Version: 005_upload_tracking_fixed
-- Date: 2024-12-08
-- Purpose: Track file uploads, detect duplicates, manage upload history

-- Create file_uploads table (without upload_sessions dependency)
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,  -- SHA-256 hash for duplicate detection
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'uploaded',  -- uploaded, processing, completed, error
    error_message TEXT,
    
    -- Processing stats
    cases_created INTEGER DEFAULT 0,
    cases_valid INTEGER DEFAULT 0,
    cases_invalid INTEGER DEFAULT 0,
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    
    -- Duplicate handling
    is_duplicate BOOLEAN DEFAULT false,
    duplicate_of_id UUID REFERENCES file_uploads(id),
    duplicate_action TEXT,  -- skip, replace, keep
    
    -- Session tracking (optional - will link later if sessions table exists)
    session_id TEXT,  -- Changed to TEXT, no foreign key for now
    
    -- Metadata
    original_format TEXT,  -- pdf, xlsx, xml, etc.
    file_metadata JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add upload_id to pv_cases if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pv_cases' AND column_name = 'upload_id'
    ) THEN
        ALTER TABLE pv_cases ADD COLUMN upload_id UUID REFERENCES file_uploads(id);
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_uploads_hash 
    ON file_uploads(file_hash);

CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_at 
    ON file_uploads(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_uploads_session 
    ON file_uploads(session_id);

CREATE INDEX IF NOT EXISTS idx_file_uploads_status 
    ON file_uploads(status);

CREATE INDEX IF NOT EXISTS idx_pv_cases_upload_id 
    ON pv_cases(upload_id);

-- Index for finding duplicates quickly
CREATE INDEX IF NOT EXISTS idx_file_uploads_duplicate 
    ON file_uploads(file_hash, uploaded_at)
    WHERE is_duplicate = false;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_file_uploads_updated_at ON file_uploads;
CREATE TRIGGER update_file_uploads_updated_at
    BEFORE UPDATE ON file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to mark duplicates automatically
CREATE OR REPLACE FUNCTION mark_duplicate_uploads()
RETURNS TRIGGER AS $$
DECLARE
    existing_upload UUID;
BEGIN
    -- Check if hash already exists
    SELECT id INTO existing_upload
    FROM file_uploads
    WHERE file_hash = NEW.file_hash
      AND id != NEW.id
      AND is_duplicate = false
    ORDER BY uploaded_at ASC
    LIMIT 1;
    
    IF existing_upload IS NOT NULL THEN
        NEW.is_duplicate = true;
        NEW.duplicate_of_id = existing_upload;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-mark duplicates on insert
DROP TRIGGER IF EXISTS mark_duplicates_on_insert ON file_uploads;
CREATE TRIGGER mark_duplicates_on_insert
    BEFORE INSERT ON file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION mark_duplicate_uploads();

-- View for duplicate analysis
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
ORDER BY duplicate_count DESC, first_uploaded DESC;

-- View for upload statistics
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
ORDER BY upload_date DESC;

-- Comments
COMMENT ON TABLE file_uploads IS 'Tracks all file uploads with duplicate detection';
COMMENT ON COLUMN file_uploads.file_hash IS 'SHA-256 hash for duplicate detection';
COMMENT ON COLUMN file_uploads.is_duplicate IS 'Automatically set to true if hash matches existing file';
COMMENT ON COLUMN file_uploads.duplicate_action IS 'Action taken for duplicate: skip, replace, or keep';
COMMENT ON COLUMN file_uploads.session_id IS 'Optional session ID - stores as text until sessions table created';

-- Verification query
SELECT 
    'Migration 005_upload_tracking_fixed completed' as status,
    COUNT(*) as total_uploads,
    COUNT(*) FILTER (WHERE is_duplicate = true) as duplicates_found
FROM file_uploads;

