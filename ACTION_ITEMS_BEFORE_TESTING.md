# ✅ Action Items Before Testing

**Date:** December 9, 2024  
**Status:** ✅ Column name mismatch fixed

---

## ✅ **ALREADY FIXED**

### **1. Column Name Mismatch** ✅
- **Issue:** Code used `is_serious`, schema has `serious`
- **Fix:** Updated `metrics_provider.py` to use `serious`
- **Status:** ✅ **FIXED**

### **2. Column Names Verified** ✅
Based on your schema (`00_schema.sql`), these match:
- ✅ `drug_name` - Matches
- ✅ `reaction` - Matches
- ✅ `serious` - Fixed (was `is_serious`)
- ✅ `event_date` - Matches
- ✅ `age_yrs` - Matches
- ✅ `outcome` - Matches

---

## ⚠️ **REMAINING ACTIONS (5 minutes)**

### **1. Verify Environment Variables** (2 minutes)

Check your `.env` file or environment:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key  # OR SUPABASE_ANON_KEY
```

**Quick test:**
```python
import os
print("SUPABASE_URL:", os.getenv("SUPABASE_URL") is not None)
print("SUPABASE_KEY:", os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY") is not None)
```

---

### **2. Verify Test Data Exists** (2 minutes)

Check if you have data for testing:
```sql
-- In Supabase SQL editor:
SELECT COUNT(*) FROM pv_cases 
WHERE drug_name ILIKE '%warfarin%' 
  AND reaction ILIKE '%bleeding%';
```

**Or check any data exists:**
```sql
SELECT COUNT(*) FROM pv_cases;
SELECT drug_name, reaction, serious 
FROM pv_cases 
LIMIT 5;
```

---

### **3. Quick Connection Test** (1 minute)

Test Supabase connection works:
```python
# Quick test script
from supabase import create_client
import os

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
)

result = supabase.table("pv_cases").select("id", count="exact").limit(1).execute()
print(f"✅ Connection works! Table has {result.count if hasattr(result, 'count') else '?'} rows")
```

---

## ✅ **SUMMARY**

**What's Done:**
- ✅ Column names fixed (`serious` instead of `is_serious`)
- ✅ All column names verified against your schema
- ✅ Code matches your database structure

**What's Left:**
- ⚠️ Verify environment variables (2 min)
- ⚠️ Check test data exists (2 min)
- ⚠️ Quick connection test (1 min)

**Total Time:** ~5 minutes

**Then:** Ready to test! 🚀

---

## 🧪 **TEST COMMAND**

Once verified, test with:
```bash
POST /api/v1/ai/query
{
  "query": "Rank signals for warfarin and bleeding"
}
```

**Expected:** Ranked signals with fusion scores! 🎉

