-- Fix Duplicate Sessions Migration
-- Version: 008_fix_duplicate_sessions
-- Date: 2024-12-08
-- Purpose: Fix duplicate sessions created for the same day and update the session lookup function

-- Step 1: Update the function to prevent duplicates
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

-- Step 2: Merge duplicate sessions for the same day
-- This consolidates multiple sessions created on the same day into one
DO $$
DECLARE
    session_record RECORD;
    target_session_id UUID;
    duplicate_sessions UUID[];
BEGIN
    -- Find all days with multiple auto-sessions
    FOR session_record IN
        SELECT 
            DATE(started_at) as session_date,
            ARRAY_AGG(id ORDER BY started_at) as session_ids,
            COUNT(*) as session_count
        FROM upload_sessions
        WHERE is_auto = true
        GROUP BY DATE(started_at)
        HAVING COUNT(*) > 1
    LOOP
        -- Use the first (oldest) session as the target
        target_session_id := session_record.session_ids[1];
        duplicate_sessions := session_record.session_ids[2:array_length(session_record.session_ids, 1)];
        
        -- Move all files from duplicate sessions to the target session
        UPDATE file_uploads
        SET session_id = target_session_id
        WHERE session_id = ANY(duplicate_sessions);
        
        -- Update the target session stats
        UPDATE upload_sessions
        SET 
            files_count = (
                SELECT COUNT(*) FROM file_uploads WHERE session_id = target_session_id
            ),
            cases_created = (
                SELECT COALESCE(SUM(cases_created), 0) FROM file_uploads WHERE session_id = target_session_id
            ),
            valid_cases = (
                SELECT COALESCE(SUM(cases_valid), 0) FROM file_uploads WHERE session_id = target_session_id
            ),
            invalid_cases = (
                SELECT COALESCE(SUM(cases_invalid), 0) FROM file_uploads WHERE session_id = target_session_id
            ),
            status = 'active'
        WHERE id = target_session_id;
        
        -- Delete duplicate sessions
        DELETE FROM upload_sessions
        WHERE id = ANY(duplicate_sessions);
        
        RAISE NOTICE 'Merged % duplicate sessions for date % into session %', 
            array_length(duplicate_sessions, 1), 
            session_record.session_date, 
            target_session_id;
    END LOOP;
END $$;

-- Step 3: Verify the fix
SELECT 
    'Migration 008_fix_duplicate_sessions completed' as status,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT DATE(started_at)) as unique_dates,
    COUNT(*) - COUNT(DISTINCT DATE(started_at)) as duplicates_fixed
FROM upload_sessions
WHERE is_auto = true;

-- Show remaining sessions grouped by date
SELECT 
    DATE(started_at) as session_date,
    COUNT(*) as sessions_count,
    STRING_AGG(name, ', ') as session_names
FROM upload_sessions
WHERE is_auto = true
GROUP BY DATE(started_at)
ORDER BY session_date DESC;

