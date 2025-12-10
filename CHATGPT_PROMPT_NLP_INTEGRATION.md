# 🤖 **PROMPT FOR CHATGPT: NLP INTEGRATION**

**Date:** December 9, 2024  
**Purpose:** Initial draft implementation of Enhanced NLP Integration

---

## 📋 **CONTEXT**

I have a pharmacovigilance platform (AetherSignal) with:

1. **Current NLP System** (`backend/app/api/ai_query.py`):
   - Basic intent detection (count, list, show)
   - Basic drug extraction (regex)
   - Direct database queries
   - ❌ **Missing:** Event extraction, terminology mapping, fusion integration, advanced filtering

2. **Delivered Enhanced NLP** (in `backup/ClaudFiles/files (28)/`):
   - `enhanced_nlp_integration.py` - Full-featured NLP parser
   - `enhanced_ai_query_api.py` - Enhanced API endpoints
   - ✅ **Has:** Event extraction, FDA terminology mapping, fusion integration, advanced filtering

3. **Existing Infrastructure:**
   - ✅ `FDATerminologyMapper` (`backend/app/core/terminology/fda_mapper.py`)
   - ✅ `QueryRouter` (`backend/app/core/signal_detection/query_router.py`)
   - ✅ `CompleteFusionEngine` (`backend/app/core/signal_detection/complete_fusion_engine.py`)

---

## 🎯 **TASK**

**Implement Option A: Hybrid Approach** (4 hours)

**What to do:**
1. Copy enhanced files from backup to active codebase
2. Fix imports to match current codebase structure
3. Integrate into main app (add router)
4. Add smart routing (simple queries → current, complex → enhanced)
5. Ensure backward compatibility

---

## 📁 **FILES TO REVIEW**

### **Current Implementation:**
- `backend/app/api/ai_query.py` - Current basic NLP
- `backend/app/core/signal_detection/query_router.py` - Verify class names
- `backend/app/core/terminology/fda_mapper.py` - Verify class name
- `backend/app/main.py` - For router integration

### **Backup Files (to integrate):**
- `backup/ClaudFiles/files (28)/enhanced_nlp_integration.py`
- `backup/ClaudFiles/files (28)/enhanced_ai_query_api.py`

---

## 🔧 **SPECIFIC TASKS**

### **Task 1: Fix Imports in `enhanced_nlp_integration.py`**

**Current imports (likely wrong):**
```python
from app.core.terminology.fda_terminology_mapper import FDATerminologyMapper
from app.core.signal_detection.query_router import (
    QueryRouter,
    AdverseEventQuery,  # Need to verify actual class name
    TimeWindow,
    QueryResult
)
```

**What to check:**
1. Read `backend/app/core/terminology/fda_mapper.py` - verify class name is `FDATerminologyMapper`
2. Read `backend/app/core/signal_detection/query_router.py` - verify actual class names:
   - Is it `AdverseEventQuery` or `SignalQuerySpec`?
   - Is it `TimeWindow` or something else?
   - Is it `QueryResult` or `FusionResultSummary`?
3. Update imports to match actual class names

---

### **Task 2: Fix Imports in `enhanced_ai_query_api.py`**

**Current imports (likely wrong):**
```python
from app.core.terminology.fda_terminology_mapper import FDATerminologyMapper
from app.core.signal_detection.enhanced_nlp_integration import (
    process_natural_language_query
)
```

**What to check:**
1. Verify `FDATerminologyMapper` import path
2. Verify `process_natural_language_query` function exists in `enhanced_nlp_integration.py`
3. Update imports accordingly

---

### **Task 3: Integrate into Main App**

**In `backend/app/main.py`:**
```python
# Add import
from app.api import enhanced_ai_query_api

# Add router (ensure no conflicts)
app.include_router(
    enhanced_ai_query_api.router,
    prefix="/api/v1/ai",
    tags=["Enhanced AI"]
)
```

**Endpoints should be:**
- Current: `POST /api/v1/ai/query` (basic)
- Enhanced: `POST /api/v1/ai/enhanced/query` (full features)

**Check for conflicts:**
- Ensure router prefixes don't conflict
- Ensure endpoint paths don't conflict

---

### **Task 4: Add Smart Routing (Optional but Recommended)**

**In `backend/app/api/ai_query.py`:**

Add function to detect if query needs enhanced parsing:
```python
def _needs_enhanced_parsing(query: str) -> bool:
    """
    Detect if query needs enhanced parsing:
    - Has event/reaction terms
    - Has advanced filters (age, sex, time, geography)
    - Asks for signal ranking
    """
    query_lower = query.lower()
    
    # Check for event-related keywords
    event_keywords = ["bleeding", "reaction", "adverse", "event", "side effect"]
    if any(kw in query_lower for kw in event_keywords):
        return True
    
    # Check for advanced filters
    filter_keywords = ["elderly", "pediatric", "male", "female", "last", "months", "year"]
    if any(kw in query_lower for kw in filter_keywords):
        return True
    
    # Check for ranking requests
    ranking_keywords = ["rank", "prioritize", "highest", "most important", "signal"]
    if any(kw in query_lower for kw in ranking_keywords):
        return True
    
    return False
```

**In `process_query` function:**
```python
@router.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    query = request.query.strip()
    
    # Smart routing: complex queries → enhanced system
    if _needs_enhanced_parsing(query):
        # Route to enhanced endpoint
        from app.api.enhanced_ai_query_api import enhanced_ai_query
        from app.api.enhanced_ai_query_api import EnhancedQueryRequest
        
        enhanced_request = EnhancedQueryRequest(
            query=query,
            context=None,
            session_id=request.session_id if hasattr(request, 'session_id') else None,
            use_fusion=True,
            max_results=50
        )
        
        try:
            enhanced_response = await enhanced_ai_query(enhanced_request)
            # Convert enhanced response to QueryResponse format
            return QueryResponse(
                answer=enhanced_response.answer,
                data={"signals": enhanced_response.signals},
                intent="enhanced",
                follow_up_suggestions=enhanced_response.follow_up_suggestions
            )
        except Exception as e:
            # Fallback to basic if enhanced fails
            logger.warning(f"Enhanced parsing failed, falling back to basic: {e}")
    
    # Continue with basic processing...
    intent, params = detect_query_intent(query)
    # ... rest of current logic
```

---

### **Task 5: Create Test Cases**

**Test Cases to Implement:**
```python
# Test 1: Simple query (current system)
POST /api/v1/ai/query
{"query": "How many cases?"}
# Expected: Works with current system

# Test 2: Event extraction (enhanced)
POST /api/v1/ai/enhanced/query
{"query": "Show me bleeding cases"}
# Expected: Extracts "bleeding", maps to "HEMORRHAGE", returns results

# Test 3: Advanced filtering (enhanced)
POST /api/v1/ai/enhanced/query
{"query": "Serious bleeding in elderly males in 2024"}
# Expected: Extracts all filters, returns filtered results

# Test 4: Signal ranking (enhanced)
POST /api/v1/ai/enhanced/query
{"query": "Rank signals for warfarin and bleeding"}
# Expected: Returns ranked signals with fusion scores

# Test 5: Smart routing
POST /api/v1/ai/query
{"query": "Show me bleeding cases"}  # Has event keyword
# Expected: Routes to enhanced system automatically
```

---

## ⚠️ **IMPORTANT NOTES**

1. **Backward Compatibility:**
   - Don't break existing `ai_query.py` endpoints
   - Keep current system working
   - Add enhanced as additional option

2. **Import Paths:**
   - Current codebase uses: `app.core.terminology.fda_mapper` (not `fda_terminology_mapper`)
   - Verify all import paths match actual file structure

3. **Class Names:**
   - `query_router.py` may use `SignalQuerySpec` not `AdverseEventQuery`
   - Verify actual class names before fixing imports

4. **Function Names:**
   - Check if `process_natural_language_query` exists in `enhanced_nlp_integration.py`
   - May need to adjust function calls

5. **Router Conflicts:**
   - Ensure enhanced router doesn't conflict with current router
   - Use different prefixes or paths if needed

---

## 📊 **EXPECTED OUTCOME**

**After implementation:**

1. ✅ Both systems work:
   - Current: `POST /api/v1/ai/query` (basic)
   - Enhanced: `POST /api/v1/ai/enhanced/query` (full features)

2. ✅ Smart routing (optional):
   - Simple queries → current system
   - Complex queries → enhanced system (automatic)

3. ✅ Backward compatibility:
   - Existing integrations still work
   - No breaking changes

4. ✅ Full feature set:
   - Event extraction
   - Terminology mapping
   - Fusion integration
   - Advanced filtering

---

## 🎯 **DELIVERABLES**

Please provide:

1. **Fixed `enhanced_nlp_integration.py`:**
   - Corrected imports
   - Verified class names
   - Ready to use

2. **Fixed `enhanced_ai_query_api.py`:**
   - Corrected imports
   - Verified function calls
   - Ready to use

3. **Integration code for `main.py`:**
   - Router registration
   - No conflicts

4. **Smart routing code (optional):**
   - `_needs_enhanced_parsing()` function
   - Routing logic in `ai_query.py`

5. **Test cases:**
   - 5 test cases as specified
   - Expected results

6. **Documentation:**
   - API documentation for new endpoints
   - Migration guide
   - Example queries

---

## 📝 **FILES TO SHARE**

**Please review these files:**

1. `backend/app/api/ai_query.py` (current implementation)
2. `backend/app/core/signal_detection/query_router.py` (verify class names)
3. `backend/app/core/terminology/fda_mapper.py` (verify class name)
4. `backend/app/main.py` (for integration)
5. `backup/ClaudFiles/files (28)/enhanced_nlp_integration.py` (to integrate)
6. `backup/ClaudFiles/files (28)/enhanced_ai_query_api.py` (to integrate)

---

## ✅ **SUCCESS CRITERIA**

**Implementation is successful when:**

1. ✅ Enhanced files copied and imports fixed
2. ✅ Enhanced router integrated into main app
3. ✅ Both endpoints work (current + enhanced)
4. ✅ Smart routing works (optional)
5. ✅ All test cases pass
6. ✅ No breaking changes to existing system
7. ✅ Documentation complete

---

## 🚀 **READY TO START**

**Please:**
1. Review all files listed above
2. Fix imports in enhanced files
3. Provide integration code
4. Create test cases
5. Provide documentation

**Time estimate:** 4 hours  
**Priority:** High  
**Status:** Ready for implementation

