-- Migration: Saved Analyses Table
-- Creates table for persisting saved/bookmarked analyses in the database
-- EXECUTION ORDER: 011 (Run after base schema)

-- ============================================================================
-- SAVED ANALYSES TABLE
-- ============================================================================
-- Simple bookmark pointing to an analysis. Initially can filter by session_id;
-- later will tie to owner_user_id when auth is integrated.

CREATE TABLE IF NOT EXISTS saved_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id TEXT NOT NULL,
    name TEXT NOT NULL,
    owner_user_id TEXT NULL,      -- tie to your auth user id later
    session_id TEXT NULL,         -- optional: originating session
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_analyses_owner
    ON saved_analyses(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_saved_analyses_analysis
    ON saved_analyses(analysis_id);

-- RLS Policies (if using Supabase RLS)
-- For now, we'll use service key, but prepare for RLS:
-- ALTER TABLE saved_analyses ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can view their own saved analyses"
--     ON saved_analyses FOR SELECT
--     USING (auth.uid()::text = user_id);
-- 
-- CREATE POLICY "Users can insert their own saved analyses"
--     ON saved_analyses FOR INSERT
--     WITH CHECK (auth.uid()::text = user_id);
-- 
-- CREATE POLICY "Users can delete their own saved analyses"
--     ON saved_analyses FOR DELETE
--     USING (auth.uid()::text = user_id);

