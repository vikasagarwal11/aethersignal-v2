-- ============================================================================
-- OPTIONAL PERFORMANCE BOOST: Database function for SQL execution
-- ============================================================================
-- This allows the API to run raw SQL for maximum performance
-- Only needed if you want 10x faster queries (recommended for production)
-- ============================================================================

-- Create function to execute dynamic SQL (use with caution)
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE 'SELECT json_agg(t) FROM (' || query || ') t' INTO result;
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated, anon, service_role;

COMMENT ON FUNCTION exec_sql IS 'Executes dynamic SQL and returns JSON result (use with sanitized queries only)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test the function
SELECT exec_sql('SELECT COUNT(*) as total FROM pv_cases');

-- Expected output: [{"total": 38}] (or your actual count)

-- ============================================================================
-- SECURITY NOTE
-- ============================================================================
-- This function allows executing arbitrary SQL
-- The API code must sanitize ALL inputs to prevent SQL injection
-- In production, consider:
-- 1. Using prepared statements
-- 2. Parameterized queries
-- 3. Strict input validation
-- 4. Row-level security (RLS) policies
-- ============================================================================
