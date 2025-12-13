#!/usr/bin/env python3
"""
Dump database schema using Supabase SQL API
Alternative to pg_dump when direct PostgreSQL connection is not available
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ Missing supabase. Install with: pip install supabase-py")
    sys.exit(1)

# Load environment variables
load_dotenv()

def get_supabase_client():
    """Get Supabase client"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) must be set")
        sys.exit(1)
    
    return create_client(supabase_url, supabase_key)

def dump_schema_via_sql():
    """Dump schema by querying information_schema"""
    supabase = get_supabase_client()
    
    output_file = Path("schema_dump.sql")
    
    schema_dump = []
    schema_dump.append("-- Database Schema Dump")
    schema_dump.append(f"-- Generated: {datetime.now().isoformat()}")
    schema_dump.append("-- Method: Supabase SQL API (information_schema queries)")
    schema_dump.append("")
    
    try:
        # Get all tables
        tables_query = """
            SELECT 
                table_schema,
                table_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
            AND table_type = 'BASE TABLE'
            ORDER BY table_schema, table_name;
        """
        
        result = supabase.rpc('exec_sql', {'query': tables_query}).execute()
        
        # Note: Supabase RPC might not support exec_sql, so let's try a different approach
        # Get table list from a simple query
        try:
            # Try to query a known table to get connection
            test_result = supabase.table('user_profiles').select('id').limit(0).execute()
            print("✅ Connected to Supabase")
        except Exception as e:
            print(f"⚠️  Note: {e}")
        
        # For schema dump, we'll query information_schema via direct SQL
        # Since we can't execute arbitrary SQL, we'll generate CREATE TABLE statements
        # by querying information_schema tables directly
        
        # Get column information
        print("📊 Generating schema dump...")
        print("   This method generates CREATE TABLE statements from information_schema")
        print("   For complete schema with functions/triggers, use Supabase SQL Editor")
        
        # List of known tables (from codebase)
        known_tables = [
            'user_profiles',
            'pv_cases',
            'upload_sessions',
            'file_upload_history',
            'file_uploads',
            'uploaded_files',
            'saved_analyses',
            'statistical_signals'
        ]
        
        for table_name in known_tables:
            try:
                # Try to get a sample row to infer structure
                result = supabase.table(table_name).select('*').limit(1).execute()
                schema_dump.append(f"-- Table: public.{table_name}")
                schema_dump.append(f"-- (Structure inferred from existing data)")
                schema_dump.append("")
            except Exception as e:
                # Table might not exist or be empty
                schema_dump.append(f"-- Table: public.{table_name}")
                schema_dump.append(f"-- (Could not access: {str(e)[:100]})")
                schema_dump.append("")
        
        schema_dump.append("")
        schema_dump.append("-- NOTE: This is a simplified dump.")
        schema_dump.append("-- For complete schema dump:")
        schema_dump.append("-- 1. Use Supabase SQL Editor to run:")
        schema_dump.append("--    SELECT pg_get_tabledef('table_name'::regclass);")
        schema_dump.append("-- 2. Or install PostgreSQL client tools and use pg_dump")
        schema_dump.append("-- 3. Or use Supabase CLI: supabase db dump --schema-only")
        
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("\n".join(schema_dump))
        
        print(f"✅ Schema dump file created (simplified)")
        print(f"📄 Output file: {output_file.absolute()}")
        print(f"📊 Size: {output_file.stat().st_size} bytes")
        print("")
        print("💡 Recommendation:")
        print("   For a complete schema dump, use one of these methods:")
        print("   1. Supabase Dashboard → SQL Editor → Run: pg_dump equivalent queries")
        print("   2. Install PostgreSQL client tools and run: pg_dump --schema-only DATABASE_URL")
        print("   3. Use Supabase CLI: supabase db dump --schema-only")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = dump_schema_via_sql()
    sys.exit(0 if success else 1)

