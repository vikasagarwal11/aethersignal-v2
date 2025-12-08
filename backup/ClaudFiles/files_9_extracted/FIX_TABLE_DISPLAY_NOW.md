# 🔥 URGENT FIX: Show Cases in Table (2 MINUTES)

## 🔴 **THE PROBLEM**

You have 31 cases in the database but they're not showing in the frontend!

**Root cause:**
- Frontend filters by `dataset="faers"` 
- Your cases have `source="AI_EXTRACTED"`
- Backend doesn't handle `dataset="all"` properly

---

## ⚡ **QUICK FIX (2 MINUTES)**

### **STEP 1: Update Backend (1 minute)**

Replace `backend/app/api/signals.py` with the fixed version:

```bash
cd backend
cp app/api/signals.py app/api/signals.py.backup  # Backup
# Copy the fixed version from phase1-accelerated/signals-FIXED.py
```

**Key changes:**
- Line 31: `if dataset and dataset != "all"` (was missing)
- Line 97: Same fix
- Line 189: Return dataset list with AI_EXTRACTED

---

### **STEP 2: Restart Backend (30 seconds)**

```bash
cd backend
# Kill current process (Ctrl+C)
python app/main.py
```

---

### **STEP 3: Refresh Frontend (10 seconds)**

```bash
# In browser
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

---

## ✅ **EXPECTED RESULT**

After these 2 steps, you should see:

**Frontend:**
- ✅ 31 signals showing in table
- ✅ Stats showing: Total Cases = 31
- ✅ Drugs: Aspirin, Lipitor, Warfarin, etc.
- ✅ Can click on rows (drill-down)

**Dataset Dropdown:**
- ✅ "All" (default - shows everything)
- ✅ "AI Extracted" (your uploaded cases)
- ✅ "FAERS" (if you have FAERS data)

---

## 🧪 **VERIFY IT WORKED**

### **Test 1: Check API directly**

```bash
curl http://localhost:8000/api/v1/signals?limit=10
```

Should return JSON with 10 signals.

### **Test 2: Check stats**

```bash
curl http://localhost:8000/api/v1/signals/stats
```

Should show:
```json
{
  "total_cases": 31,
  "critical_signals": 3,
  "serious_events": X,
  "unique_drugs": Y,
  "unique_reactions": Z
}
```

### **Test 3: Check frontend**

Visit `localhost:3000/signals` → Should see table with 31 rows

---

## 🆘 **TROUBLESHOOTING**

### **Still shows "No signals found"**

**Check backend logs:**
```bash
# In backend terminal, look for errors
# Should see: "INFO: GET /api/v1/signals"
```

**Check browser console:**
```bash
# Press F12 → Console tab
# Look for API errors
```

**Try direct API test:**
```bash
# Open browser
# Go to: http://localhost:8000/docs
# Try GET /api/v1/signals
```

---

### **Shows 0 cases in stats**

**Check database connection:**
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM pv_cases;
-- Should return 31
```

**Check backend .env:**
```bash
# Verify these are set:
SUPABASE_URL=your-url
SUPABASE_ANON_KEY=your-key
```

---

### **API returns empty array**

**Check if query is working:**
```bash
# Add debug logging to signals.py
print(f"Query result: {result.data}")
```

---

## 📥 **FILES YOU NEED**

1. [signals-FIXED.py](computer:///mnt/user-data/outputs/phase1-accelerated/signals-FIXED.py) ← Copy to `backend/app/api/signals.py`

---

## 🎯 **DO THIS RIGHT NOW**

```bash
# Step 1
cd backend
cp app/api/signals.py app/api/signals.py.backup

# Step 2  
# Download signals-FIXED.py and copy to app/api/signals.py

# Step 3
python app/main.py

# Step 4
# Refresh browser (Ctrl+Shift+R)
```

---

## ✅ **SUCCESS CHECKLIST**

```
□ Backend restarted successfully
□ No errors in backend logs
□ API docs show endpoints (http://localhost:8000/docs)
□ Stats API returns total_cases=31
□ Signals API returns array of 31 items
□ Frontend shows 31 rows in table
□ Can search/filter cases
□ Stats cards show correct numbers
```

---

**This should take 2 minutes total!**

Do this now and your cases will appear! 🚀

---

## 💬 **AFTER IT WORKS**

Once you see the 31 cases:
1. ✅ Take a screenshot
2. ✅ Try searching for "Aspirin"
3. ✅ Click on a row (will need drill-down modal next)
4. ✅ Upload another file to test
5. ✅ Report success!

Then we continue with:
- Multi-file upload
- Case detail modal
- ICH E2B validation
- Home page fix
