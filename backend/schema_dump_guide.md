# Quick Guide: Dump Database Schema

Since `pg_dump` is not currently installed on your system, here are your options:

## ✅ Recommended: Install PostgreSQL Client Tools

1. **Download PostgreSQL** (includes pg_dump):
   - https://www.postgresql.org/download/windows/
   - Or use: `choco install postgresql`

2. **After installation, run**:
   ```powershell
   cd backend
   .\dump_schema_pgdump.ps1
   ```

## 📋 Alternative: Use Supabase SQL Editor

1. Go to: https://app.supabase.com → Your Project → SQL Editor
2. Run queries to get schema:
   ```sql
   -- Get table definitions
   SELECT pg_get_tabledef('public.user_profiles'::regclass);
   SELECT pg_get_tabledef('public.pv_cases'::regclass);
   -- ... repeat for all tables
   ```
3. Copy output to `schema_dump.sql`

## 🔧 Manual Command (After Installing PostgreSQL)

```powershell
cd backend
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('DATABASE_URL'))" | ForEach-Object {
    pg_dump --schema-only --no-owner --no-privileges $_ > schema_dump.sql
}
```

---

**Current Status:**
- ❌ pg_dump not installed
- ✅ DATABASE_URL exists in .env
- ✅ Scripts created for when pg_dump is available

Choose an option above to proceed!

