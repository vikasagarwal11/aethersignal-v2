-- Migration: Fix saved_analyses table schema
-- Updates existing table to match new schema with owner_user_id
-- EXECUTION ORDER: 011.1 (Run after 011_saved_analyses.sql if table already exists)

-- ============================================================================
-- FIX SAVED ANALYSES TABLE SCHEMA
-- ============================================================================
-- If table was created with 'user_id', we need to rename it to 'owner_user_id'

-- Check if table exists with old schema (user_id column)
-- If it does, rename the column
DO $$
BEGIN
    -- Check if user_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'saved_analyses' 
        AND column_name = 'user_id'
    ) THEN
        -- Rename user_id to owner_user_id
        ALTER TABLE saved_analyses RENAME COLUMN user_id TO owner_user_id;
        
        -- Drop old index if it exists
        DROP INDEX IF EXISTS idx_saved_analyses_user_id;
        
        -- Create new index on owner_user_id
        CREATE INDEX IF NOT EXISTS idx_saved_analyses_owner
            ON saved_analyses(owner_user_id);
    END IF;
    
    -- If owner_user_id doesn't exist at all, add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'saved_analyses' 
        AND column_name = 'owner_user_id'
    ) THEN
        ALTER TABLE saved_analyses ADD COLUMN owner_user_id TEXT NULL;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_saved_analyses_owner
            ON saved_analyses(owner_user_id);
    END IF;
    
    -- Ensure session_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'saved_analyses' 
        AND column_name = 'session_id'
    ) THEN
        ALTER TABLE saved_analyses ADD COLUMN session_id TEXT NULL;
    END IF;
    
    -- Ensure analysis_id index exists
    CREATE INDEX IF NOT EXISTS idx_saved_analyses_analysis
        ON saved_analyses(analysis_id);
END $$;

