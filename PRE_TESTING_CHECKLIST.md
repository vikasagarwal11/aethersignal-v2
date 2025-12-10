# ✅ Pre-Testing Checklist

**Date:** December 9, 2024  
**Before testing, verify these items:**

---

## 🔍 **1. VERIFY SUPABASE COLUMN NAMES** ⚠️ **CRITICAL**

The `metrics_provider` assumes these column names. **Check if they match your actual schema:**

### **Current Assumptions:**
```python
# In metrics_provider.py, line ~50-80:
- drug_name          # Drug name column
- reaction           # OR event_term (adverse event/reaction)
- is_serious         # Boolean for serious events
- event_date         # OR report_date (date of event/report)
- age_yrs            # Patient age in years
- outcome            # Event outcome (optional)
```

### **How to Check:**
1. Look at your Supabase `pv_cases` table schema
2. Compare with assumptions above
3. If different, update `backend/app/core/signal_detection/metrics_provider.py`

### **Example Fix:**
If your column is `drug` instead of `drug_name`:
```python
# Change this:
query = query.ilike("drug_name", f"%{drug}%")

# To this:
query = query.ilike("drug", f"%{drug}%")
```

---

## 🔍 **2. VERIFY ENVIRONMENT VARIABLES** ⚠️ **CRITICAL**

Make sure these are set:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key  # OR SUPABASE_ANON_KEY
```

**Check:**
- Are these set in your `.env` file?
- Are they loaded when the app starts?
- Does Supabase connection work?

---

## 🔍 **3. CHECK TABLE NAME** ⚠️ **IMPORTANT**

The code assumes table name: `pv_cases`

**If your table has a different name:**
- Update in `metrics_provider.py` line ~50:
```python
query = supabase_client.table("your_table_name").select("*")
```

---

## 🔍 **4. VERIFY DATA EXISTS** ⚠️ **IMPORTANT**

Make sure you have test data:
- At least a few cases with "warfarin" and "bleeding"
- Or other drug/reaction combinations for testing

**Quick check:**
```sql
SELECT COUNT(*) FROM pv_cases WHERE drug_name ILIKE '%warfarin%' AND reaction ILIKE '%bleeding%';
```

---

## 🔍 **5. CHECK FDA TERMINOLOGY FILE** ✅ **SHOULD BE OK**

The terminology mapper loads from:
```
data/fda_adverse_event_codes_merged.json
```

**Verify:**
- File exists: ✅ (we created it earlier)
- File is readable: Should be OK
- Size: ~2.1 MB (14,921 terms)

---

## 📋 **QUICK VERIFICATION SCRIPT**

Run this to check your setup:

```python
# test_setup.py
import os
from supabase import create_client

# Check env vars
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("❌ ERROR: SUPABASE_URL or SUPABASE_KEY not set!")
    exit(1)

# Connect to Supabase
supabase = create_client(supabase_url, supabase_key)

# Check table exists and get column names
try:
    result = supabase.table("pv_cases").select("*").limit(1).execute()
    if result.data:
        print("✅ Table 'pv_cases' exists")
        print(f"✅ Columns: {list(result.data[0].keys())}")
        
        # Check for expected columns
        expected = ["drug_name", "reaction", "is_serious", "event_date"]
        actual = list(result.data[0].keys())
        
        missing = [col for col in expected if col not in actual]
        if missing:
            print(f"⚠️  Missing columns: {missing}")
            print(f"   Actual columns: {actual}")
        else:
            print("✅ All expected columns found!")
    else:
        print("⚠️  Table exists but is empty")
except Exception as e:
    print(f"❌ ERROR: {e}")
    print("   Check table name and permissions")
```

---

## 🎯 **ACTION ITEMS**

### **Before Testing:**

1. ⚠️ **Check Supabase column names** (5 minutes)
   - Look at your `pv_cases` table schema
   - Compare with assumptions in `metrics_provider.py`
   - Update if different

2. ⚠️ **Verify environment variables** (2 minutes)
   - Check `.env` file
   - Verify Supabase connection works

3. ⚠️ **Check table name** (1 minute)
   - Verify table is called `pv_cases`
   - Update if different

4. ✅ **Verify test data exists** (2 minutes)
   - Check you have data for testing
   - At least "warfarin + bleeding" or similar

### **Total Time:** ~10 minutes

---

## ✅ **AFTER VERIFICATION**

Once you've checked the above, you're ready to test:

```bash
POST /api/v1/ai/query
{
  "query": "Rank signals for warfarin and bleeding"
}
```

---

## 🚨 **COMMON ISSUES**

### **Issue: "Column not found"**
- **Fix:** Update column names in `metrics_provider.py`

### **Issue: "Table not found"**
- **Fix:** Update table name in `metrics_provider.py`

### **Issue: "No signals found"**
- **Check:** Do you have data for that drug/reaction?
- **Check:** Are column names correct?
- **Check:** Are filters too restrictive?

---

## 📝 **SUMMARY**

**Critical Checks:**
1. ⚠️ Supabase column names match
2. ⚠️ Environment variables set
3. ⚠️ Table name correct
4. ✅ Test data exists

**Time:** ~10 minutes to verify everything

**Then:** Ready to test! 🚀

