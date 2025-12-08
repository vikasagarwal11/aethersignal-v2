# 🎯 COMPATIBLE MIGRATION - Installation Guide

**Enhancing Your Existing Tables for AI Processing**

---

## ✅ **WHAT WE'RE DOING**

We're **enhancing** your existing tables instead of creating new ones:

- ✅ `file_upload_history` → Add AI processing fields
- ✅ `pv_cases` → Add link to files + narrative field
- ✅ Keep all your existing statistics fields
- ✅ No data loss, no conflicts

---

## 📦 **FILES YOU NEED**

1. **MIGRATION_COMPATIBLE.sql** - Database migration
2. **files_compatible.py** - Updated backend code

---

## 🔧 **INSTALLATION STEPS**

### **STEP 1: RUN DATABASE MIGRATION** (5 minutes)

```sql
-- Copy the entire content of MIGRATION_COMPATIBLE.sql
-- Paste into Supabase SQL Editor
-- Click "Run"
```

**What it does:**
- Adds 5 new columns to `file_upload_history`:
  - `file_path` (local storage path)
  - `ai_confidence_score` (0.00-1.00)
  - `progress` (0-100%)
  - `status_message` (for UI display)
  - `cases_created` (synced with total_cases)

- Adds 4 new columns to `pv_cases`:
  - `source_file_id` (links to file_upload_history)
  - `narrative` (AI-generated text)
  - `ai_extracted` (boolean flag)
  - `ai_confidence` (0.00-1.00)

- Creates indexes for performance
- Creates helper view for API
- Keeps all existing fields intact

**Expected output:**
```
✓ All 5 AI columns added to file_upload_history
✓ All 4 AI columns added to pv_cases
```

---

### **STEP 2: UPDATE BACKEND CODE** (3 minutes)

```bash
# Navigate to backend
cd backend

# Replace files.py with compatible version
cp path/to/files_compatible.py app/api/files.py

# Restart backend
python app/main.py
```

**Changes in backend:**
- Uses `file_upload_history` instead of `uploaded_files`
- Uses `cases_created` field
- Uses `progress` (0-100) for real-time updates
- Uses `status_message` for UI display
- Links pv_cases via `source_file_id`

---

### **STEP 3: VERIFY EVERYTHING WORKS** (2 minutes)

```bash
# Check API docs
# Visit: http://localhost:8000/docs

# Should see:
# - POST /api/v1/files/upload
# - GET  /api/v1/files/status/{file_id}
```

**Test query:**
```sql
-- Verify new columns exist
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'file_upload_history'
  AND column_name IN ('file_path', 'ai_confidence_score', 'progress', 'status_message', 'cases_created')
ORDER BY column_name;

-- Should return 5 rows
```

---

## 📊 **FIELD MAPPING**

### **Your Existing Fields → AI Processing Fields**

| Existing Field | AI Processing Field | Notes |
|----------------|---------------------|-------|
| `upload_status` | Same | Already perfect |
| `total_cases` | `cases_created` | Synced automatically |
| `processing_error` | Same | Already perfect |
| `uploaded_at` | Same | Already perfect |
| **NEW** | `file_path` | Local file storage |
| **NEW** | `ai_confidence_score` | AI confidence |
| **NEW** | `progress` | 0-100% |
| **NEW** | `status_message` | UI message |

### **pv_cases Mapping**

| Your Field | AI Field | Notes |
|------------|----------|-------|
| `age`, `age_yrs` | Same | AI populates age |
| `sex`, `gender` | Same | AI populates sex |
| **NEW** | `source_file_id` | Links to file |
| **NEW** | `narrative` | AI-generated |
| **NEW** | `ai_extracted` | TRUE for AI cases |
| **NEW** | `ai_confidence` | 0.00-1.00 |

---

## 🔄 **HOW THE SYNC WORKS**

The migration includes a trigger that keeps fields synchronized:

```sql
-- When you update cases_created:
UPDATE file_upload_history 
SET cases_created = 5 
WHERE id = 'xxx';

-- Trigger automatically updates:
-- total_cases = 5

-- And vice versa!
```

**This means:**
- Backend can use `cases_created`
- Your existing code can still use `total_cases`
- They always match ✅

---

## 🧪 **TESTING**

### **Test 1: Upload a File**

1. Visit http://localhost:3001/signals
2. Click "Upload Data"
3. Upload test PDF
4. Check database:

```sql
SELECT 
    id,
    filename,
    upload_status,
    progress,
    status_message,
    cases_created,
    total_cases,
    ai_confidence_score
FROM file_upload_history
ORDER BY uploaded_at DESC
LIMIT 1;
```

**Expected:**
- `upload_status` = 'completed'
- `progress` = 100
- `cases_created` = number
- `total_cases` = same number (synced!)
- `ai_confidence_score` = 0.50-1.00

---

### **Test 2: Check Created Cases**

```sql
SELECT 
    id,
    drug_name,
    reaction,
    narrative,
    ai_extracted,
    ai_confidence,
    source_file_id
FROM pv_cases
WHERE source_file_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- `ai_extracted` = TRUE
- `ai_confidence` = 0.50-1.00
- `source_file_id` = matches file_upload_history.id
- `narrative` = AI-generated text

---

## 🎯 **ADVANTAGES OF THIS APPROACH**

### **vs Creating New Tables:**

✅ **Uses your existing schema**
- No data migration needed
- Preserves all statistics fields
- Works with existing code

✅ **Maintains backward compatibility**
- Old queries still work
- total_cases synced with cases_created
- Can gradually migrate code

✅ **Professional structure**
- Follows your naming conventions
- Uses your UUID pattern
- Matches your RLS policies

---

## 🐛 **TROUBLESHOOTING**

### **Problem: Migration fails with "column already exists"**

**Solution:**
```sql
-- Check which columns already exist
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'file_upload_history'
  AND column_name IN ('file_path', 'ai_confidence_score', 'progress', 'status_message', 'cases_created');

-- The migration uses IF NOT EXISTS, so this shouldn't happen
-- But if it does, manually drop and re-add:
ALTER TABLE file_upload_history DROP COLUMN file_path;
-- Then re-run migration
```

---

### **Problem: Backend can't find file_upload_history**

**Symptoms:**
```
sqlalchemy.exc.ProgrammingError: relation "file_upload_history" does not exist
```

**Solution:**
```bash
# Verify table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'file_upload_history';

# If it doesn't exist, your database is different than expected
# Contact me and I'll create a fresh migration
```

---

### **Problem: cases_created and total_cases not syncing**

**Solution:**
```sql
-- Check if trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'file_upload_history';

-- Should see: sync_file_upload_cases_trigger

-- If not, create it:
CREATE TRIGGER sync_file_upload_cases_trigger
    BEFORE UPDATE ON file_upload_history
    FOR EACH ROW
    EXECUTE FUNCTION sync_file_upload_cases();
```

---

## ✅ **VERIFICATION CHECKLIST**

After installation:

```
□ Migration SQL run successfully
□ 5 new columns in file_upload_history
□ 4 new columns in pv_cases
□ Trigger created (sync_file_upload_cases_trigger)
□ View created (file_processing_status)
□ Indexes created
□ Backend code updated (files.py)
□ Backend restarts without errors
□ /docs shows upload endpoints
□ Can upload test file
□ Status endpoint returns progress
□ Cases created with source_file_id
```

---

## 🎉 **SUCCESS CRITERIA**

You'll know it works when:

1. **Upload a PDF**
   ```
   POST /api/v1/files/upload
   → Returns file_id
   ```

2. **Check status**
   ```
   GET /api/v1/files/status/{file_id}
   → Shows progress 0% → 100%
   ```

3. **Check database**
   ```sql
   SELECT * FROM file_upload_history 
   WHERE id = 'file_id';
   -- Shows: progress=100, cases_created=3
   
   SELECT * FROM pv_cases 
   WHERE source_file_id = 'file_id';
   -- Shows: 3 cases with narratives
   ```

---

## 📋 **WHAT TO DO NEXT**

After migration completes:

1. **Test upload flow** (Step 3 above)
2. **Take screenshots** showing:
   - Database with new columns
   - Upload progress
   - Created cases

3. **Report back:**
   ```
   ✅ Migration complete!
   ✅ Uploaded test file
   ✅ X cases created
   ✅ Ready for frontend integration
   ```

---

## 💬 **NEED HELP?**

If anything fails:

1. **Check Supabase logs** (Database → Logs)
2. **Check backend logs** (terminal running python)
3. **Share error message** with me
4. **Share query results** from verification queries

---

## 🚀 **AFTER THIS WORKS**

Next steps:
1. ✅ Frontend already ready (Week 5 signals page)
2. ✅ Backend migration complete (now)
3. ⏳ Connect them and test (next)
4. ⏳ Demo to first beta user!

---

**Run the migration now!** Copy MIGRATION_COMPATIBLE.sql to Supabase SQL Editor and execute! 🎯
