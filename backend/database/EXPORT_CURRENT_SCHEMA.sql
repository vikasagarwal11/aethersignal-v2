-- ============================================================================
-- Export Current Database Schema
-- Run this in Supabase SQL Editor to get current database structure
-- ============================================================================

-- 1. List all tables
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY table_schema, table_name;

-- 2. Check if uploaded_files or file_upload_history table exists
SELECT 
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_name IN ('uploaded_files', 'file_upload_history')
    AND table_schema NOT IN ('pg_catalog', 'information_schema');

-- 3. Get columns for uploaded_files if it exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'uploaded_files'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Get columns for file_upload_history if it exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'file_upload_history'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Get all indexes on these tables
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('uploaded_files', 'file_upload_history')
    AND schemaname = 'public';

-- 6. Get RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('uploaded_files', 'file_upload_history');

-- 7. Get all triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('uploaded_files', 'file_upload_history')
    AND event_object_schema = 'public';

