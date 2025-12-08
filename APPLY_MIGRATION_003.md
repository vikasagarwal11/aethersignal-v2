# 🚀 Apply Migration 003: Validation Fields

## ✅ **Migration File Ready**

The migration has been copied to:
- `backend/database/migrations/003_validation_fields.sql`

---

## 📋 **How to Apply**

### **Option 1: Supabase SQL Editor (Recommended)**

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste**
   - Open: `backend/database/migrations/003_validation_fields.sql`
   - Copy ALL the SQL content
   - Paste into Supabase SQL Editor

4. **Run the Migration**
   - Click "Run" or press `Ctrl+Enter`
   - Wait for completion (should take 5-10 seconds)

5. **Verify Success**
   - Check for "Success" message
   - Run the verification query at the bottom of the migration file
   - Expected output:
     ```
     pv_cases: 9 new columns
     file_upload_history: 3 new columns
     ```

---

### **Option 2: psql Command Line**

```bash
# Connect to your database
psql "postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres"

# Run the migration
\i backend/database/migrations/003_validation_fields.sql

# Or copy-paste the SQL directly
```

---

### **Option 3: Python Script (Automated)**

```python
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(supabase_url, supabase_key)

# Read migration file
with open("backend/database/migrations/003_validation_fields.sql", "r") as f:
    sql = f.read()

# Execute migration (requires direct database connection)
# Note: Supabase Python client doesn't support raw SQL execution
# You'll need to use psycopg2 or similar for this
```

---

## ✅ **What Gets Added**

### **pv_cases Table (12 new fields):**
- `completeness_status` - Status tracking
- `missing_fields` - JSONB array
- `validation_errors` - JSONB array
- `validation_passed` - Boolean
- `requires_manual_review` - Boolean
- `reviewed_at` - Timestamp
- `reviewed_by` - UUID
- `reviewer_notes` - Text
- `reporter_type` - Text
- `reporter_country` - Text
- `reporter_qualification` - Text
- `drug_start_date` - Date
- `drug_end_date` - Date
- `receipt_date` - Date
- `patient_initials` - Text

### **file_upload_history Table (3 new fields):**
- `total_valid_cases` - Integer
- `total_invalid_cases` - Integer
- `validation_summary` - JSONB

### **Database Objects:**
- 3 indexes for performance
- 1 trigger function
- 1 trigger
- 1 view: `incomplete_cases_review`

---

## 🔍 **Verification Queries**

After applying, run these to verify:

```sql
-- Check new columns in pv_cases
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'pv_cases' 
  AND column_name IN (
    'completeness_status', 'missing_fields', 'validation_errors',
    'validation_passed', 'requires_manual_review', 'reporter_type',
    'drug_start_date', 'patient_initials'
  )
ORDER BY column_name;

-- Check new columns in file_upload_history
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'file_upload_history' 
  AND column_name IN (
    'total_valid_cases', 'total_invalid_cases', 'validation_summary'
  )
ORDER BY column_name;

-- Test the view
SELECT COUNT(*) as incomplete_cases_count
FROM incomplete_cases_review;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'pv_cases'
  AND indexname LIKE 'idx_pv_cases%';
```

---

## ⚠️ **Important Notes**

1. **Safe to Run Multiple Times**
   - Uses `IF NOT EXISTS` clauses
   - Won't duplicate columns or objects

2. **No Data Loss**
   - All new fields have defaults
   - Existing data remains intact

3. **Backward Compatible**
   - Existing code will continue to work
   - New fields are optional

4. **Performance**
   - Indexes are created for common queries
   - Trigger updates stats automatically

---

## 🐛 **Troubleshooting**

### **Error: "column already exists"**
- This is normal if migration was already run
- Migration uses `IF NOT EXISTS`, so it's safe to ignore

### **Error: "permission denied"**
- Make sure you're using `SUPABASE_SERVICE_KEY` (not anon key)
- Service key has full database access

### **Error: "relation does not exist"**
- Make sure migrations 001 and 002 were applied first
- Check that `pv_cases` and `file_upload_history` tables exist

---

## ✅ **Success Indicators**

After running, you should see:
- ✅ No errors in SQL editor
- ✅ Verification query shows 9 columns in pv_cases
- ✅ Verification query shows 3 columns in file_upload_history
- ✅ View `incomplete_cases_review` is accessible
- ✅ Indexes are created (check with `\d pv_cases` in psql)

---

**Migration Status:** Ready to apply  
**Risk Level:** Low (uses IF NOT EXISTS, backward compatible)  
**Estimated Time:** 5-10 seconds

