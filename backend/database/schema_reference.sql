-- ============================================================================
-- Schema Reference File
-- Purpose: Reference schema definitions for empty tables
-- Used by: check_database_schema_v2.py
-- ============================================================================
-- This file contains the base schema definitions for tables that may be empty.
-- It's used as a fallback when tables exist but have no rows (can't infer schema).

-- ============================================================================
-- PV_CASES TABLE SCHEMA (Base Definition)
-- ============================================================================
-- This is the base schema for pv_cases table
-- Note: Actual table may have additional columns from migrations

CREATE TABLE IF NOT EXISTS pv_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization TEXT NOT NULL,
    
    -- Case identifiers
    case_id TEXT,
    primaryid TEXT,
    
    -- Drug information
    drug_name TEXT,
    drug_count INTEGER,
    
    -- Reaction information
    reaction TEXT,
    reaction_count INTEGER,
    
    -- Patient demographics
    age NUMERIC,
    age_yrs NUMERIC,
    sex TEXT,
    gender TEXT,
    country TEXT,
    
    -- Seriousness and outcomes
    serious BOOLEAN,
    seriousness TEXT,
    outcome TEXT,
    
    -- Dates
    onset_date DATE,
    event_date DATE,
    report_date DATE,
    receive_date DATE,
    
    -- Source and metadata
    source TEXT DEFAULT 'FAERS',
    raw_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FILE_UPLOAD_HISTORY TABLE SCHEMA (Base Definition)
-- ============================================================================
-- This is the base schema for file_upload_history table
-- Note: Actual table may have additional columns from migrations

CREATE TABLE IF NOT EXISTS file_upload_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization TEXT NOT NULL,
    
    -- File metadata
    filename TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_hash_md5 TEXT,
    file_type TEXT,
    
    -- Upload metadata
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    upload_status TEXT DEFAULT 'processing',
    
    -- Statistics
    total_cases INTEGER DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    total_drugs INTEGER DEFAULT 0,
    total_serious_cases INTEGER DEFAULT 0,
    total_fatal_cases INTEGER DEFAULT 0,
    
    -- Date range
    earliest_date DATE,
    latest_date DATE,
    
    -- Source
    source TEXT DEFAULT 'FAERS',
    
    -- Processing metadata
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    
    -- Statistics tracking
    stats_calculated_at TIMESTAMP WITH TIME ZONE,
    stats_status TEXT DEFAULT 'pending',
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

