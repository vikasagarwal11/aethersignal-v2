# UMLS & SNOMED CT Evaluation for AetherSignal

**Date:** December 9, 2024  
**Purpose:** Assess if UMLS/SNOMED CT would improve terminology mapping

---

## 🔍 **WHAT THEY ARE**

### **1. UMLS (Unified Medical Language System)**
**URL:** https://uts.nlm.nih.gov/uts/

**What it is:**
- Comprehensive medical terminology integration system
- Combines 200+ medical vocabularies (SNOMED CT, ICD-10, MeSH, RxNorm, etc.)
- Provides semantic relationships between terms
- Concept Unique Identifiers (CUIs) for each medical concept
- APIs for terminology services

**Key Features:**
- **Semantic relationships:** Knows "bleeding" ≈ "hemorrhage" semantically
- **Concept mapping:** Maps terms across different vocabularies
- **Hierarchical relationships:** Parent/child concept relationships
- **Free for US users:** Requires registration and license agreement

---

### **2. SNOMED CT (Systematized Nomenclature of Medicine Clinical Terms)**
**URL:** https://www.nlm.nih.gov/healthit/snomedct/us_edition.html

**What it is:**
- Comprehensive clinical terminology system
- 350,000+ clinical concepts
- Used by EHRs worldwide
- Free US Edition (requires license)

**Key Features:**
- **Hierarchical structure:** Concepts organized in hierarchies
- **Semantic relationships:** IS-A, PART-OF, CAUSED-BY, etc.
- **Synonyms:** Multiple terms for same concept
- **Context-aware:** Can disambiguate based on relationships

---

## ✅ **HOW THEY SOLVE YOUR PROBLEM**

### **Current Issue:**
```
User: "Show me GI bleeding cases"
Current: Maps "bleeding" → "Hemorrhage" (wrong - too generic)
Problem: Frequency-based, no semantic understanding
```

### **With SNOMED CT:**
```
User: "Show me GI bleeding cases"
SNOMED CT:
  1. Finds "bleeding" → Concept 267064006 (Bleeding)
  2. Finds "GI bleeding" → Concept 197450006 (Gastrointestinal hemorrhage)
  3. Relationship: GI hemorrhage IS-A Bleeding
  4. Maps to correct specific term: "Gastrointestinal hemorrhage"
```

**Benefits:**
- ✅ **Semantic understanding** - Knows relationships, not just frequency
- ✅ **Context disambiguation** - Uses concept hierarchy
- ✅ **Industry standard** - Used by EHRs, interoperable
- ✅ **Comprehensive** - 350K+ concepts vs 14K FAERS terms

---

## ⚠️ **TRADE-OFFS**

### **Pros:**
1. **Better mapping accuracy** - Semantic relationships solve your exact problem
2. **Industry standard** - Used by major EHRs
3. **Free for US users** - Just need to register
4. **Comprehensive** - Covers all medical concepts, not just adverse events
5. **Future-proof** - Standard terminology system

### **Cons:**
1. **Larger dataset** - 350K+ concepts vs 14K FAERS terms (more storage/complexity)
2. **License required** - Need to register and agree to terms
3. **More complex integration** - Need to understand SNOMED CT structure
4. **May be overkill** - If FAERS terms work for your use case
5. **Learning curve** - Team needs to understand SNOMED CT concepts

---

## 🎯 **RECOMMENDATION**

### **Option A: Keep FAERS Terms (Current)**
**Best if:**
- FAERS terms cover your needs
- You want simplicity
- You're okay with frequency-based mapping limitations

**Pros:**
- ✅ Simple (already implemented)
- ✅ No licensing
- ✅ Smaller dataset
- ✅ Specific to adverse events

**Cons:**
- ❌ No semantic relationships
- ❌ Frequency-based mapping issues
- ❌ Limited to 14K terms

---

### **Option B: Add SNOMED CT (Recommended for Long-term)**
**Best if:**
- You want better mapping accuracy
- You need semantic understanding
- You're building for scale

**Pros:**
- ✅ Solves your exact problem (semantic mapping)
- ✅ Industry standard
- ✅ Comprehensive terminology
- ✅ Future-proof

**Cons:**
- ⚠️ Requires license registration
- ⚠️ More complex integration
- ⚠️ Larger dataset

**Implementation:**
1. Register for SNOMED CT US Edition license (free)
2. Download SNOMED CT release files
3. Create SNOMED CT mapper (similar to FDA mapper)
4. Use for semantic disambiguation
5. Keep FAERS terms as fallback

---

### **Option C: Hybrid Approach (Best Short-term)**
**Use both:**
- **FAERS terms** - Primary mapping (fast, simple)
- **SNOMED CT** - Disambiguation for ambiguous cases (accurate)

**How it works:**
```python
def map_term_with_semantics(term: str, context: str):
    # 1. Try FAERS mapping first (fast)
    faers_result = fda_mapper.map_term_with_context(term, context)
    
    # 2. If ambiguous (low confidence), use SNOMED CT
    if faers_result.confidence < 0.7:
        snomed_result = snomed_mapper.map_term(term, context)
        return snomed_result  # More accurate
    
    return faers_result  # Fast path
```

**Benefits:**
- ✅ Fast for common cases (FAERS)
- ✅ Accurate for ambiguous cases (SNOMED CT)
- ✅ Best of both worlds

---

## 📋 **IMPLEMENTATION STEPS (If You Choose SNOMED CT)**

### **Step 1: Get License** (30 min)
1. Go to https://uts.nlm.nih.gov/uts/
2. Register for UMLS account
3. Request SNOMED CT US Edition license
4. Accept terms (free for US users)

### **Step 2: Download SNOMED CT** (1 hour)
1. Download September 2025 US Edition
2. Extract files (RF2 format)
3. Load into database or parse files

### **Step 3: Create SNOMED CT Mapper** (4-6 hours)
```python
class SNOMEDCTMapper:
    """
    Maps terms using SNOMED CT semantic relationships.
    """
    def map_term(self, term: str, context: str) -> MappedTerm:
        # 1. Find concept by term
        # 2. Use semantic relationships for disambiguation
        # 3. Return best match with confidence
```

### **Step 4: Integrate** (2 hours)
- Add to enhanced NLP parser
- Use for disambiguation
- Keep FAERS as fallback

**Total time:** ~8-10 hours

---

## 🎯 **MY RECOMMENDATION**

### **Short-term (Now):**
✅ **Keep current FAERS approach** - It works, context-aware mapping helps
✅ **Monitor mapping accuracy** - Track user feedback
✅ **Document limitations** - Users know it's not perfect

### **Medium-term (Next Sprint):**
✅ **Add SNOMED CT for disambiguation** - Hybrid approach
✅ **Use SNOMED CT for ambiguous cases** - When FAERS confidence < 0.7
✅ **Keep FAERS as primary** - Fast path for common cases

### **Long-term (Future):**
✅ **Full SNOMED CT integration** - If you need comprehensive terminology
✅ **Consider UMLS** - If you need cross-vocabulary mapping

---

## 📊 **COMPARISON TABLE**

| Feature | FAERS Terms | SNOMED CT | UMLS |
|---------|-------------|-----------|------|
| **Terms** | 14,921 | 350,000+ | 200+ vocabularies |
| **Semantic Relationships** | ❌ No | ✅ Yes | ✅ Yes |
| **Context Disambiguation** | ⚠️ Limited | ✅ Yes | ✅ Yes |
| **License** | ✅ Free | ✅ Free (US) | ✅ Free (US) |
| **Complexity** | ✅ Simple | ⚠️ Medium | ⚠️ High |
| **Adverse Events Focus** | ✅ Yes | ⚠️ General | ⚠️ General |
| **Industry Standard** | ❌ No | ✅ Yes | ✅ Yes |
| **Your Current Problem** | ⚠️ Partial | ✅ Solves | ✅ Solves |

---

## ✅ **BOTTOM LINE**

**Yes, SNOMED CT would be very useful!**

It solves your exact problem:
- ✅ Semantic understanding (not just frequency)
- ✅ Context-aware disambiguation
- ✅ Industry standard

**But:**
- ⚠️ More complex than current approach
- ⚠️ May be overkill if FAERS works

**Recommendation:**
- **Now:** Keep FAERS, improve context-aware mapping (done)
- **Next:** Add SNOMED CT for ambiguous cases (hybrid)
- **Future:** Consider full SNOMED CT if needed

**Would you like me to:**
1. Create a SNOMED CT mapper prototype?
2. Set up hybrid approach (FAERS + SNOMED CT)?
3. Keep current approach and document limitations?

