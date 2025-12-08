# 🔍 Check if Data Exists in Database

## 📊 Tables to Check

### 1. **pv_cases** Table (Main Cases Data)
**This is where individual cases are stored**

**SQL Query:**
```sql
SELECT 
    id,
    drug_name,
    reaction,
    age,
    sex,
    serious,
    source,
    completeness_status,
    validation_passed,
    requires_manual_review,
    created_at
FROM pv_cases
ORDER BY created_at DESC
LIMIT 20;
```

**What to look for:**
- ✅ Cases with `drug_name` and `reaction` populated
- ✅ `source` should be `"AI_EXTRACTED"` for uploaded files
- ✅ `completeness_status` should be `"complete"` or `"incomplete"`
- ✅ `validation_passed` should be `true` or `false`

---

### 2. **file_upload_history** Table (Upload Records)
**This tracks all file uploads and their processing status**

**SQL Query:**
```sql
SELECT 
    id,
    filename,
    upload_status,
    cases_created,
    total_valid_cases,
    total_invalid_cases,
    status_message,
    progress,
    uploaded_at,
    processing_completed_at
FROM file_upload_history
ORDER BY uploaded_at DESC
LIMIT 10;
```

**What to look for:**
- ✅ `upload_status` should be `"completed"` for successful uploads
- ✅ `cases_created` should match number of cases created
- ✅ `status_message` should show validation results
- ✅ `total_valid_cases` and `total_invalid_cases` should be populated

---

### 3. **Check Counts**
**Quick count queries:**

```sql
-- Total cases
SELECT COUNT(*) as total_cases FROM pv_cases;

-- Cases by source
SELECT source, COUNT(*) as count 
FROM pv_cases 
GROUP BY source;

-- Cases by validation status
SELECT 
    completeness_status,
    validation_passed,
    COUNT(*) as count
FROM pv_cases
GROUP BY completeness_status, validation_passed;
```

---

## 🎯 Expected Results

### If Files Were Uploaded Successfully:

**file_upload_history:**
- Should have records for each uploaded file
- `upload_status = "completed"`
- `cases_created > 0`
- `status_message` contains validation results

**pv_cases:**
- Should have cases with:
  - `drug_name` (e.g., "Aspirin", "Lipitor")
  - `reaction` (e.g., "Stomach bleeding", "Muscle pain")
  - `source = "AI_EXTRACTED"`
  - `created_at` timestamps

---

## ❓ Why Data Might Not Show on Screen

### Issue 1: Signals API Not Aggregating
**Problem:** Cases exist but signals API returns empty array

**Check:**
```sql
-- See if cases have proper drug_name and reaction
SELECT drug_name, reaction, COUNT(*) 
FROM pv_cases 
WHERE drug_name IS NOT NULL 
  AND reaction IS NOT NULL
GROUP BY drug_name, reaction;
```

**If this returns data but API doesn't:**
- Check API query filters
- Check if `source` field matches
- Check browser console for API errors

---

### Issue 2: Frontend Not Refreshing
**Problem:** Data exists but UI doesn't update

**Fix:**
1. Refresh page (F5)
2. Check browser console (F12) for errors
3. Check Network tab - is API call made?
4. Check API response - does it contain data?

---

### Issue 3: Data Format Issue
**Problem:** Cases created but with wrong format

**Check:**
```sql
-- Check for cases with "Unknown" values
SELECT 
    drug_name,
    reaction,
    COUNT(*) as count
FROM pv_cases
WHERE drug_name = 'Unknown' OR reaction = 'Unknown'
GROUP BY drug_name, reaction;
```

**If many "Unknown" values:**
- AI extraction might not be working
- Check backend logs
- Check Anthropic API key

---

## 🔧 Quick Diagnostic Queries

### Check Recent Uploads:
```sql
SELECT 
    f.filename,
    f.upload_status,
    f.cases_created,
    f.status_message,
    COUNT(c.id) as actual_cases
FROM file_upload_history f
LEFT JOIN pv_cases c ON c.source_file_id = f.id
WHERE f.uploaded_at > NOW() - INTERVAL '1 hour'
GROUP BY f.id, f.filename, f.upload_status, f.cases_created, f.status_message
ORDER BY f.uploaded_at DESC;
```

### Check Signal Aggregation:
```sql
-- This mimics what the signals API does
SELECT 
    drug_name as drug,
    reaction,
    COUNT(*) as cases,
    SUM(CASE WHEN serious THEN 1 ELSE 0 END) as serious_count
FROM pv_cases
WHERE drug_name IS NOT NULL 
  AND reaction IS NOT NULL
  AND drug_name != 'Unknown'
  AND reaction != 'Unknown'
GROUP BY drug_name, reaction
ORDER BY cases DESC
LIMIT 10;
```

---

## ✅ Success Indicators

**Data exists if:**
1. ✅ `pv_cases` table has rows
2. ✅ `file_upload_history` shows completed uploads
3. ✅ Cases have `drug_name` and `reaction` populated
4. ✅ Signals API returns data when called directly
5. ✅ Stats API shows `total_cases > 0`

**If all above are true but UI shows empty:**
- Frontend refresh issue
- Check browser console
- Manual refresh (F5) should fix it

