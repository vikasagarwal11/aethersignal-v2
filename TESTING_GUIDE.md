# 🧪 Complete Testing Guide

## 📋 Frontend Pages

### 1. Home Page
**URL:** `http://localhost:3000`

**Tests:**
- ✅ Page loads without errors
- ✅ Navigation bar is visible with logo
- ✅ Links work correctly

---

### 2. Signals Explorer Page
**URL:** `http://localhost:3000/signals`

**Tests:**
- ✅ Page loads and displays UI
- ✅ KPI cards show (may be 0 if no data)
- ✅ Data table displays (may show "No signals found")
- ✅ Search bar works (try typing)
- ✅ "Upload Data" button opens dialog
- ✅ Navigation links work (Home, Signals)
- ✅ User menu dropdown works
- ✅ Export button (disabled when no selection)
- ✅ Generate Report button

---

## 📡 Backend API Endpoints

### 1. Signals Stats API
**URL:** `http://localhost:8000/api/v1/signals/stats`

**Expected Response:**
```json
{
  "total_cases": 0,
  "critical_signals": 0,
  "serious_events": 0,
  "unique_drugs": 0,
  "unique_reactions": 0
}
```

**Test:** Open in browser, should see JSON response

---

### 2. Signals List API
**URL:** `http://localhost:8000/api/v1/signals`

**Expected Response:**
```json
[]
```
(Empty array if no data, or array of signal objects if data exists)

**Test:** Should return array, even if empty

---

### 3. Datasets API
**URL:** `http://localhost:8000/api/v1/signals/datasets`

**Expected Response:**
```json
{
  "datasets": ["FAERS", "AI_EXTRACTED", ...]
}
```

**Test:** Should return available data sources

---

### 4. File Status API
**URL:** `http://localhost:8000/api/v1/files/status/{file_id}`

**Note:** Get `file_id` from upload response or database

**Expected Response:**
```json
{
  "file_id": "...",
  "filename": "test.txt",
  "status": "completed",
  "progress": 100,
  "message": "Processing complete! 1 valid case(s) created successfully.",
  "cases_created": 1
}
```

**Test:** Check status during processing

---

### 5. List Uploads API
**URL:** `http://localhost:8000/api/v1/files/uploads`

**Expected Response:**
```json
[
  {
    "id": "...",
    "filename": "test.txt",
    "upload_status": "completed",
    "cases_created": 1,
    ...
  }
]
```

**Test:** See upload history

---

## 📤 File Upload Testing

### Test 1: Complete Case (Should Pass Validation)

**File:** `test_complete.txt`
```
Patient: John Smith, 45 years old, male
Drug: Aspirin 100mg daily started on Jan 1, 2024
Adverse Event: Stomach bleeding
Onset Date: January 15, 2024
Reported by: Dr. Jane Doe
```

**Steps:**
1. Go to `http://localhost:3000/signals`
2. Click "Upload Data" button
3. Select `test_complete.txt`
4. Watch progress bar
5. Wait for completion

**Expected Results:**
- ✅ Status message: "Processing complete! 1 valid case(s) created successfully. All cases meet ICH E2B minimum criteria."
- ✅ Case appears in signals table
- ✅ KPI cards update (total_cases increases)
- ✅ Database: `completeness_status='complete'`, `validation_passed=true`

---

### Test 2: Incomplete Case (Should Flag for Review)

**File:** `test_incomplete.txt`
```
Patient took Lipitor
Had muscle pain
```

**Steps:**
1. Go to `http://localhost:3000/signals`
2. Click "Upload Data" button
3. Select `test_incomplete.txt`
4. Watch progress bar
5. Wait for completion

**Expected Results:**
- ✅ Status message: "Found 1 potential case(s) but they need more information. Missing: patient demographics (age/sex), dates. Cases have been saved as 'incomplete' for manual review."
- ✅ Case saved but flagged for review
- ✅ Database: `completeness_status='incomplete'`, `requires_manual_review=true`
- ✅ `missing_fields` contains: `["patient_identification", "date_information"]`

---

### Test 3: No Cases Found

**File:** `test_faq.txt`
```
Frequently Asked Questions
Q: What is Aspirin?
A: Aspirin is a pain reliever.
```

**Steps:**
1. Upload `test_faq.txt`
2. Wait for processing

**Expected Results:**
- ✅ Status message: "No adverse event cases found. Files should contain patient information, drug names, and adverse reactions to create valid case reports."
- ✅ No cases created
- ✅ `cases_created=0` in database

---

### Test 4: Multiple Files Upload

**Steps:**
1. Go to `http://localhost:3000/signals`
2. Click "Upload Data" button
3. Select multiple files (Ctrl+Click or Shift+Click)
4. Upload all at once

**Expected Results:**
- ✅ Each file shows individual progress bar
- ✅ All files process in sequence
- ✅ Status updates for each file
- ✅ All cases appear in signals table
- ✅ KPI cards reflect total cases

---

### Test 5: Mixed Results (Some Valid, Some Incomplete)

**Files:**
- `test_complete.txt` (from Test 1)
- `test_incomplete.txt` (from Test 2)

**Steps:**
1. Upload both files together
2. Wait for processing

**Expected Results:**
- ✅ Status message: "Processing complete! Created 1 valid case(s). 1 case(s) need additional information and are flagged for review."
- ✅ Both cases appear in table
- ✅ One marked as complete, one as incomplete

---

## 🔍 Database Verification

### Check Cases Table
**Run in Supabase SQL Editor:**

```sql
SELECT 
    drug_name, 
    reaction, 
    completeness_status, 
    validation_passed, 
    requires_manual_review,
    missing_fields
FROM pv_cases 
ORDER BY created_at DESC 
LIMIT 10;
```

**Expected:**
- Complete cases: `completeness_status='complete'`, `validation_passed=true`, `requires_manual_review=false`
- Incomplete cases: `completeness_status='incomplete'` or `'pending_review'`, `validation_passed=false`, `requires_manual_review=true`
- `missing_fields` is JSON array: `["patient_identification", "date_information"]`

---

### Check File Upload History
**Run in Supabase SQL Editor:**

```sql
SELECT 
    filename, 
    upload_status, 
    cases_created, 
    total_valid_cases, 
    total_invalid_cases, 
    status_message
FROM file_upload_history 
ORDER BY uploaded_at DESC 
LIMIT 5;
```

**Expected:**
- ✅ `status_message` shows smart validation messages
- ✅ `total_valid_cases` and `total_invalid_cases` are populated
- ✅ `upload_status` is 'completed' or 'failed'

---

## 🎯 Quick Test Checklist

- [ ] Frontend loads: `http://localhost:3000`
- [ ] Signals page loads: `http://localhost:3000/signals`
- [ ] API stats endpoint works: `http://localhost:8000/api/v1/signals/stats`
- [ ] API signals endpoint works: `http://localhost:8000/api/v1/signals`
- [ ] Upload complete case → validation passes
- [ ] Upload incomplete case → flagged for review
- [ ] Upload multiple files → all process correctly
- [ ] Database shows correct validation status
- [ ] Status messages are user-friendly
- [ ] KPI cards update after uploads
- [ ] Signals table displays data

---

## 🐛 Troubleshooting

**If API returns empty array:**
- Check backend is running: `cd backend; python run.py`
- Check browser console for errors (F12)
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

**If upload fails:**
- Check backend logs for errors
- Verify Anthropic API key is set (for AI extraction)
- Check Supabase connection

**If validation not working:**
- Verify migration 003 ran successfully
- Check database has validation fields
- Restart backend after code changes

---

## ✅ Success Criteria

All tests pass when:
1. ✅ Frontend displays correctly
2. ✅ API endpoints return data
3. ✅ File uploads work
4. ✅ Validation messages are clear
5. ✅ Database stores validation results correctly
6. ✅ UI updates after processing

