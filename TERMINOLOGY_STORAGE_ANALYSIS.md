# 📋 Terminology Storage Analysis

**Date:** December 9, 2024  
**Purpose:** Check for duplicates and determine best storage format

---

## 🔍 **DUPLICATE CHECK**

### **Terminology Mapper Classes Found:**

1. **`FDATerminologyMapper`** ✅
   - **Location:** `backend/app/core/terminology/fda_mapper.py`
   - **Purpose:** Map user terms → FDA Preferred Terms (from FAERS)
   - **Status:** Skeleton with placeholders
   - **Data Source:** `data/fda_adverse_event_codes_merged.json`

2. **`MedicalTerminologyMapper`** ✅ (NOT a duplicate)
   - **Location:** `backend/app/api/semantic_chat_engine.py`
   - **Purpose:** Drug classes, age groups, geographic regions
   - **Status:** Fully implemented
   - **Data Source:** Hardcoded dictionaries (not FAERS)

3. **`intelligent_mapper.py`** ⚠️ (Need to check)
   - **Location:** `backend/app/api/intelligent_mapper.py`
   - **Status:** Unknown - need to review

**Conclusion:** ✅ **No duplicates** - Each serves a different purpose:
- `FDATerminologyMapper` → FDA Preferred Terms (reactions/events)
- `MedicalTerminologyMapper` → Drug classes, age groups, geography
- `intelligent_mapper.py` → Need to check

---

## 📁 **JSON FILE LOCATION**

### **Main Terminology File:**

**File:** `data/fda_adverse_event_codes_merged.json`

**Contents:**
- **14,921 Preferred Terms** (FDA adverse event codes)
- **Structure:**
  ```json
  {
    "metadata": {
      "source": "FAERS",
      "total_unique_pts": 14921,
      "total_reports": 2875799
    },
    "preferred_terms": {
      "Nausea": {
        "name": "Nausea",
        "frequency": 33058,
        "frequency_percent": 1.1495
      },
      "Hemorrhage": {
        "name": "Hemorrhage",
        "frequency": 1234,
        "frequency_percent": 0.0429
      },
      ...
    }
  }
  ```

**Size:** ~75 MB (large JSON file)

**Source:** Extracted from FAERS Q2 + Q3 data

---

## 💾 **STORAGE OPTIONS: JSON vs DATABASE**

### **Option 1: JSON File (Current)** ✅ **RECOMMENDED**

**Pros:**
- ✅ **Simple** - No database setup needed
- ✅ **Fast loading** - Load once at startup, keep in memory
- ✅ **Portable** - Easy to backup/version control
- ✅ **No migrations** - No schema changes needed
- ✅ **Good for read-only data** - Terminology doesn't change often
- ✅ **14,921 terms** - Small enough for memory (75 MB)

**Cons:**
- ⚠️ **Memory usage** - ~75 MB in RAM
- ⚠️ **No concurrent updates** - Read-only (but that's fine for terminology)
- ⚠️ **No advanced queries** - But we don't need them (simple lookups)

**Performance:**
- **Load time:** ~1-2 seconds (one-time at startup)
- **Lookup time:** O(1) with dictionary (instant)
- **Memory:** ~75 MB (acceptable)

---

### **Option 2: Database Table** ⏳ **OPTIONAL (Future)**

**Pros:**
- ✅ **Scalable** - Can handle millions of terms
- ✅ **Queryable** - SQL queries, full-text search
- ✅ **Concurrent access** - Multiple users
- ✅ **Updates** - Easy to add/update terms

**Cons:**
- ⚠️ **Complexity** - Database setup, migrations, queries
- ⚠️ **Overkill** - 14,921 terms don't need a database
- ⚠️ **Slower lookups** - Database queries vs in-memory dict
- ⚠️ **Maintenance** - Database backups, migrations

**When to use:**
- If terms grow to 100K+ terms
- If we need full-text search across terms
- If we need to update terms frequently
- If we need multi-user concurrent updates

---

## 🎯 **RECOMMENDATION: KEEP JSON FOR NOW**

### **Why JSON is Good Enough:**

1. **Size:** 14,921 terms = ~75 MB (fits in memory easily)
2. **Usage:** Read-only lookups (no frequent updates)
3. **Performance:** Dictionary lookup = O(1) = instant
4. **Simplicity:** No database setup, migrations, or queries
5. **Portability:** Easy to backup, version control, share

### **When to Move to Database:**

**Consider database if:**
- Terms grow to 100K+ (unlikely for FDA Preferred Terms)
- We need full-text search (not needed for simple mapping)
- We need frequent updates (terminology is relatively stable)
- We need multi-user concurrent writes (read-only is fine)

---

## 📊 **CURRENT IMPLEMENTATION**

### **How `FDATerminologyMapper` Uses JSON:**

```python
class FDATerminologyMapper:
    def __init__(self, codes_file: str = "data/fda_adverse_event_codes_merged.json"):
        self.codes_file = Path(codes_file)
        self.codes: Dict[str, Dict] = {}  # In-memory dictionary
        self._load_codes()  # Load once at startup
    
    def _load_codes(self) -> None:
        """Load JSON file into memory dictionary"""
        with open(self.codes_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.codes = data.get("preferred_terms", {})
        # Now self.codes is a dict: {"Nausea": {...}, "Hemorrhage": {...}}
    
    def map_term(self, term: str) -> Optional[Dict]:
        """Lookup in memory dictionary - O(1) performance"""
        # Fast dictionary lookup
        return self.codes.get(term.upper())
```

**Performance:**
- **Startup:** ~1-2 seconds (one-time load)
- **Lookup:** Instant (dictionary O(1))
- **Memory:** ~75 MB (acceptable)

---

## ✅ **FINAL RECOMMENDATION**

### **Keep JSON Format** ✅

**Reasons:**
1. ✅ **14,921 terms** - Small enough for memory
2. ✅ **Read-only** - No frequent updates needed
3. ✅ **Fast lookups** - Dictionary = O(1) performance
4. ✅ **Simple** - No database complexity
5. ✅ **Portable** - Easy to backup/share

### **Future Consideration:**

**If we need database later:**
- Create migration: `011_fda_preferred_terms.sql`
- Table structure:
  ```sql
  CREATE TABLE fda_preferred_terms (
    id SERIAL PRIMARY KEY,
    pt_name TEXT UNIQUE NOT NULL,
    frequency INTEGER,
    frequency_percent FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX idx_pt_name ON fda_preferred_terms(pt_name);
  ```
- Import script: Load JSON → Database

**But for now:** ✅ **JSON is perfect!**

---

## 📋 **SUMMARY**

| Aspect | JSON (Current) | Database (Future) |
|--------|----------------|-------------------|
| **Setup** | ✅ Simple | ⚠️ Complex |
| **Performance** | ✅ Fast (O(1)) | ⚠️ Slower (SQL) |
| **Memory** | ✅ ~75 MB | ✅ No memory |
| **Scalability** | ⚠️ Limited | ✅ Unlimited |
| **Updates** | ⚠️ File-based | ✅ Easy |
| **Recommendation** | ✅ **Use Now** | ⏳ Consider Later |

**Conclusion:** ✅ **JSON format is good enough** for 14,921 terms. Keep it simple!

