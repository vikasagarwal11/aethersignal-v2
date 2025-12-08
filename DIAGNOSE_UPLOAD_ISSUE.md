# 🔍 Diagnosing Upload Issue

## Current Status
✅ **Notification shows:** "Processing Complete! 1 case(s) created successfully."
❌ **Table shows:** "No signals found"
❌ **KPI cards show:** All zeros

## Quick Diagnostic Steps

### Step 1: Check if Case Exists in Database
**Open in browser:** `http://localhost:8000/api/v1/signals/stats`

**Expected:** Should show `total_cases: 1` (or more)

**If it shows 0:**
- Case wasn't created in database
- Check backend logs for errors
- Verify Supabase connection

---

### Step 2: Check if Signals API Returns Data
**Open in browser:** `http://localhost:8000/api/v1/signals`

**Expected:** Should return JSON array with your signal:
```json
[
  {
    "id": "...",
    "drug": "Aspirin",
    "reaction": "Stomach bleeding",
    "prr": 0.1,
    "cases": 1,
    "priority": "low",
    ...
  }
]
```

**If it returns `[]`:**
- Case exists but signals API isn't aggregating it
- Check if `source` field matches (should be "AI_EXTRACTED")
- Check browser console for API errors

---

### Step 3: Check Browser Console
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for errors (red text)
4. Go to **Network** tab
5. Refresh page (F5)
6. Check the `/api/v1/signals` request:
   - Status should be 200
   - Response should contain data

**Common errors:**
- `CORS error` → Backend CORS not configured
- `Failed to fetch` → Backend not running
- `404 Not Found` → Wrong API URL

---

### Step 4: Manual Refresh
1. Press **F5** or **Ctrl+R** to refresh page
2. Wait a few seconds
3. Check if data appears

**If still empty:**
- Check API directly (Step 2)
- Check database (Step 1)

---

### Step 5: Check Database Directly (Supabase)
**Run in Supabase SQL Editor:**

```sql
-- Check if case was created
SELECT 
    id,
    drug_name,
    reaction,
    source,
    created_at,
    completeness_status,
    validation_passed
FROM pv_cases
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- Should see your case with `drug_name="Aspirin"` and `reaction="Stomach bleeding"`
- `source` should be `"AI_EXTRACTED"`

**If no rows:**
- Case wasn't created
- Check backend logs
- Check file processing status

---

### Step 6: Check File Upload Status
**Open in browser:** `http://localhost:8000/api/v1/files/uploads`

**Expected:** Should show your upload with:
- `upload_status: "completed"`
- `cases_created: 1`
- `status_message: "Processing complete! 1 valid case(s) created successfully."`

**If status is "failed":**
- Check `processing_error` field
- Check backend logs

---

## Common Issues & Fixes

### Issue 1: API Returns Empty Array
**Cause:** Signals API query not finding cases

**Fix:** Check if `source` field matches:
- Cases created have `source="AI_EXTRACTED"`
- API might be filtering by different source
- Try: `http://localhost:8000/api/v1/signals?dataset=AI_EXTRACTED`

---

### Issue 2: Frontend Not Refreshing
**Cause:** `fetchData()` not being called or failing silently

**Fix:**
1. Check browser console for errors
2. Manually refresh page (F5)
3. Check Network tab to see if API call is made

---

### Issue 3: Case Created But Not Aggregated
**Cause:** Signals API aggregates by drug+reaction, might have issue

**Fix:**
1. Check database - case should have `drug_name` and `reaction`
2. Check API response - should aggregate correctly
3. If `drug_name` or `reaction` is "Unknown", it might not aggregate properly

---

### Issue 4: CORS Error
**Cause:** Backend not allowing frontend origin

**Fix:** Check backend CORS configuration in `main.py`

---

## Expected Flow

1. ✅ File uploaded → `upload_status: "queued"`
2. ✅ Processing starts → `upload_status: "processing"`
3. ✅ AI extracts entities → Progress: 30%
4. ✅ Cases created → Progress: 60%
5. ✅ Validation runs → Progress: 90%
6. ✅ Completed → `upload_status: "completed"`, `cases_created: 1`
7. ✅ Frontend calls `fetchData()` → Refreshes signals
8. ✅ Signals API aggregates case → Returns signal
9. ✅ Table displays signal → Shows in UI

**If step 7-9 fail, check API and frontend refresh logic.**

---

## Quick Test Commands

```bash
# Check if backend is running
curl http://localhost:8000/api/v1/signals/stats

# Check signals
curl http://localhost:8000/api/v1/signals

# Check uploads
curl http://localhost:8000/api/v1/files/uploads
```

---

## Next Steps

1. **Run Step 1-6** above
2. **Share the results** - what do you see?
3. **Check backend logs** - any errors?
4. **Check browser console** - any errors?

This will help identify exactly where the issue is!

