#!/usr/bin/env python3
"""
Database Schema Checker
Checks which tables exist and their structure
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from supabase import create_client, Client
    from dotenv import load_dotenv
except ImportError:
    print("❌ Missing dependencies. Install with: pip install supabase python-dotenv")
    sys.exit(1)

# Load environment variables
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase credentials in .env file")
    print("   Required: SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_KEY)")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_table_exists(table_name: str) -> bool:
    """Check if a table exists by trying to query it"""
    try:
        result = supabase.table(table_name).select("id").limit(1).execute()
        return True
    except Exception as e:
        error_msg = str(e).lower()
        if "does not exist" in error_msg or "relation" in error_msg and "does not exist" in error_msg:
            return False
        # If it's a different error (like RLS policy), table might still exist
        # Try a different approach - query information_schema
        return None  # Unknown

def get_table_columns(table_name: str):
    """Get columns for a table using information_schema"""
    try:
        # Use RPC or direct SQL query if available
        # For now, try to get one row and infer columns
        result = supabase.table(table_name).select("*").limit(1).execute()
        if result.data:
            return list(result.data[0].keys())
        return []
    except Exception as e:
        print(f"   ⚠️  Error getting columns: {e}")
        return None

def get_table_info(table_name: str):
    """Get detailed info about a table"""
    try:
        # Get row count
        count_result = supabase.table(table_name).select("id", count="exact").execute()
        row_count = count_result.count if hasattr(count_result, 'count') else "unknown"
        
        # Get sample data to check creation time
        sample = supabase.table(table_name).select("created_at").order("created_at", desc=False).limit(1).execute()
        created_at = sample.data[0].get("created_at") if sample.data else None
        
        # Get columns
        columns = get_table_columns(table_name)
        
        return {
            "exists": True,
            "row_count": row_count,
            "created_at": created_at,
            "columns": columns
        }
    except Exception as e:
        return {
            "exists": False,
            "error": str(e)
        }

def main():
    print("=" * 70)
    print("DATABASE SCHEMA CHECKER")
    print("=" * 70)
    print()
    
    # Check which tables exist
    print("📊 CHECKING TABLES...")
    print("-" * 70)
    
    tables_to_check = ["file_upload_history", "uploaded_files", "pv_cases"]
    table_status = {}
    
    for table in tables_to_check:
        print(f"\n🔍 Checking: {table}")
        try:
            # Try to query the table
            result = supabase.table(table).select("id").limit(1).execute()
            table_status[table] = True
            print(f"   ✅ EXISTS")
        except Exception as e:
            error_msg = str(e).lower()
            if "does not exist" in error_msg or ("relation" in error_msg and "does not exist" in error_msg):
                table_status[table] = False
                print(f"   ❌ DOES NOT EXIST")
            else:
                # Might exist but have RLS issues - try to get info differently
                table_status[table] = "unknown"
                print(f"   ⚠️  UNKNOWN (Error: {str(e)[:100]})")
    
    # Check pv_cases columns
    print("\n" + "=" * 70)
    print("📋 PV_CASES TABLE STRUCTURE")
    print("-" * 70)
    
    if table_status.get("pv_cases"):
        try:
            # Get a sample row to see all columns
            sample = supabase.table("pv_cases").select("*").limit(1).execute()
            if sample.data:
                columns = list(sample.data[0].keys())
                print(f"\n✅ Columns found ({len(columns)} total):")
                for col in sorted(columns):
                    print(f"   • {col}")
                
                # Check specific columns
                print("\n🔍 Checking specific columns:")
                specific_cols = ["source_file_id", "narrative", "patient_age", "patient_sex"]
                for col in specific_cols:
                    if col in columns:
                        print(f"   ✅ {col} - EXISTS")
                    else:
                        print(f"   ❌ {col} - NOT FOUND")
            else:
                print("   ⚠️  Table exists but is empty")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    else:
        print("   ❌ pv_cases table does not exist")
    
    # Check file_upload_history details
    print("\n" + "=" * 70)
    print("📋 FILE_UPLOAD_HISTORY TABLE DETAILS")
    print("-" * 70)
    
    if table_status.get("file_upload_history"):
        try:
            # Get columns
            sample = supabase.table("file_upload_history").select("*").limit(1).execute()
            if sample.data:
                columns = list(sample.data[0].keys())
                print(f"\n✅ Columns ({len(columns)} total):")
                for col in sorted(columns):
                    print(f"   • {col}")
            else:
                # Table exists but empty - get structure from information_schema would be better
                print("   ⚠️  Table exists but is empty")
            
            # Get row count and creation info
            try:
                count_result = supabase.table("file_upload_history").select("id", count="exact").execute()
                row_count = count_result.count if hasattr(count_result, 'count') else "unknown"
                print(f"\n📊 Row count: {row_count}")
                
                # Get earliest created_at
                earliest = supabase.table("file_upload_history").select("created_at").order("created_at", desc=False).limit(1).execute()
                if earliest.data:
                    created_at = earliest.data[0].get("created_at")
                    print(f"📅 Created: {created_at}")
                
                # Check if being used (has any rows)
                if row_count and row_count > 0:
                    print(f"✅ Status: IN USE ({row_count} row(s))")
                else:
                    print(f"⚠️  Status: EMPTY (not being used yet)")
            except Exception as e:
                print(f"   ⚠️  Could not get usage info: {e}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    else:
        print("   ❌ file_upload_history table does not exist")
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 SUMMARY")
    print("-" * 70)
    print(f"\nTables found:")
    for table, status in table_status.items():
        if status is True:
            print(f"   ✅ {table}")
        elif status is False:
            print(f"   ❌ {table}")
        else:
            print(f"   ⚠️  {table} (status unknown)")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    main()

