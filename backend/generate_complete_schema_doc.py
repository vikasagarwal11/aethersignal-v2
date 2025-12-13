#!/usr/bin/env python3
"""
Complete Database Schema Documentation Generator
Queries information_schema to extract ALL database objects and generates comprehensive markdown
"""

import os
import sys
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

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

def query_database(sql_query: str, supabase: Client):
    """Execute SQL query and return results"""
    try:
        # Use RPC to execute SQL (if available) or use table queries
        # For information_schema queries, we'll use direct SQL via RPC if available
        # Otherwise, we'll query via Supabase's SQL execution
        
        # Try RPC first
        try:
            result = supabase.rpc('exec_sql', {'query': sql_query}).execute()
            if result.data:
                return result.data
        except Exception as e:
            print(f"⚠️  RPC method failed: {e}")
            print("   Note: Using alternative method...")
        
        # Alternative: For information_schema, we might need direct access
        # This is a limitation - Supabase REST API doesn't directly support information_schema queries
        # We'll need to use a workaround or note this limitation
        
        return None
    except Exception as e:
        print(f"❌ Error executing query: {e}")
        return None

def get_all_tables(supabase: Client):
    """Get all tables with their columns"""
    query = """
        SELECT 
            t.table_name,
            c.column_name,
            c.data_type,
            c.character_maximum_length,
            c.is_nullable,
            c.column_default,
            c.ordinal_position
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name, c.ordinal_position;
    """
    
    # Since we can't directly query information_schema via Supabase REST API,
    # we'll use a Python script that connects directly via psycopg2
    return None

def generate_complete_schema_doc():
    """Generate complete schema documentation"""
    print("📊 Generating Complete Database Schema Documentation...")
    print("")
    
    # Try to use psycopg2 for direct database access
    try:
        import psycopg2
        from urllib.parse import urlparse, urlunparse, quote, unquote
        
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("❌ DATABASE_URL not found in .env")
            return False
        
        # Fix URL encoding
        try:
            parsed = urlparse(database_url)
            if parsed.password:
                decoded_password = unquote(parsed.password)
                encoded_password = quote(decoded_password, safe='')
                netloc = f"{parsed.username}:{encoded_password}@{parsed.hostname}"
                if parsed.port:
                    netloc += f":{parsed.port}"
                database_url = urlunparse((parsed.scheme, netloc, parsed.path, parsed.params, parsed.query, parsed.fragment))
        except Exception as e:
            print(f"⚠️  Warning: Could not parse DATABASE_URL: {e}")
        
        # Connect to database
        try:
            conn = psycopg2.connect(database_url, connect_timeout=10)
            conn.autocommit = True
            cur = conn.cursor()
            print("✅ Connected to database")
        except Exception as e:
            print(f"❌ Could not connect to database: {e}")
            print("   Note: This might require direct database access (not via connection pooler)")
            print("   Falling back to migration-based schema extraction...")
            return generate_from_migrations()
        
        # Extract all schema information
        schema_doc = []
        schema_doc.append("# Complete AetherSignal Database Schema Documentation")
        schema_doc.append("")
        schema_doc.append(f"**Generated:** {datetime.now().isoformat()}")
        schema_doc.append(f"**Database:** PostgreSQL (Supabase)")
        schema_doc.append("")
        schema_doc.append("---")
        schema_doc.append("")
        
        # Get all tables
        print("📋 Extracting tables...")
        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        tables = [row[0] for row in cur.fetchall()]
        
        schema_doc.append("## 📊 Tables")
        schema_doc.append("")
        
        for table_name in tables:
            print(f"  📄 {table_name}")
            
            # Get table columns
            cur.execute("""
                SELECT 
                    column_name,
                    data_type,
                    character_maximum_length,
                    numeric_precision,
                    numeric_scale,
                    is_nullable,
                    column_default,
                    ordinal_position
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = %s
                ORDER BY ordinal_position;
            """, (table_name,))
            
            columns = cur.fetchall()
            
            schema_doc.append(f"### Table: `{table_name}`")
            schema_doc.append("")
            
            # Get table comment
            cur.execute("""
                SELECT obj_description('public.' || %s::regclass, 'pg_class');
            """, (table_name,))
            comment = cur.fetchone()
            if comment and comment[0]:
                schema_doc.append(f"**Description:** {comment[0]}")
                schema_doc.append("")
            
            # Columns table
            schema_doc.append("| Column Name | Data Type | Nullable | Default | Description |")
            schema_doc.append("|------------|-----------|----------|---------|-------------|")
            
            for col in columns:
                col_name, data_type, char_max_len, num_precision, num_scale, nullable, default, pos = col
                
                # Format data type
                if char_max_len:
                    type_str = f"{data_type}({char_max_len})"
                elif num_precision:
                    if num_scale:
                        type_str = f"{data_type}({num_precision},{num_scale})"
                    else:
                        type_str = f"{data_type}({num_precision})"
                else:
                    type_str = data_type
                
                # Get column comment
                cur.execute("""
                    SELECT col_description('public.' || %s::regclass, %s);
                """, (table_name, pos))
                col_comment = cur.fetchone()
                col_desc = col_comment[0] if col_comment and col_comment[0] else ""
                
                default_str = str(default) if default else ""
                nullable_str = "YES" if nullable == "YES" else "NO"
                
                schema_doc.append(f"| `{col_name}` | {type_str} | {nullable_str} | {default_str} | {col_desc} |")
            
            schema_doc.append("")
            
            # Get constraints
            cur.execute("""
                SELECT
                    conname as constraint_name,
                    contype as constraint_type,
                    pg_get_constraintdef(oid) as constraint_definition
                FROM pg_constraint
                WHERE conrelid = 'public.' || %s::regclass
                ORDER BY contype, conname;
            """, (table_name,))
            
            constraints = cur.fetchall()
            if constraints:
                schema_doc.append("**Constraints:**")
                schema_doc.append("")
                for const_name, const_type, const_def in constraints:
                    const_type_map = {
                        'p': 'PRIMARY KEY',
                        'f': 'FOREIGN KEY',
                        'u': 'UNIQUE',
                        'c': 'CHECK'
                    }
                    type_label = const_type_map.get(const_type, const_type)
                    schema_doc.append(f"- **{type_label}:** `{const_name}`")
                    schema_doc.append(f"  ```sql")
                    schema_doc.append(f"  {const_def}")
                    schema_doc.append(f"  ```")
                schema_doc.append("")
            
            # Get indexes
            cur.execute("""
                SELECT
                    indexname,
                    indexdef
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND tablename = %s
                ORDER BY indexname;
            """, (table_name,))
            
            indexes = cur.fetchall()
            if indexes:
                schema_doc.append("**Indexes:**")
                schema_doc.append("")
                for idx_name, idx_def in indexes:
                    schema_doc.append(f"- `{idx_name}`")
                    schema_doc.append(f"  ```sql")
                    schema_doc.append(f"  {idx_def};")
                    schema_doc.append(f"  ```")
                schema_doc.append("")
            
            schema_doc.append("---")
            schema_doc.append("")
        
        # Get all views
        print("👁️  Extracting views...")
        cur.execute("""
            SELECT table_name, view_definition
            FROM information_schema.views
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        views = cur.fetchall()
        
        if views:
            schema_doc.append("## 👁️ Views")
            schema_doc.append("")
            
            for view_name, view_def in views:
                print(f"  👁️  {view_name}")
                schema_doc.append(f"### View: `{view_name}`")
                schema_doc.append("")
                
                # Get view comment
                cur.execute("""
                    SELECT obj_description('public.' || %s::regclass, 'pg_class');
                """, (view_name,))
                comment = cur.fetchone()
                if comment and comment[0]:
                    schema_doc.append(f"**Description:** {comment[0]}")
                    schema_doc.append("")
                
                schema_doc.append("**Definition:**")
                schema_doc.append("```sql")
                schema_doc.append(view_def)
                schema_doc.append("```")
                schema_doc.append("")
                schema_doc.append("---")
                schema_doc.append("")
        
        # Get all functions
        print("⚙️  Extracting functions...")
        cur.execute("""
            SELECT 
                n.nspname as schema,
                p.proname as function_name,
                pg_get_function_arguments(p.oid) as arguments,
                pg_get_function_result(p.oid) as return_type,
                pg_get_functiondef(p.oid) as function_def
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            ORDER BY p.proname;
        """)
        functions = cur.fetchall()
        
        if functions:
            schema_doc.append("## ⚙️ Functions")
            schema_doc.append("")
            
            for schema, func_name, args, ret_type, func_def in functions:
                print(f"  ⚙️  {func_name}({args})")
                schema_doc.append(f"### Function: `{func_name}({args})`")
                schema_doc.append("")
                schema_doc.append(f"**Returns:** `{ret_type}`")
                schema_doc.append("")
                schema_doc.append("**Definition:**")
                schema_doc.append("```sql")
                schema_doc.append(func_def)
                schema_doc.append("```")
                schema_doc.append("")
                schema_doc.append("---")
                schema_doc.append("")
        
        # Get all triggers
        print("🔄 Extracting triggers...")
        cur.execute("""
            SELECT
                trigger_name,
                event_object_table as table_name,
                action_timing,
                event_manipulation,
                action_statement
            FROM information_schema.triggers
            WHERE trigger_schema = 'public'
            ORDER BY event_object_table, trigger_name;
        """)
        triggers = cur.fetchall()
        
        if triggers:
            schema_doc.append("## 🔄 Triggers")
            schema_doc.append("")
            
            current_table = None
            for trig_name, table_name, timing, event, statement in triggers:
                if table_name != current_table:
                    if current_table is not None:
                        schema_doc.append("")
                    schema_doc.append(f"### Table: `{table_name}`")
                    schema_doc.append("")
                    current_table = table_name
                
                print(f"  🔄 {table_name}.{trig_name}")
                schema_doc.append(f"**Trigger:** `{trig_name}`")
                schema_doc.append("")
                schema_doc.append(f"- **Timing:** {timing}")
                schema_doc.append(f"- **Event:** {event}")
                schema_doc.append(f"- **Statement:**")
                schema_doc.append(f"```sql")
                schema_doc.append(statement)
                schema_doc.append("```")
                schema_doc.append("")
            
            schema_doc.append("---")
            schema_doc.append("")
        
        # Get all sequences
        print("🔢 Extracting sequences...")
        cur.execute("""
            SELECT sequence_name, data_type, start_value, increment, maximum_value
            FROM information_schema.sequences
            WHERE sequence_schema = 'public'
            ORDER BY sequence_name;
        """)
        sequences = cur.fetchall()
        
        if sequences:
            schema_doc.append("## 🔢 Sequences")
            schema_doc.append("")
            schema_doc.append("| Sequence Name | Data Type | Start | Increment | Max |")
            schema_doc.append("|--------------|-----------|-------|-----------|-----|")
            
            for seq_name, data_type, start, increment, maximum in sequences:
                print(f"  🔢 {seq_name}")
                schema_doc.append(f"| `{seq_name}` | {data_type} | {start} | {increment} | {maximum} |")
            
            schema_doc.append("")
            schema_doc.append("---")
            schema_doc.append("")
        
        cur.close()
        conn.close()
        
        # Write to file
        output_file = Path("COMPLETE_DATABASE_SCHEMA.md")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("\n".join(schema_doc))
        
        print("")
        print(f"✅ Complete schema documentation generated!")
        print(f"📄 Output file: {output_file.absolute()}")
        print(f"📊 Lines: {len(schema_doc)}")
        
        return True
        
    except ImportError:
        print("❌ psycopg2 not installed. Install with: pip install psycopg2-binary")
        return generate_from_migrations()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        print("")
        print("Falling back to migration-based schema extraction...")
        return generate_from_migrations()

def generate_from_migrations():
    """Fallback: Generate schema from migration files"""
    print("📋 Generating schema documentation from migration files...")
    print("⚠️  Note: This is less complete than direct database query")
    
    # This would parse migration files - for now, just note the limitation
    print("   Use pg_dump or install psycopg2 for complete schema extraction")
    return False

if __name__ == "__main__":
    success = generate_complete_schema_doc()
    sys.exit(0 if success else 1)

