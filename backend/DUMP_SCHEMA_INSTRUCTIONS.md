# Database Schema Dump Instructions

## Option 1: Install PostgreSQL Client Tools and Use pg_dump (Recommended)

### Windows Installation

**Method A: Using Installer**
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install PostgreSQL (includes `pg_dump` in `bin` folder)
3. Add PostgreSQL `bin` folder to your PATH, or use full path

**Method B: Using Chocolatey**
```powershell
choco install postgresql
```

**Method C: Using Winget**
```powershell
winget install PostgreSQL.PostgreSQL
```

### Run pg_dump

After installation, run:

```powershell
cd backend
.\dump_schema_pgdump.ps1
```

Or manually:

```powershell
cd backend
# Load DATABASE_URL from .env
$env:DATABASE_URL = (Get-Content .env | Select-String "DATABASE_URL" | ForEach-Object { $_.Line -replace 'DATABASE_URL=', '' })
pg_dump --schema-only --no-owner --no-privileges "$env:DATABASE_URL" > schema_dump.sql
```

---

## Option 2: Use Supabase Dashboard (No Installation Required)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Run this query to get all table definitions:

```sql
-- Get all tables
SELECT 
    schemaname || '.' || tablename AS full_table_name
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schemaname, tablename;
```

5. For each table, run:
```sql
SELECT pg_get_tabledef('schema.table_name'::regclass);
```

6. Copy the output and save to `schema_dump.sql`

---

## Option 3: Use Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Dump schema
supabase db dump --schema-only > schema_dump.sql
```

---

## Option 4: Direct Connection Script (If Firewall Allows)

If your Supabase project allows direct connections, you can use:

```powershell
cd backend
python dump_schema.py
```

**Note:** This requires `psycopg2` installed: `pip install psycopg2-binary`

---

## Quick Script for Option 1 (After Installing PostgreSQL)

I've created `dump_schema_pgdump.ps1` which will:
- Load DATABASE_URL from .env
- Run pg_dump with schema-only flags
- Output to `schema_dump.sql`

Just run:
```powershell
cd backend
.\dump_schema_pgdump.ps1
```

