# 🚀 Manual Migration 003 Application Guide

## ✅ **Status: Ready to Apply Manually**

The automated script encountered connection issues, so we'll apply this manually via Supabase SQL Editor.

---

## 📋 **Step-by-Step Instructions**

### **Step 1: Open Supabase SQL Editor**

1. Go to: **https://supabase.com/dashboard**
2. Select your project: `scrksfxnkxmvvdzwmqnc`
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"** button (top right)

---

### **Step 2: Copy Migration SQL**

**File Location:** `backend/database/migrations/003_validation_fields.sql`

**Quick Access:**
- Open the file in your editor
- Select All (Ctrl+A)
- Copy (Ctrl+C)

---

### **Step 3: Paste and Run**

1. **Paste** the SQL into the Supabase SQL Editor
2. **Click "Run"** button (or press `Ctrl+Enter`)
3. **Wait 5-10 seconds** for execution

---

### **Step 4: Verify Success**

After running, you should see:

✅ **Success message** in the results panel

✅ **Verification query results:**
```
pv_cases: 9 new columns
file_upload_history: 3 new columns
```

---

## 📄 **Migration File Contents**

The migration file is located at:
```
backend/database/migrations/003_validation_fields.sql
```

**Total Size:** ~163 lines
**What it does:**
- Adds 12 validation fields to `pv_cases` table
- Adds 3 validation stats fields to `file_upload_history` table
- Creates 3 indexes for performance
- Creates 1 trigger function
- Creates 1 view: `incomplete_cases_review`

---

## ✅ **What Gets Added**

### **pv_cases Table (12 new fields):**
- `completeness_status` - Status tracking (complete, incomplete, etc.)
- `missing_fields` - JSONB array of missing fields
- `validation_errors` - JSONB array of errors
- `validation_passed` - Boolean flag
- `requires_manual_review` - Boolean flag
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
- `total_valid_cases` - Integer count
- `total_invalid_cases` - Integer count
- `validation_summary` - JSONB summary

---

## 🔍 **Verification Queries**

After applying, you can run these to verify:

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

---

## 🐛 **Troubleshooting**

### **Error: "column already exists"**
- ✅ This is normal if migration was already run
- Migration uses `IF NOT EXISTS`, so it's safe to ignore

### **Error: "permission denied"**
- Make sure you're logged into Supabase dashboard
- SQL Editor has full access to your database

### **Error: "relation does not exist"**
- Make sure migrations 001 and 002 were applied first
- Check that `pv_cases` and `file_upload_history` tables exist

---

## 📊 **Expected Results**

After successful application:

✅ **12 new columns** in `pv_cases` table  
✅ **3 new columns** in `file_upload_history` table  
✅ **3 indexes** created for performance  
✅ **1 trigger** created for auto-updating stats  
✅ **1 view** created: `incomplete_cases_review`

---

## 🎯 **Next Steps After Migration**

Once migration is applied:

1. ✅ Database schema is updated
2. ⏳ Backend code can use new validation fields
3. ⏳ Frontend can display completeness status
4. ⏳ Validation logic can be implemented

---

**Migration File:** `backend/database/migrations/003_validation_fields.sql`  
**Estimated Time:** 2-3 minutes  
**Risk Level:** Low (uses IF NOT EXISTS, backward compatible)

