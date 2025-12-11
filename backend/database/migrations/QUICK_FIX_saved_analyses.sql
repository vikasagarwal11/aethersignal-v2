-- QUICK FIX: Update saved_analyses table schema
-- Run this if you get "column owner_user_id does not exist" error

-- Option 1: If table has 'user_id' column, rename it (guarded)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'saved_analyses'
          AND column_name = 'user_id'
    ) THEN
        ALTER TABLE saved_analyses RENAME COLUMN user_id TO owner_user_id;
    END IF;
END $$;

-- Option 2: If owner_user_id doesn't exist, add it
ALTER TABLE saved_analyses ADD COLUMN IF NOT EXISTS owner_user_id TEXT NULL;

-- Update indexes
DROP INDEX IF EXISTS idx_saved_analyses_user_id;
CREATE INDEX IF NOT EXISTS idx_saved_analyses_owner ON saved_analyses(owner_user_id);

-- Ensure session_id exists
ALTER TABLE saved_analyses ADD COLUMN IF NOT EXISTS session_id TEXT NULL;

-- Ensure analysis_id index exists
CREATE INDEX IF NOT EXISTS idx_saved_analyses_analysis ON saved_analyses(analysis_id);
