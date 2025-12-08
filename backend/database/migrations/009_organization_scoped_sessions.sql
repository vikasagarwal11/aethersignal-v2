-- Database Migration: Organization-Scoped Sessions
-- Version: 009_organization_scoped_sessions
-- Date: 2024-12-08
-- Purpose: Add organization field to sessions and enable multi-tenant session management

-- Step 1: Add organization field to upload_sessions table
ALTER TABLE upload_sessions 
ADD COLUMN IF NOT EXISTS organization TEXT;

-- Create index for organization filtering
CREATE INDEX IF NOT EXISTS idx_upload_sessions_organization 
ON upload_sessions(organization);

-- Create composite index for common queries (organization + date)
CREATE INDEX IF NOT EXISTS idx_upload_sessions_org_date 
ON upload_sessions(organization, started_at DESC);

-- Step 2: Update function to accept and use organization
CREATE OR REPLACE FUNCTION get_or_create_session_for_upload(org_name TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
    today_start TIMESTAMP;
    today_end TIMESTAMP;
BEGIN
    -- Get start and end of today
    today_start := DATE_TRUNC('day', NOW());
    today_end := today_start + INTERVAL '1 day';
    
    -- Check if there's ANY auto-session for today AND this organization
    SELECT id INTO session_id
    FROM upload_sessions
    WHERE is_auto = true
      AND (organization = org_name OR (organization IS NULL AND org_name IS NULL))
      AND started_at >= today_start
      AND started_at < today_end
    ORDER BY started_at DESC
    LIMIT 1;
    
    -- If no session exists for today and this organization, create one
    IF session_id IS NULL THEN
        INSERT INTO upload_sessions (name, started_at, is_auto, status, organization)
        VALUES (
            'Session ' || CURRENT_DATE::text,
            NOW(),
            true,
            'active',
            org_name
        )
        RETURNING id INTO session_id;
    ELSE
        -- Reactivate the session if it was completed
        UPDATE upload_sessions
        SET status = 'active'
        WHERE id = session_id AND status != 'active';
        
        -- Update organization if it was NULL
        IF org_name IS NOT NULL THEN
            UPDATE upload_sessions
            SET organization = org_name
            WHERE id = session_id AND organization IS NULL;
        END IF;
    END IF;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Add organization and user_id to file_uploads if they don't exist
ALTER TABLE file_uploads 
ADD COLUMN IF NOT EXISTS organization TEXT;

ALTER TABLE file_uploads 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_file_uploads_organization 
ON file_uploads(organization);

CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id 
ON file_uploads(user_id);

-- Step 4: Update trigger function to get organization from file_uploads
CREATE OR REPLACE FUNCTION assign_session_to_upload()
RETURNS TRIGGER AS $$
DECLARE
    org_name TEXT;
BEGIN
    -- Only assign if session_id is NULL
    IF NEW.session_id IS NULL THEN
        -- Get organization from the file_uploads record itself
        org_name := NEW.organization;
        
        -- If not in file_uploads, try to get from file_upload_history
        IF org_name IS NULL THEN
            SELECT organization INTO org_name
            FROM file_upload_history
            WHERE id = NEW.id
            LIMIT 1;
        END IF;
        
        -- If still not found, try uploaded_files
        IF org_name IS NULL THEN
            SELECT organization INTO org_name
            FROM uploaded_files
            WHERE id = NEW.id
            LIMIT 1;
        END IF;
        
        -- Get or create session with organization
        NEW.session_id := get_or_create_session_for_upload(org_name);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update existing sessions to have organization from their files
-- This backfills organization for existing sessions
UPDATE upload_sessions s
SET organization = (
    SELECT DISTINCT fu.organization
    FROM file_uploads fu
    WHERE fu.session_id = s.id
    AND fu.organization IS NOT NULL
    LIMIT 1
)
WHERE s.organization IS NULL
AND EXISTS (
    SELECT 1 FROM file_uploads fu 
    WHERE fu.session_id = s.id 
    AND fu.organization IS NOT NULL
);

-- Also try to get from file_upload_history if file_uploads doesn't have it
UPDATE upload_sessions s
SET organization = (
    SELECT DISTINCT fuh.organization
    FROM file_uploads fu
    JOIN file_upload_history fuh ON fuh.id = fu.id
    WHERE fu.session_id = s.id
    AND fuh.organization IS NOT NULL
    LIMIT 1
)
WHERE s.organization IS NULL
AND EXISTS (
    SELECT 1 FROM file_uploads fu
    JOIN file_upload_history fuh ON fuh.id = fu.id
    WHERE fu.session_id = s.id 
    AND fuh.organization IS NOT NULL
);

-- Step 6: Add comments
COMMENT ON COLUMN upload_sessions.organization IS 'Organization that owns this session. Sessions are scoped per organization for multi-tenant support.';

-- Step 7: Verification query
SELECT 
    'Migration 009_organization_scoped_sessions completed' as status,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT organization) as unique_organizations,
    COUNT(*) FILTER (WHERE organization IS NOT NULL) as sessions_with_org,
    COUNT(*) FILTER (WHERE organization IS NULL) as sessions_without_org
FROM upload_sessions;

