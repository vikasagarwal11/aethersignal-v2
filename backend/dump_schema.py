#!/usr/bin/env python3
"""
Dump database schema to SQL file
Uses psycopg2 to connect and dump schema only
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("❌ Missing psycopg2. Install with: pip install psycopg2-binary")
    sys.exit(1)

# Load environment variables
load_dotenv()

def get_database_url():
    """Get DATABASE_URL from environment"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in .env")
        sys.exit(1)
    return database_url

def dump_schema():
    """Dump schema only using pg_dump via subprocess or psycopg2"""
    database_url = get_database_url()
    
    # Fix URL encoding issues (password might contain @ or other special chars)
    from urllib.parse import urlparse, urlunparse, quote, unquote
    try:
        parsed = urlparse(database_url)
        # Reconstruct URL with properly encoded password
        if parsed.password:
            # URL-decode first to get original password
            decoded_password = unquote(parsed.password)
            # Re-encode it properly
            encoded_password = quote(decoded_password, safe='')
            # Reconstruct netloc
            netloc = f"{parsed.username}:{encoded_password}@{parsed.hostname}"
            if parsed.port:
                netloc += f":{parsed.port}"
            database_url = urlunparse((parsed.scheme, netloc, parsed.path, parsed.params, parsed.query, parsed.fragment))
    except Exception as e:
        print(f"⚠️  Warning: Could not parse DATABASE_URL, using as-is: {e}")
    
    # Try using pg_dump command first (if available)
    import subprocess
    import shutil
    
    pg_dump_path = shutil.which("pg_dump")
    if pg_dump_path:
        print(f"✅ Using pg_dump from: {pg_dump_path}")
        output_file = Path("schema_dump.sql")
        
        try:
            result = subprocess.run(
                [
                    pg_dump_path,
                    "--schema-only",
                    "--no-owner",
                    "--no-privileges",
                    database_url
                ],
                capture_output=True,
                text=True,
                check=True
            )
            
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(result.stdout)
            
            print(f"✅ Schema dump completed successfully!")
            print(f"📄 Output file: {output_file.absolute()}")
            print(f"📊 Size: {output_file.stat().st_size} bytes")
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Error running pg_dump: {e}")
            print(f"   stderr: {e.stderr}")
            return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    else:
        # Fallback: Use psycopg2 to generate schema dump
        print("⚠️  pg_dump not found in PATH. Using psycopg2 alternative...")
        print("   Note: This is a simplified dump. For full schema dump, install PostgreSQL client tools.")
        
        try:
            conn = psycopg2.connect(database_url)
            conn.autocommit = True
            cur = conn.cursor()
            
            output_file = Path("schema_dump.sql")
            
            # Get all table definitions
            cur.execute("""
                SELECT 
                    schemaname,
                    tablename
                FROM pg_tables
                WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
                ORDER BY schemaname, tablename;
            """)
            
            tables = cur.fetchall()
            
            schema_dump = []
            schema_dump.append("-- Database Schema Dump")
            schema_dump.append(f"-- Generated: {Path().cwd()}")
            schema_dump.append("-- Note: This is a simplified dump. Use pg_dump for complete schema.")
            schema_dump.append("")
            
            for schema, table in tables:
                # Get CREATE TABLE statement
                cur.execute("""
                    SELECT pg_get_tabledef('{}.{}'::regclass);
                """.format(schema, table))
                
                try:
                    create_stmt = cur.fetchone()[0]
                    schema_dump.append(f"-- Table: {schema}.{table}")
                    schema_dump.append(create_stmt)
                    schema_dump.append("")
                except Exception as e:
                    print(f"⚠️  Warning: Could not dump table {schema}.{table}: {e}")
            
            # Get indexes
            cur.execute("""
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    indexdef
                FROM pg_indexes
                WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
                ORDER BY schemaname, tablename, indexname;
            """)
            
            indexes = cur.fetchall()
            if indexes:
                schema_dump.append("-- Indexes")
                schema_dump.append("")
                for schema, table, indexname, indexdef in indexes:
                    schema_dump.append(f"-- Index: {schema}.{table}.{indexname}")
                    schema_dump.append(indexdef + ";")
                    schema_dump.append("")
            
            # Get functions
            cur.execute("""
                SELECT 
                    n.nspname as schema,
                    p.proname as function_name,
                    pg_get_functiondef(p.oid) as function_def
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
                ORDER BY n.nspname, p.proname;
            """)
            
            functions = cur.fetchall()
            if functions:
                schema_dump.append("-- Functions")
                schema_dump.append("")
                for schema, func_name, func_def in functions:
                    schema_dump.append(f"-- Function: {schema}.{func_name}")
                    schema_dump.append(func_def)
                    schema_dump.append("")
            
            cur.close()
            conn.close()
            
            with open(output_file, "w", encoding="utf-8") as f:
                f.write("\n".join(schema_dump))
            
            print(f"✅ Schema dump completed (simplified version)!")
            print(f"📄 Output file: {output_file.absolute()}")
            print(f"📊 Size: {output_file.stat().st_size} bytes")
            print(f"📋 Tables dumped: {len(tables)}")
            return True
            
        except Exception as e:
            print(f"❌ Error connecting to database: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    success = dump_schema()
    sys.exit(0 if success else 1)

