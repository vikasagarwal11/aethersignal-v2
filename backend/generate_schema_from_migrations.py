#!/usr/bin/env python3
"""
Generate Complete Schema Documentation from Migration Files
Parses all SQL migration files to extract complete database structure
"""

import os
import sys
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict

def parse_sql_file(file_path: Path):
    """Parse SQL file and extract schema information"""
    content = file_path.read_text(encoding='utf-8')
    
    info = {
        'tables': defaultdict(dict),
        'functions': [],
        'triggers': [],
        'views': [],
        'indexes': defaultdict(list),
        'constraints': defaultdict(list),
        'comments': defaultdict(dict)
    }
    
    # Extract CREATE TABLE statements
    table_pattern = r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\((.*?)\);'
    for match in re.finditer(table_pattern, content, re.DOTALL | re.IGNORECASE):
        table_name = match.group(1)
        table_def = match.group(2)
        
        # Parse columns
        lines = [line.strip() for line in table_def.split('\n') if line.strip()]
        for line in lines:
            if re.match(r'^\w+\s+', line) and not line.upper().startswith(('PRIMARY', 'FOREIGN', 'CONSTRAINT', 'UNIQUE', 'CHECK')):
                # Column definition
                col_match = re.match(r'(\w+)\s+([^,\s]+(?:\s*\([^)]+\))?(?:[^,]+)?)', line)
                if col_match:
                    col_name = col_match.group(1)
                    col_def = col_match.group(2).strip()
                    info['tables'][table_name][col_name] = col_def
    
    # Extract ALTER TABLE ADD COLUMN
    alter_pattern = r"ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+([^;]+?)(?:\s*;|$)"
    for match in re.finditer(alter_pattern, content, re.IGNORECASE | re.MULTILINE):
        table_name = match.group(1)
        col_name = match.group(2)
        col_def = match.group(3).strip()
        # Clean up definition - remove newlines, extra whitespace
        col_def = ' '.join(col_def.split())
        info['tables'][table_name][col_name] = col_def
    
    # Extract CREATE FUNCTION
    func_pattern = r'CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(\w+(?:\([^)]+\))?)\s+(?:.*?)RETURNS\s+([^$\n]+)(.*?)\$\$'
    for match in re.finditer(func_pattern, content, re.DOTALL | re.IGNORECASE):
        func_name = match.group(1)
        returns = match.group(2).strip()
        func_body = match.group(3).strip()
        info['functions'].append({
            'name': func_name,
            'returns': returns,
            'body': func_body
        })
    
    # Extract CREATE TRIGGER
    trigger_pattern = r"CREATE\s+TRIGGER\s+(\w+)\s+(?:.*?)ON\s+(\w+)\s+(?:.*?)EXECUTE\s+FUNCTION\s+(\w+)"
    for match in re.finditer(trigger_pattern, content, re.DOTALL | re.IGNORECASE):
        trigger_name = match.group(1)
        table_name = match.group(2)
        func_name = match.group(3)
        info['triggers'].append({
            'name': trigger_name,
            'table': table_name,
            'function': func_name
        })
    
    # Extract CREATE VIEW
    view_pattern = r'CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(\w+)\s+AS\s+(.*?);'
    for match in re.finditer(view_pattern, content, re.DOTALL | re.IGNORECASE):
        view_name = match.group(1)
        view_def = match.group(2).strip()
        info['views'].append({
            'name': view_name,
            'definition': view_def
        })
    
    # Extract CREATE INDEX
    index_pattern = r"CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(\w+)\s+\(([^)]+)\)(?:.*?WHERE\s+([^)]+))?;"
    for match in re.finditer(index_pattern, content, re.IGNORECASE):
        index_name = match.group(1)
        table_name = match.group(2)
        columns = match.group(3).strip()
        where_clause = match.group(4) if match.group(4) else None
        
        index_def = f"CREATE INDEX {index_name} ON {table_name} ({columns})"
        if where_clause:
            index_def += f" WHERE {where_clause}"
        
        info['indexes'][table_name].append({
            'name': index_name,
            'definition': index_def
        })
    
    # Extract COMMENTS
    comment_pattern = r"COMMENT\s+ON\s+(?:COLUMN\s+(\w+)\.(\w+)|TABLE\s+(\w+))\s+IS\s+'([^']+)'"
    for match in re.finditer(comment_pattern, content, re.IGNORECASE):
        if match.group(1):  # Column comment
            table_name = match.group(1)
            col_name = match.group(2)
            comment = match.group(4)
            if 'columns' not in info['comments'][table_name]:
                info['comments'][table_name]['columns'] = {}
            info['comments'][table_name]['columns'][col_name] = comment
        else:  # Table comment
            table_name = match.group(3)
            comment = match.group(4)
            info['comments'][table_name]['table'] = comment
    
    return info

def generate_complete_schema():
    """Generate complete schema from all migration files"""
    migrations_dir = Path(__file__).parent / "database" / "migrations"
    
    if not migrations_dir.exists():
        print(f"❌ Migrations directory not found: {migrations_dir}")
        return False
    
    print("📊 Generating Complete Schema Documentation from Migration Files...")
    print("")
    
    # Collect all schema information
    all_info = {
        'tables': defaultdict(dict),
        'functions': [],
        'triggers': [],
        'views': [],
        'indexes': defaultdict(list),
        'comments': defaultdict(dict)
    }
    
    # Process all migration files
    migration_files = sorted(migrations_dir.glob("*.sql"))
    print(f"📋 Found {len(migration_files)} migration files")
    print("")
    
    for mig_file in migration_files:
        print(f"  📄 Processing: {mig_file.name}")
        info = parse_sql_file(mig_file)
        
        # Merge tables
        for table_name, columns in info['tables'].items():
            all_info['tables'][table_name].update(columns)
        
        # Merge functions
        all_info['functions'].extend(info['functions'])
        
        # Merge triggers
        all_info['triggers'].extend(info['triggers'])
        
        # Merge views
        all_info['views'].extend(info['views'])
        
        # Merge indexes
        for table_name, indexes in info['indexes'].items():
            all_info['indexes'][table_name].extend(indexes)
        
        # Merge comments
        for table_name, comments in info['comments'].items():
            if table_name not in all_info['comments']:
                all_info['comments'][table_name] = {}
            all_info['comments'][table_name].update(comments)
    
    # Also check schema_reference.sql
    schema_ref = Path(__file__).parent / "database" / "schema_reference.sql"
    if schema_ref.exists():
        print(f"  📄 Processing: {schema_ref.name}")
        info = parse_sql_file(schema_ref)
        for table_name, columns in info['tables'].items():
            all_info['tables'][table_name].update(columns)
    
    print("")
    print("📝 Generating markdown documentation...")
    
    # Generate markdown
    doc = []
    doc.append("# Complete AetherSignal Database Schema Documentation")
    doc.append("")
    doc.append(f"**Generated:** {datetime.now().isoformat()}")
    doc.append("**Source:** Migration files and schema references")
    doc.append("**Database:** PostgreSQL (Supabase)")
    doc.append("")
    doc.append("> ⚠️ **Note:** This document is generated from migration files. For the most up-to-date schema, run `pg_dump --schema-only` against the live database.")
    doc.append("")
    doc.append("---")
    doc.append("")
    
    # Tables section
    doc.append("## 📊 Tables")
    doc.append("")
    
    for table_name in sorted(all_info['tables'].keys()):
        columns = all_info['tables'][table_name]
        print(f"  📊 {table_name} ({len(columns)} columns)")
        
        doc.append(f"### Table: `{table_name}`")
        doc.append("")
        
        # Table comment
        if 'table' in all_info['comments'].get(table_name, {}):
            doc.append(f"**Description:** {all_info['comments'][table_name]['table']}")
            doc.append("")
        
        # Columns table
        doc.append("| Column Name | Definition | Description |")
        doc.append("|------------|------------|-------------|")
        
        for col_name, col_def in sorted(columns.items()):
            col_comment = all_info['comments'].get(table_name, {}).get('columns', {}).get(col_name, "")
            # Clean up definition - remove ADD COLUMN artifacts
            clean_def = col_def.split('ADD COLUMN')[0].strip() if 'ADD COLUMN' in col_def else col_def
            clean_def = ' '.join(clean_def.split())  # Normalize whitespace
            # Limit display length but keep full definition in tooltip
            display_def = clean_def[:100] + ('...' if len(clean_def) > 100 else '')
            doc.append(f"| `{col_name}` | `{display_def}` | {col_comment} |")
        
        doc.append("")
        
        # Indexes for this table
        if table_name in all_info['indexes']:
            doc.append("**Indexes:**")
            doc.append("")
            for idx in all_info['indexes'][table_name]:
                doc.append(f"- `{idx['name']}`")
                doc.append(f"  ```sql")
                doc.append(f"  {idx['definition']};")
                doc.append(f"  ```")
            doc.append("")
        
        doc.append("---")
        doc.append("")
    
    # Functions section
    if all_info['functions']:
        doc.append("## ⚙️ Functions")
        doc.append("")
        
        # Deduplicate functions by name
        seen_functions = {}
        for func in all_info['functions']:
            func_name = func['name'].split('(')[0]
            if func_name not in seen_functions or len(func['body']) > len(seen_functions[func_name]['body']):
                seen_functions[func_name] = func
        
        for func_name, func in sorted(seen_functions.items()):
            print(f"  ⚙️  {func_name}")
            doc.append(f"### Function: `{func['name']}`")
            doc.append("")
            doc.append(f"**Returns:** `{func['returns']}`")
            doc.append("")
            doc.append("**Definition:**")
            doc.append("```sql")
            doc.append(f"CREATE OR REPLACE FUNCTION {func['name']}")
            doc.append(f"RETURNS {func['returns']}")
            doc.append("AS $$")
            doc.append(func['body'])
            doc.append("$$ LANGUAGE plpgsql;")
            doc.append("```")
            doc.append("")
            doc.append("---")
            doc.append("")
    
    # Triggers section
    if all_info['triggers']:
        doc.append("## 🔄 Triggers")
        doc.append("")
        
        triggers_by_table = defaultdict(list)
        for trigger in all_info['triggers']:
            triggers_by_table[trigger['table']].append(trigger)
        
        for table_name in sorted(triggers_by_table.keys()):
            doc.append(f"### Table: `{table_name}`")
            doc.append("")
            
            for trigger in triggers_by_table[table_name]:
                print(f"  🔄 {table_name}.{trigger['name']}")
                doc.append(f"**Trigger:** `{trigger['name']}`")
                doc.append("")
                doc.append(f"- **Function:** `{trigger['function']}()`")
                doc.append("")
            
            doc.append("---")
            doc.append("")
    
    # Views section
    if all_info['views']:
        doc.append("## 👁️ Views")
        doc.append("")
        
        # Deduplicate views
        seen_views = {}
        for view in all_info['views']:
            view_name = view['name']
            if view_name not in seen_views or len(view['definition']) > len(seen_views[view_name]['definition']):
                seen_views[view_name] = view
        
        for view_name, view in sorted(seen_views.items()):
            print(f"  👁️  {view_name}")
            doc.append(f"### View: `{view_name}`")
            doc.append("")
            doc.append("**Definition:**")
            doc.append("```sql")
            doc.append(f"CREATE OR REPLACE VIEW {view_name} AS")
            doc.append(view['definition'])
            doc.append("```")
            doc.append("")
            doc.append("---")
            doc.append("")
    
    # Write to file
    output_file = Path(__file__).parent.parent / "COMPLETE_DATABASE_SCHEMA.md"
    output_file.write_text("\n".join(doc), encoding='utf-8')
    
    print("")
    print(f"✅ Complete schema documentation generated!")
    print(f"📄 Output file: {output_file.absolute()}")
    print(f"📊 Tables: {len(all_info['tables'])}")
    print(f"📊 Functions: {len(seen_functions) if all_info['functions'] else 0}")
    print(f"📊 Triggers: {len(all_info['triggers'])}")
    print(f"📊 Views: {len(seen_views) if all_info['views'] else 0}")
    print(f"📊 Lines: {len(doc)}")
    
    return True

if __name__ == "__main__":
    success = generate_complete_schema()
    sys.exit(0 if success else 1)

