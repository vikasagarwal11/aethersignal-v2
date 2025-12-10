# 🔍 PLACEHOLDER Implementation Guide

**Date:** December 9, 2024  
**Purpose:** Quick reference for finding and implementing placeholder code

---

## 🔍 **HOW TO FIND PLACEHOLDERS**

### **Search Pattern:**
```bash
# Search for all placeholders
grep -r "PLACEHOLDER" backend/
grep -r "TODO: PLACEHOLDER" backend/
```

### **Or in VS Code:**
- Press `Ctrl+Shift+F` (Windows) or `Cmd+Shift+F` (Mac)
- Search for: `PLACEHOLDER`
- Or search for: `TODO: PLACEHOLDER`

---

## 📋 **PLACEHOLDER LOCATIONS**

### **1. Terminology Mapper** ⏳ **PENDING**

**File:** `backend/app/core/terminology/fda_mapper.py`

**Placeholders:**
- `_load_codes()` - Load FDA codes from JSON
- `map_term()` - Map user term → FDA Preferred Term
- `search_terms()` - Search for matching PTs
- `get_synonyms()` - Get synonyms for a PT
- `batch_map()` - Batch mapping

**Status:** ⏳ Skeleton created, needs implementation  
**Effort:** 2-3 hours  
**Priority:** High

---

### **2. Query Router** ⏳ **PENDING**

**File:** `backend/app/core/signal_detection/query_router.py`

**Placeholders:**
- `__init__()` - Initialize mapper and fusion engine
- `run_query()` - Main routing pipeline
- `_build_candidate_list()` - Build candidate signals
- `_generate_explanation()` - Generate explanations
- `route_nlp_to_fusion()` - Direct filter routing

**Status:** ⏳ Skeleton created, needs implementation  
**Effort:** 3-4 hours  
**Priority:** High

---

### **3. NLP Parser Integration** ⏳ **PENDING**

**File:** `backend/app/api/ai_query.py`

**Placeholders:**
- `process_query()` - Integration point for query router
- `detect_query_intent()` - Terminology mapper integration

**Status:** ⏳ Integration points marked, needs implementation  
**Effort:** 1-2 hours  
**Priority:** Medium

---

## 🎯 **IMPLEMENTATION ORDER**

### **Step 1: Terminology Mapper** (2-3 hours)
1. Implement `_load_codes()` - Load JSON file
2. Implement `map_term()` - Exact + partial + fuzzy matching
3. Implement `search_terms()` - Search functionality
4. Test with sample terms

### **Step 2: Query Router** (3-4 hours)
1. Implement `_build_candidate_list()` - Query database/DataFrame
2. Implement `run_query()` - Full pipeline
3. Implement `_generate_explanation()` - Explanation generation
4. Test end-to-end flow

### **Step 3: NLP Integration** (1-2 hours)
1. Integrate terminology mapper into NLP parser
2. Add query router option to `process_query()`
3. Test with sample queries

---

## 📝 **PLACEHOLDER PATTERNS**

### **Pattern 1: Function Placeholder**
```python
def function_name():
    """
    PLACEHOLDER: Description of what needs to be implemented.
    
    TODO: PLACEHOLDER - Implement:
    1. Step 1
    2. Step 2
    3. Step 3
    """
    # TODO: PLACEHOLDER - Implementation code here
    logger.warning("PLACEHOLDER: function_name() not implemented yet")
    return None
```

### **Pattern 2: Class Placeholder**
```python
class ClassName:
    """
    PLACEHOLDER: Description of what needs to be implemented.
    """
    def __init__(self):
        # TODO: PLACEHOLDER - Initialize components
        logger.warning("PLACEHOLDER: ClassName initialized but not fully implemented")
```

### **Pattern 3: Integration Point**
```python
# PLACEHOLDER: Future integration point
# TODO: PLACEHOLDER - Add integration here
# if condition:
#     from module import Class
#     instance = Class()
```

---

## ✅ **CHECKLIST FOR IMPLEMENTATION**

### **When Implementing Terminology Mapper:**

- [ ] Load codes from JSON file
- [ ] Implement exact match (case-insensitive)
- [ ] Implement partial match (contains/substring)
- [ ] Implement fuzzy matching (spelling variations)
- [ ] Implement synonym detection
- [ ] Add confidence scoring
- [ ] Test with sample terms
- [ ] Remove placeholder comments

### **When Implementing Query Router:**

- [ ] Initialize terminology mapper
- [ ] Initialize fusion engine
- [ ] Implement candidate list building
- [ ] Implement fusion engine calls
- [ ] Implement ranking logic
- [ ] Implement explanation generation
- [ ] Test end-to-end flow
- [ ] Remove placeholder comments

### **When Integrating:**

- [ ] Add terminology mapper to NLP parser
- [ ] Add query router option to API endpoint
- [ ] Test with sample queries
- [ ] Remove placeholder comments

---

## 🔍 **SEARCH COMMANDS**

### **Find All Placeholders:**
```bash
# PowerShell
Select-String -Path "backend\**\*.py" -Pattern "PLACEHOLDER" -Recurse

# Or grep
grep -r "PLACEHOLDER" backend/
```

### **Find Specific Placeholder:**
```bash
# Find terminology mapper placeholders
grep -r "PLACEHOLDER.*terminology\|PLACEHOLDER.*mapper" backend/

# Find query router placeholders
grep -r "PLACEHOLDER.*router\|PLACEHOLDER.*query" backend/
```

---

## 📊 **STATUS SUMMARY**

| Component | File | Status | Placeholders |
|-----------|------|--------|--------------|
| **Terminology Mapper** | `fda_mapper.py` | ⏳ Skeleton | 5 methods |
| **Query Router** | `query_router.py` | ⏳ Skeleton | 5 methods |
| **NLP Integration** | `ai_query.py` | ⏳ Marked | 2 points |

---

## 🎯 **QUICK START**

1. **Search for placeholders:**
   ```bash
   grep -r "PLACEHOLDER" backend/
   ```

2. **Pick a placeholder to implement** (start with terminology mapper)

3. **Remove placeholder comments** when done

4. **Test implementation**

5. **Move to next placeholder**

---

**Status:** ✅ **Skeletons created, ready for implementation!**  
**Search:** Use `PLACEHOLDER` or `TODO: PLACEHOLDER` to find all pending work

