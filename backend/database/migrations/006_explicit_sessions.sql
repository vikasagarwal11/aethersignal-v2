-- Database Migration: Explicit Upload Sessions
-- Version: 006_explicit_sessions
-- Date: 2024-12-08
-- Purpose: Create upload_sessions table for explicit session management

-- Create upload_sessions table
CREATE TABLE IF NOT EXISTS upload_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    created_by TEXT,
    status TEXT NOT NULL DEFAULT 'active',  -- active, completed, archived
    is_auto BOOLEAN DEFAULT false,  -- true if auto-created, false if user-created
    
    -- Statistics (cached for performance)
    files_count INTEGER DEFAULT 0,
    cases_created INTEGER DEFAULT 0,
    valid_cases INTEGER DEFAULT 0,
    invalid_cases INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Drop views that depend on session_id before altering column
DROP VIEW IF EXISTS upload_statistics CASCADE;
DROP VIEW IF EXISTS duplicate_files_view CASCADE;

-- Update file_uploads to use UUID foreign key
DO $$ 
DECLARE
    col_type TEXT;
BEGIN
    -- Check current column type
    SELECT data_type INTO col_type
    FROM information_schema.columns 
    WHERE table_name = 'file_uploads' AND column_name = 'session_id';
    
    -- If column exists and is TEXT, convert to UUID
    IF col_type = 'text' THEN
        -- First, set all existing session_ids to NULL (they're date strings, not UUIDs)
        UPDATE file_uploads SET session_id = NULL WHERE session_id IS NOT NULL;
        
        -- Change column type to UUID
        ALTER TABLE file_uploads 
        ALTER COLUMN session_id TYPE UUID USING NULL;
    ELSIF col_type IS NULL THEN
        -- Column doesn't exist, add it as UUID
        ALTER TABLE file_uploads 
        ADD COLUMN session_id UUID;
    END IF;
    
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'file_uploads_session_id_fkey'
        AND table_name = 'file_uploads'
    ) THEN
        ALTER TABLE file_uploads
        ADD CONSTRAINT file_uploads_session_id_fkey 
        FOREIGN KEY (session_id) REFERENCES upload_sessions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Recreate views that were dropped (updated for UUID session_id)
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

-- Recreate upload_statistics view (updated for UUID session_id)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upload_sessions_started_at 
    ON upload_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_upload_sessions_status 
    ON upload_sessions(status);

CREATE INDEX IF NOT EXISTS idx_upload_sessions_is_auto 
    ON upload_sessions(is_auto);

-- Function to auto-create session for new uploads
CREATE OR REPLACE FUNCTION get_or_create_session_for_upload()
RETURNS UUID AS $$
DECLARE
    session_id UUID;
    today_start TIMESTAMP;
    today_end TIMESTAMP;
BEGIN
    -- Get start and end of today
    today_start := DATE_TRUNC('day', NOW());
    today_end := today_start + INTERVAL '1 day';
    
    -- Check if there's ANY auto-session for today (not just active)
    -- This prevents creating multiple sessions for the same day
    SELECT id INTO session_id
    FROM upload_sessions
    WHERE is_auto = true
      AND started_at >= today_start
      AND started_at < today_end
    ORDER BY started_at DESC
    LIMIT 1;
    
    -- If no session exists for today, create one
    IF session_id IS NULL THEN
        INSERT INTO upload_sessions (name, started_at, is_auto, status)
        VALUES (
            'Session ' || CURRENT_DATE::text,
            NOW(),
            true,
            'active'
        )
        RETURNING id INTO session_id;
    ELSE
        -- Reactivate the session if it was completed
        UPDATE upload_sessions
        SET status = 'active'
        WHERE id = session_id AND status != 'active';
    END IF;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign session_id to file_uploads
CREATE OR REPLACE FUNCTION assign_session_to_upload()
RETURNS TRIGGER AS $$
BEGIN
    -- Only assign if session_id is NULL
    IF NEW.session_id IS NULL THEN
        NEW.session_id := get_or_create_session_for_upload();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign session on insert
DROP TRIGGER IF EXISTS assign_session_on_upload_insert ON file_uploads;
CREATE TRIGGER assign_session_on_upload_insert
    BEFORE INSERT ON file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION assign_session_to_upload();

-- Function to update session statistics
CREATE OR REPLACE FUNCTION update_session_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update session stats when file_uploads changes
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE upload_sessions
        SET 
            files_count = (
                SELECT COUNT(*) FROM file_uploads WHERE session_id = NEW.session_id
            ),
            cases_created = (
                SELECT COALESCE(SUM(cases_created), 0) FROM file_uploads WHERE session_id = NEW.session_id
            ),
            valid_cases = (
                SELECT COALESCE(SUM(cases_valid), 0) FROM file_uploads WHERE session_id = NEW.session_id
            ),
            invalid_cases = (
                SELECT COALESCE(SUM(cases_invalid), 0) FROM file_uploads WHERE session_id = NEW.session_id
            ),
            updated_at = NOW()
        WHERE id = NEW.session_id;
    END IF;
    
    IF TG_OP = 'DELETE' AND OLD.session_id IS NOT NULL THEN
        UPDATE upload_sessions
        SET 
            files_count = (
                SELECT COUNT(*) FROM file_uploads WHERE session_id = OLD.session_id
            ),
            cases_created = (
                SELECT COALESCE(SUM(cases_created), 0) FROM file_uploads WHERE session_id = OLD.session_id
            ),
            valid_cases = (
                SELECT COALESCE(SUM(cases_valid), 0) FROM file_uploads WHERE session_id = OLD.session_id
            ),
            invalid_cases = (
                SELECT COALESCE(SUM(cases_invalid), 0) FROM file_uploads WHERE session_id = OLD.session_id
            ),
            updated_at = NOW()
        WHERE id = OLD.session_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session stats
DROP TRIGGER IF EXISTS update_session_stats_trigger ON file_uploads;
CREATE TRIGGER update_session_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_session_stats();

-- View for session summary
CREATE OR REPLACE VIEW session_summary_view AS
SELECT 
    s.id,
    s.name,
    s.description,
    s.started_at,
    s.ended_at,
    s.status,
    s.is_auto,
    s.files_count,
    s.cases_created,
    s.valid_cases,
    s.invalid_cases,
    COUNT(DISTINCT fu.id) as actual_files_count,
    COALESCE(SUM(fu.cases_created), 0) as actual_cases_created
FROM upload_sessions s
LEFT JOIN file_uploads fu ON s.id = fu.session_id
GROUP BY s.id, s.name, s.description, s.started_at, s.ended_at, s.status, s.is_auto, s.files_count, s.cases_created, s.valid_cases, s.invalid_cases;

-- Comments
COMMENT ON TABLE upload_sessions IS 'Explicit upload sessions - can be auto-created (by date) or user-created (named)';
COMMENT ON COLUMN upload_sessions.is_auto IS 'true = auto-created by date, false = user-created named session';
COMMENT ON COLUMN upload_sessions.status IS 'active = currently accepting uploads, completed = closed, archived = historical';

-- Verification query
SELECT 
    'Migration 006_explicit_sessions completed' as status,
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE is_auto = true) as auto_sessions,
    COUNT(*) FILTER (WHERE is_auto = false) as user_sessions
FROM upload_sessions;

