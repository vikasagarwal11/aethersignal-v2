-- ============================================================================
-- Uploaded Files Table Migration
-- Purpose: Track file uploads and processing status for AI file processor
-- ============================================================================

CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization TEXT NOT NULL,
    
    -- File metadata
    filename TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_hash_md5 TEXT, -- MD5 hash for duplicate detection
    file_type TEXT, -- 'PDF', 'Word', 'Excel', 'Email', 'Image', 'Audio', 'ZIP', etc.
    file_path TEXT, -- Path to stored file (if stored locally)
    
    -- Upload metadata
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    upload_status TEXT DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
    
    -- Processing metadata
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT, -- Error message if failed
    
    -- AI extraction results
    cases_created INTEGER DEFAULT 0, -- Number of cases extracted from file
    ai_confidence_score NUMERIC, -- Overall AI confidence (0-1)
    
    -- Source metadata
    source TEXT DEFAULT 'upload', -- 'upload', 'email', 'api', etc.
    
    -- Additional metadata (JSONB for flexibility)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_organization ON uploaded_files(organization);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_status ON uploaded_files(upload_status);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_file_hash ON uploaded_files(file_hash_md5);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_at ON uploaded_files(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_file_type ON uploaded_files(file_type);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_status ON uploaded_files(user_id, upload_status);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_org_status ON uploaded_files(organization, upload_status);

-- Row Level Security (RLS)
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own uploads
CREATE POLICY "Users can view own uploads"
    ON uploaded_files FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own uploads
CREATE POLICY "Users can insert own uploads"
    ON uploaded_files FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own uploads
CREATE POLICY "Users can update own uploads"
    ON uploaded_files FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_uploaded_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_uploaded_files_updated_at
    BEFORE UPDATE ON uploaded_files
    FOR EACH ROW
    EXECUTE FUNCTION update_uploaded_files_updated_at();

-- Comments for documentation
COMMENT ON TABLE uploaded_files IS 'Tracks file uploads and AI processing status';
COMMENT ON COLUMN uploaded_files.upload_status IS 'Status: queued, processing, completed, failed';
COMMENT ON COLUMN uploaded_files.cases_created IS 'Number of pharmacovigilance cases extracted from file';
COMMENT ON COLUMN uploaded_files.ai_confidence_score IS 'Overall AI confidence in extraction (0-1)';

