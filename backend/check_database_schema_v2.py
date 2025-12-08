#!/usr/bin/env python3
"""
Database Schema Checker - Enhanced Version
Uses SQL queries to get schema information even for empty tables
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

def get_table_columns_sql(table_name: str):
    """Get columns using SQL query via RPC or direct query"""
    try:
        # Try to use RPC function to query information_schema
        # If RPC not available, we'll try alternative methods
        query = f"""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '{table_name}'
        ORDER BY ordinal_position;
        """
        
        # Supabase doesn't support direct SQL, so we'll try to infer from sample data
        # or use a workaround
        try:
            result = supabase.rpc('exec_sql', {'query': query}).execute()
            return result.data if result.data else None
        except:
            # RPC not available, try to get schema from empty insert attempt
            pass
        
        # Alternative: Try to get one row (even if empty, might give us structure)
        # Or use table metadata if available
        return None
    except Exception as e:
        return None

def check_table_and_get_info(table_name: str):
    """Check if table exists and get its information"""
    info = {
        "exists": False,
        "columns": [],
        "row_count": 0,
        "created_at": None,
        "in_use": False
    }
    
    try:
        # Try to query the table
        result = supabase.table(table_name).select("id").limit(1).execute()
        info["exists"] = True
        
        # Get row count
        try:
            count_result = supabase.table(table_name).select("id", count="exact").execute()
            info["row_count"] = count_result.count if hasattr(count_result, 'count') else 0
            info["in_use"] = info["row_count"] > 0
        except:
            pass
        
        # Try to get columns by selecting all from one row
        try:
            sample = supabase.table(table_name).select("*").limit(1).execute()
            if sample.data and len(sample.data) > 0:
                info["columns"] = list(sample.data[0].keys())
            else:
                # Table is empty - we need to check schema differently
                # For empty tables, we'll need to check the backup SQL files
                info["columns"] = None
        except Exception as e:
            print(f"      Error getting columns: {str(e)[:100]}")
        
        # Get creation date from earliest row
        try:
            earliest = supabase.table(table_name).select("created_at").order("created_at", desc=False).limit(1).execute()
            if earliest.data and len(earliest.data) > 0:
                info["created_at"] = earliest.data[0].get("created_at")
        except:
            pass
            
    except Exception as e:
        error_msg = str(e).lower()
        if "does not exist" in error_msg or ("relation" in error_msg and "does not exist" in error_msg):
            info["exists"] = False
        else:
            # Might exist but have RLS or other issues
            info["exists"] = "unknown"
            info["error"] = str(e)[:200]
    
    return info

def get_pv_cases_schema_from_backup():
    """Get pv_cases schema from backup SQL files"""
    backup_path = Path(__file__).parent.parent / "backup" / "aethersignal" / "database"
    schema_file = backup_path / "00_schema.sql"
    
    if schema_file.exists():
        content = schema_file.read_text()
        # Look for pv_cases table definition
        if "CREATE TABLE" in content and "pv_cases" in content:
            # Extract columns (simplified parsing)
            lines = content.split('\n')
            in_pv_cases = False
            columns = []
            for line in lines:
                if "CREATE TABLE" in line and "pv_cases" in line:
                    in_pv_cases = True
                    continue
                if in_pv_cases:
                    if ");" in line or ("CREATE TABLE" in line and "pv_cases" not in line):
                        break
                    if line.strip() and not line.strip().startswith("--") and "(" in line:
                        # Extract column name
                        col_part = line.strip().split()[0] if line.strip().split() else ""
                        if col_part and col_part not in ["CONSTRAINT", "PRIMARY", "FOREIGN", "UNIQUE", "CHECK"]:
                            columns.append(col_part)
            return columns
    return None

def get_file_upload_history_schema_from_backup():
    """Get file_upload_history schema from backup SQL files"""
    backup_path = Path(__file__).parent.parent / "backup" / "aethersignal" / "database"
    schema_file = backup_path / "08_file_upload_history.sql"
    
    if schema_file.exists():
        content = schema_file.read_text()
        # Extract columns
        lines = content.split('\n')
        in_table = False
        columns = []
        for line in lines:
            if "CREATE TABLE" in line and "file_upload_history" in line:
                in_table = True
                continue
            if in_table:
                if ");" in line or ("CREATE TABLE" in line and "file_upload_history" not in line):
                    break
                if line.strip() and not line.strip().startswith("--") and "(" in line:
                    col_part = line.strip().split()[0] if line.strip().split() else ""
                    if col_part and col_part not in ["CONSTRAINT", "PRIMARY", "FOREIGN", "UNIQUE", "CHECK", "INDEX"]:
                        columns.append(col_part)
        return columns
    return None

def main():
    print("=" * 70)
    print("DATABASE SCHEMA CHECKER - ENHANCED")
    print("=" * 70)
    print()
    
    # Check tables
    print("📊 CHECKING TABLES...")
    print("-" * 70)
    
    tables = {
        "file_upload_history": check_table_and_get_info("file_upload_history"),
        "uploaded_files": check_table_and_get_info("uploaded_files"),
        "pv_cases": check_table_and_get_info("pv_cases")
    }
    
    # Display results
    for table_name, info in tables.items():
        status = "✅ EXISTS" if info["exists"] is True else ("❌ NOT FOUND" if info["exists"] is False else "⚠️  UNKNOWN")
        print(f"\n{table_name}: {status}")
        if info.get("row_count") is not None:
            print(f"   Rows: {info['row_count']}")
        if info.get("created_at"):
            print(f"   Created: {info['created_at']}")
        if info.get("in_use") is not None:
            print(f"   In Use: {'Yes' if info['in_use'] else 'No (empty)'}")
    
    # Check pv_cases columns
    print("\n" + "=" * 70)
    print("📋 PV_CASES TABLE STRUCTURE")
    print("-" * 70)
    
    pv_info = tables["pv_cases"]
    if pv_info["exists"]:
        columns = pv_info.get("columns")
        
        if not columns:
            # Try to get from backup
            print("\n   Table is empty, checking backup SQL files...")
            columns = get_pv_cases_schema_from_backup()
        
        if columns:
            print(f"\n✅ Columns found ({len(columns)} total):")
            for col in sorted(columns):
                print(f"   • {col}")
            
            # Check specific columns
            print("\n🔍 Checking specific columns:")
            specific_cols = {
                "source_file_id": "source_file_id" in columns or any("source_file" in c.lower() for c in columns),
                "narrative": "narrative" in columns,
                "patient_age": "patient_age" in columns,
                "patient_sex": "patient_sex" in columns
            }
            
            for col, exists in specific_cols.items():
                status = "✅ EXISTS" if exists else "❌ NOT FOUND"
                print(f"   {status}: {col}")
        else:
            print("\n   ⚠️  Could not determine columns (table empty and backup not found)")
    else:
        print("\n   ❌ pv_cases table does not exist")
    
    # Check file_upload_history details
    print("\n" + "=" * 70)
    print("📋 FILE_UPLOAD_HISTORY TABLE DETAILS")
    print("-" * 70)
    
    fuh_info = tables["file_upload_history"]
    if fuh_info["exists"]:
        columns = fuh_info.get("columns")
        
        if not columns:
            # Try to get from backup
            print("\n   Table is empty, checking backup SQL files...")
            columns = get_file_upload_history_schema_from_backup()
        
        if columns:
            print(f"\n✅ Columns ({len(columns)} total):")
            for col in sorted(columns):
                print(f"   • {col}")
        else:
            print("\n   ⚠️  Could not determine columns")
        
        print(f"\n📊 Row count: {fuh_info.get('row_count', 0)}")
        if fuh_info.get("created_at"):
            print(f"📅 Created: {fuh_info['created_at']}")
        print(f"✅ Status: {'IN USE' if fuh_info.get('in_use') else 'EMPTY (not being used yet)'}")
    else:
        print("\n   ❌ file_upload_history table does not exist")
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 SUMMARY")
    print("-" * 70)
    print("\nTables Status:")
    for table_name, info in tables.items():
        if info["exists"] is True:
            status = f"✅ EXISTS ({info.get('row_count', 0)} rows)"
        elif info["exists"] is False:
            status = "❌ NOT FOUND"
        else:
            status = "⚠️  UNKNOWN"
        print(f"   {table_name}: {status}")
    
    print("\n" + "=" * 70)
    print("\n💡 RECOMMENDATION:")
    if tables["file_upload_history"]["exists"]:
        print("   ✅ file_upload_history EXISTS - Enhance it with AI fields")
        print("   ✅ uploaded_files NOT FOUND - Can create new or enhance existing")
    else:
        print("   ✅ Use new uploaded_files table (file_upload_history doesn't exist)")
    print()

if __name__ == "__main__":
    main()

