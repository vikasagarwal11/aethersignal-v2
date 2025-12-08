# Database Schema Check Results

## 📊 **TABLES FOUND**

### ✅ **file_upload_history**
- **Status:** EXISTS
- **Rows:** 0 (empty, not being used yet)
- **Created:** Unknown (table is empty)

### ❌ **uploaded_files**
- **Status:** DOES NOT EXIST
- **Action Needed:** Create this table OR enhance existing `file_upload_history`

### ✅ **pv_cases**
- **Status:** EXISTS
- **Rows:** 0 (empty, not being used yet)

---

## 📋 **PV_CASES TABLE STRUCTURE**

Based on `backup/aethersignal/database/00_schema.sql`:

### **All Columns:**
- `id` (UUID PRIMARY KEY)
- `user_id` (UUID, references auth.users)
- `organization` (TEXT)
- `case_id` (TEXT)
- `primaryid` (TEXT)
- `drug_name` (TEXT)
- `drug_count` (INTEGER)
- `reaction` (TEXT)
- `reaction_count` (INTEGER)
- `age` (NUMERIC)
- `age_yrs` (NUMERIC)
- `sex` (TEXT)
- `gender` (TEXT)
- `country` (TEXT)
- `serious` (BOOLEAN)
- `seriousness` (TEXT)
- `onset_date` (DATE)
- `event_date` (DATE)
- `report_date` (DATE)
- `receive_date` (DATE)
- `outcome` (TEXT)
- `source` (TEXT, default: 'FAERS')
- `raw_data` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### **Specific Column Checks:**

| Column | Status | Notes |
|--------|--------|-------|
| `source_file_id` | ❌ **NOT FOUND** | Does not exist in schema |
| `narrative` | ❌ **NOT FOUND** | Does not exist in schema |
| `patient_age` | ❌ **NOT FOUND** | Has `age` and `age_yrs` instead |
| `patient_sex` | ❌ **NOT FOUND** | Has `sex` and `gender` instead |

### **Similar Fields Found:**
- ✅ `age` / `age_yrs` (instead of `patient_age`)
- ✅ `sex` / `gender` (instead of `patient_sex`)
- ❌ No `source_file_id` field
- ❌ No `narrative` field

---

## 📋 **FILE_UPLOAD_HISTORY TABLE STRUCTURE**

Based on `backup/aethersignal/database/08_file_upload_history.sql`:

### **All Columns:**
- `id` (UUID PRIMARY KEY)
- `user_id` (UUID, references auth.users)
- `organization` (TEXT)
- `filename` (TEXT)
- `file_size_bytes` (BIGINT)
- `file_hash_md5` (TEXT)
- `file_type` (TEXT)
- `uploaded_at` (TIMESTAMP)
- `upload_status` (TEXT, default: 'processing')
- `total_cases` (INTEGER)
- `total_events` (INTEGER)
- `total_drugs` (INTEGER)
- `total_serious_cases` (INTEGER)
- `total_fatal_cases` (INTEGER)
- `earliest_date` (DATE)
- `latest_date` (DATE)
- `source` (TEXT, default: 'FAERS')
- `processing_started_at` (TIMESTAMP)
- `processing_completed_at` (TIMESTAMP)
- `processing_error` (TEXT)
- `stats_calculated_at` (TIMESTAMP)
- `stats_status` (TEXT, default: 'pending')
- `metadata` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### **Status:**
- ✅ Table exists
- ⚠️ Empty (0 rows)
- ⚠️ Not being used yet
- ✅ Has comprehensive statistics tracking
- ❌ Missing AI-specific fields (`file_path`, `ai_confidence_score`, `cases_created`)

---

## 🎯 **COMPATIBILITY ASSESSMENT**

### **PV_CASES Table:**
- ✅ Table exists
- ⚠️ Missing `source_file_id` - **NEEDED for linking cases to uploaded files**
- ⚠️ Missing `narrative` - **NEEDED for AI-generated case narratives**
- ✅ Has `age`/`age_yrs` (similar to `patient_age`)
- ✅ Has `sex`/`gender` (similar to `patient_sex`)

### **FILE_UPLOAD_HISTORY Table:**
- ✅ Table exists
- ✅ Has comprehensive statistics
- ❌ Missing `file_path` (for local file storage)
- ❌ Missing `ai_confidence_score` (for AI processing)
- ⚠️ Has `total_cases` but new table uses `cases_created` (can use either)

---

## 📋 **RECOMMENDATIONS**

### **Option 1: Enhance Existing Tables (RECOMMENDED)**

#### **1. Add missing fields to `pv_cases`:**
```sql
ALTER TABLE pv_cases 
ADD COLUMN IF NOT EXISTS source_file_id UUID REFERENCES file_upload_history(id),
ADD COLUMN IF NOT EXISTS narrative TEXT;
```

#### **2. Add AI fields to `file_upload_history`:**
```sql
ALTER TABLE file_upload_history 
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence_score NUMERIC,
ADD COLUMN IF NOT EXISTS cases_created INTEGER DEFAULT 0;
```

#### **3. Update backend code:**
- Use `file_upload_history` instead of `uploaded_files`
- Use `total_cases` or `cases_created` (both available)
- Link cases to files via `source_file_id`

**Benefits:**
- ✅ Keep existing statistics
- ✅ Keep company-level RLS policies
- ✅ No duplicate tables
- ✅ Add AI features to existing structure

---

### **Option 2: Create New Tables**

#### **1. Create `uploaded_files` table:**
- Run `backend/database/migrations/001_uploaded_files.sql`

#### **2. Add missing fields to `pv_cases`:**
```sql
ALTER TABLE pv_cases 
ADD COLUMN IF NOT EXISTS source_file_id UUID REFERENCES uploaded_files(id),
ADD COLUMN IF NOT EXISTS narrative TEXT;
```

**Benefits:**
- ✅ Simpler structure
- ✅ Focused on AI processing
- ⚠️ Two tables for similar purpose

---

## 🔧 **ACTION ITEMS**

1. **Decide on approach:**
   - [ ] Option 1: Enhance existing `file_upload_history`
   - [ ] Option 2: Create new `uploaded_files`

2. **Add missing fields to `pv_cases`:**
   - [ ] Add `source_file_id` column
   - [ ] Add `narrative` column

3. **Update backend code:**
   - [ ] Update `backend/app/api/files.py` to use chosen table
   - [ ] Update case creation to set `source_file_id`
   - [ ] Update case creation to set `narrative`

4. **Test:**
   - [ ] Upload a file
   - [ ] Verify file record created
   - [ ] Verify cases linked via `source_file_id`
   - [ ] Verify `narrative` populated

---

## 📝 **SQL MIGRATION SCRIPT**

If choosing Option 1 (enhance existing), here's the migration:

```sql
-- Add missing fields to pv_cases
ALTER TABLE pv_cases 
ADD COLUMN IF NOT EXISTS source_file_id UUID REFERENCES file_upload_history(id),
ADD COLUMN IF NOT EXISTS narrative TEXT;

-- Add AI fields to file_upload_history
ALTER TABLE file_upload_history 
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence_score NUMERIC,
ADD COLUMN IF NOT EXISTS cases_created INTEGER DEFAULT 0;

-- Add index for source_file_id lookups
CREATE INDEX IF NOT EXISTS idx_pv_cases_source_file_id ON pv_cases(source_file_id);
```

---

## ✅ **SUMMARY**

- ✅ `file_upload_history` exists (empty, ready to use)
- ❌ `uploaded_files` does not exist
- ✅ `pv_cases` exists (empty, ready to use)
- ⚠️ `pv_cases` missing `source_file_id` and `narrative`
- ⚠️ `file_upload_history` missing AI fields

**Recommendation:** Enhance existing tables (Option 1) to keep all existing functionality while adding AI features.

