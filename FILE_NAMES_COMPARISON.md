# 📋 File Names Comparison: Claude's Request vs What We Have

**Date:** December 9, 2024

---

## 🔍 **CLAUDE'S REQUESTED FILES**

### **From Claude's Feedback:**

1. **`fda_term_mapper.py`** (or similar)
   - Location: `backend/app/core/terminology/`
   - Purpose: Map user terms → FDA Preferred Terms

2. **`query_router.py`**
   - Location: `backend/app/core/signal_detection/`
   - Purpose: Bridge NLP → Fusion engine

3. **Structured Intent Spec Model**
   - New file (not specified name)
   - Purpose: LLM-based intent parsing

---

## ✅ **WHAT WE ACTUALLY HAVE**

### **1. Terminology Mapper**

**Claude Requested:** `fda_term_mapper.py`  
**We Have:** `fda_mapper.py` ✅

**Location:** `backend/app/core/terminology/fda_mapper.py`

**Status:**
- ✅ File exists
- ✅ Class name: `FDATerminologyMapper` (matches Claude's intent)
- ⏳ Implementation: Skeleton with placeholders

**Note:** Different filename (`fda_mapper.py` vs `fda_term_mapper.py`), but same purpose. Our name is shorter and clearer.

---

### **2. Query Router**

**Claude Requested:** `query_router.py`  
**We Have:** `query_router.py` ✅

**Location:** `backend/app/core/signal_detection/query_router.py`

**Status:**
- ✅ File exists
- ✅ Class name: `QueryRouter` (matches Claude's intent)
- ⏳ Implementation: Skeleton with placeholders

**Note:** Exact match! ✅

---

### **3. Structured Intent Spec**

**Claude Requested:** Not specified (new file)  
**We Have:** ❌ Not created yet

**Should Create:** `backend/app/core/nlp/intent_parser.py` (or similar)

**Status:**
- ❌ File doesn't exist
- ⏳ Needs to be created

---

## 🔍 **BONUS: EXISTING TERMINOLOGY MAPPER**

### **Found:** `MedicalTerminologyMapper` in `semantic_chat_engine.py`

**Location:** `backend/app/api/semantic_chat_engine.py`

**What it does:**
- Drug class expansion (anticoagulants → [warfarin, apixaban, ...])
- Event synonyms mapping
- Age group mapping
- Geographic region mapping

**Status:**
- ✅ Already implemented
- ⚠️ Different purpose than `FDATerminologyMapper`
- ⚠️ Uses hardcoded dictionaries (not FAERS data)

**Relationship:**
- `MedicalTerminologyMapper` = General medical terminology (drug classes, age groups, etc.)
- `FDATerminologyMapper` = FDA Preferred Terms mapping (reactions/events)

**Recommendation:** Keep both, they serve different purposes:
- `MedicalTerminologyMapper` → Drug classes, age groups, geography
- `FDATerminologyMapper` → Reaction/event mapping to FDA PTs

---

## 📊 **SUMMARY TABLE**

| Claude's Request | Our File | Status | Notes |
|------------------|----------|--------|-------|
| `fda_term_mapper.py` | `fda_mapper.py` | ✅ Exists | Different name, same purpose |
| `query_router.py` | `query_router.py` | ✅ Exists | Exact match |
| Structured Intent Spec | ❌ None | ⏳ Missing | Needs creation |
| - | `MedicalTerminologyMapper` | ✅ Exists | Bonus: Different purpose |

---

## 🎯 **RECOMMENDATIONS**

### **1. Keep `fda_mapper.py` Name**
- ✅ Shorter and clearer
- ✅ Already created
- ✅ Same functionality as Claude's `fda_term_mapper.py`
- **Action:** No change needed

### **2. Keep `query_router.py` Name**
- ✅ Exact match with Claude's request
- ✅ Already created
- **Action:** No change needed

### **3. Create Structured Intent Spec**
- **Suggested Name:** `intent_parser.py`
- **Location:** `backend/app/core/nlp/intent_parser.py`
- **Action:** Create new file

### **4. Keep Both Terminology Mappers**
- `MedicalTerminologyMapper` → Drug classes, age, geography
- `FDATerminologyMapper` → FDA Preferred Terms (reactions)
- **Action:** Use both, they complement each other

---

## ✅ **CONCLUSION**

**We have:**
- ✅ `fda_mapper.py` (Claude's `fda_term_mapper.py` equivalent)
- ✅ `query_router.py` (exact match)
- ✅ `MedicalTerminologyMapper` (bonus, different purpose)
- ❌ Structured Intent Spec (needs creation)

**All file names are correct and serve the intended purpose!** ✅

