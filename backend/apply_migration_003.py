"""
Automated Migration 003 Application Script
Applies the validation fields migration to Supabase database
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Load environment variables
load_dotenv()

def get_database_connection_string():
    """Get database connection string from environment"""
    # Try to get DATABASE_URL first (most reliable - use it directly)
    database_url = os.getenv("DATABASE_URL")
    
    if database_url and database_url.startswith("postgresql://"):
        # URL-encode the password if it contains special characters
        from urllib.parse import urlparse, urlunparse, quote
        try:
            parsed = urlparse(database_url)
            # If password contains @, it needs to be URL-encoded
            if "@" in parsed.password or "%" in parsed.password:
                # Reconstruct with properly encoded password
                netloc = f"{parsed.username}:{quote(parsed.password, safe='')}@{parsed.hostname}"
                if parsed.port:
                    netloc += f":{parsed.port}"
                database_url = urlunparse((parsed.scheme, netloc, parsed.path, parsed.params, parsed.query, parsed.fragment))
            return database_url
        except Exception as e:
            print(f"⚠️  Warning: Could not parse DATABASE_URL, trying direct: {e}")
            # Try using it directly anyway
            return database_url
    
    # Fallback: Build connection string from components
    supabase_url = os.getenv("SUPABASE_URL")
    if not supabase_url:
        print("❌ ERROR: SUPABASE_URL not found in .env")
        return None
    
    db_password = os.getenv("SUPABASE_DB_PASSWORD")
    if not db_password:
        print("❌ ERROR: Database password not found")
        print("   Options:")
        print("   1. Add SUPABASE_DB_PASSWORD=your-password to .env")
        print("   2. Ensure DATABASE_URL is set in .env")
        print("   3. Apply migration manually via Supabase SQL Editor")
        return None
    
    # URL-encode password if it contains special characters
    from urllib.parse import quote
    encoded_password = quote(db_password, safe='')
    
    # Build from Supabase URL
    # Format: https://scrksfxnkxmvvdzwmqnc.supabase.co
    host = supabase_url.replace("https://", "").replace("http://", "").replace(".supabase.co", "")
    connection_string = f"postgresql://postgres:{encoded_password}@{host}.supabase.co:5432/postgres"
    return connection_string

def apply_migration():
    """Apply migration 003 using psycopg2"""
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    except ImportError:
        print("📦 Installing psycopg2-binary...")
        os.system(f"{sys.executable} -m pip install psycopg2-binary -q")
        try:
            import psycopg2
            from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
        except ImportError:
            print("❌ ERROR: Could not install psycopg2-binary")
            print("   Please install manually: pip install psycopg2-binary")
            return False
    
    # Get connection string
    conn_string = get_database_connection_string()
    if not conn_string:
        return False
    
    # Read migration file
    migration_file = Path(__file__).parent / "database" / "migrations" / "003_validation_fields.sql"
    if not migration_file.exists():
        print(f"❌ ERROR: Migration file not found: {migration_file}")
        return False
    
    sql_content = migration_file.read_text()
    
    print("🔌 Connecting to database...")
    try:
        conn = psycopg2.connect(conn_string)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("📝 Executing migration...")
        cursor.execute(sql_content)
        
        print("✅ Migration applied successfully!")
        
        # Run verification query
        print("\n🔍 Verifying migration...")
        verification_sql = """
        SELECT 
            'pv_cases' as table_name,
            COUNT(*) FILTER (WHERE column_name IN (
                'completeness_status', 'missing_fields', 'validation_errors', 
                'validation_passed', 'requires_manual_review', 'reporter_type',
                'reporter_country', 'drug_start_date', 'patient_initials'
            )) as new_columns_added
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'pv_cases'
        UNION ALL
        SELECT 
            'file_upload_history' as table_name,
            COUNT(*) FILTER (WHERE column_name IN (
                'total_valid_cases', 'total_invalid_cases', 'validation_summary'
            )) as new_columns_added
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'file_upload_history';
        """
        
        cursor.execute(verification_sql)
        results = cursor.fetchall()
        
        print("\n📊 Verification Results:")
        for table_name, columns_added in results:
            print(f"   {table_name}: {columns_added} new columns")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Migration 003 complete!")
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 70)
    print("Migration 003: Validation Fields - Automated Application")
    print("=" * 70)
    print()
    
    success = apply_migration()
    
    if not success:
        print("\n⚠️  Automated application failed.")
        print("   You can still apply manually:")
        print("   1. Open Supabase SQL Editor")
        print("   2. Copy contents of backend/database/migrations/003_validation_fields.sql")
        print("   3. Paste and run")
        sys.exit(1)
    else:
        sys.exit(0)

