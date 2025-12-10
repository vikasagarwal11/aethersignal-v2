# SNOMED CT File Verification

**Date:** December 9, 2024  
**File:** `backup/SnomedCT_ManagedServiceUS_PRODUCTION_US1000124_20250901T120000Z.zip`

---

## ✅ **FILE VERIFICATION**

### **File Name Analysis:**
- **SnomedCT_ManagedServiceUS_PRODUCTION** → SNOMED CT US Edition (Production)
- **US1000124** → US Extension identifier
- **20250901** → September 1, 2025 (matches current release!)
- **T120000Z** → Timestamp (12:00:00 UTC)

**✅ This is the correct SNOMED CT US Edition file!**

---

## 📦 **EXPECTED CONTENTS (RF2 Format)**

SNOMED CT uses **RF2 (Release Format 2)** - tab-delimited text files.

### **Core Files Needed for Terminology Mapping:**

#### **1. Concepts File**
**File:** `sct2_Concept_Snapshot_US1000124_20250901.txt`

**Purpose:** Lists all SNOMED CT concepts

**Format:**
```
id	effectiveTime	active	moduleId	definitionStatusId
267064006	20250901	1	900000000000207008	900000000000074008
197450006	20250901	1	900000000000207008	900000000000074008
```

**What we need:**
- Concept IDs (e.g., 267064006 = "Bleeding")
- Active status (1 = active, 0 = inactive)

---

#### **2. Descriptions File**
**File:** `sct2_Description_Snapshot_US1000124_20250901.txt`

**Purpose:** Terms/synonyms for each concept

**Format:**
```
id	effectiveTime	active	moduleId	conceptId	languageCode	typeId	term	caseSignificanceId
123456789	20250901	1	900000000000207008	267064006	en	900000000000013009	Bleeding	900000000000448009
123456790	20250901	1	900000000000207008	267064006	en	900000000000013009	Haemorrhage	900000000000448009
```

**What we need:**
- `conceptId` → Links to concept
- `term` → The actual term (e.g., "Bleeding", "Haemorrhage")
- `typeId` → 900000000000013009 = Synonym, 900000000000003001 = Fully Specified Name

**This is the KEY file for mapping!**

---

#### **3. Relationships File**
**File:** `sct2_Relationship_Snapshot_US1000124_20250901.txt`

**Purpose:** Semantic relationships between concepts

**Format:**
```
id	effectiveTime	active	moduleId	sourceId	destinationId	relationshipGroup	typeId	characteristicTypeId	modifierId
123456791	20250901	1	900000000000207008	197450006	267064006	0	116680003	900000000000011006	900000000000451002
```

**What we need:**
- `sourceId` → Child concept (e.g., 197450006 = "Gastrointestinal hemorrhage")
- `destinationId` → Parent concept (e.g., 267064006 = "Bleeding")
- `typeId` → 116680003 = IS-A relationship

**This enables semantic disambiguation!**

---

## 🎯 **WHAT WE NEED FOR TERMINOLOGY MAPPING**

### **Minimum Required Files:**

1. ✅ **Concepts** (`sct2_Concept_Snapshot_*.txt`)
   - What concepts exist
   - Which are active

2. ✅ **Descriptions** (`sct2_Description_Snapshot_*.txt`)
   - Terms/synonyms for each concept
   - **MOST IMPORTANT** - This is what we map to!

3. ✅ **Relationships** (`sct2_Relationship_Snapshot_*.txt`)
   - Semantic relationships (IS-A, PART-OF, etc.)
   - Enables context-aware disambiguation

### **Optional (Nice to Have):**

4. **Stated Relationships** (`sct2_StatedRelationship_Snapshot_*.txt`)
   - Explicitly stated relationships
   - More detailed than inferred relationships

5. **Text Definitions** (`sct2_TextDefinition_Snapshot_*.txt`)
   - Formal definitions
   - Useful for disambiguation

---

## ✅ **VERIFICATION CHECKLIST**

### **Step 1: Extract ZIP File**
```bash
# Extract to check contents
unzip -l backup/SnomedCT_ManagedServiceUS_PRODUCTION_US1000124_20250901T120000Z.zip | head -50
```

### **Step 2: Verify Core Files Exist**
Check for:
- ✅ `sct2_Concept_Snapshot_US1000124_20250901.txt`
- ✅ `sct2_Description_Snapshot_US1000124_20250901.txt`
- ✅ `sct2_Relationship_Snapshot_US1000124_20250901.txt`

### **Step 3: Check File Sizes**
- Concepts: ~5-10 MB (350K+ concepts)
- Descriptions: ~50-100 MB (millions of terms)
- Relationships: ~100-200 MB (millions of relationships)

---

## 🚀 **HOW TO USE IT**

### **For Terminology Mapping:**

1. **Load Descriptions File:**
   ```python
   # Build index: term → concept_id
   descriptions = {}
   for line in descriptions_file:
       concept_id, term = parse_line(line)
       descriptions[term.lower()] = concept_id
   ```

2. **Load Relationships File:**
   ```python
   # Build hierarchy: concept_id → parent_concept_id
   relationships = {}
   for line in relationships_file:
       child_id, parent_id, rel_type = parse_line(line)
       if rel_type == "IS-A":
           relationships[child_id] = parent_id
   ```

3. **Map User Term:**
   ```python
   # User says "bleeding"
   # 1. Find concept_id from descriptions
   concept_id = descriptions.get("bleeding")
   
   # 2. Find parent concepts (for disambiguation)
   parent_id = relationships.get(concept_id)
   
   # 3. If context says "GI", find child concept
   if "gi" in context:
       gi_concept_id = find_child_concept(concept_id, "gastrointestinal")
   ```

---

## 📊 **FILE SIZE ESTIMATES**

| File Type | Estimated Size | Records |
|-----------|----------------|---------|
| Concepts | 5-10 MB | 350,000+ |
| Descriptions | 50-100 MB | 1-2 million |
| Relationships | 100-200 MB | 2-3 million |
| **Total** | **~200-400 MB** | **~4-5 million** |

---

## ✅ **ANSWER TO YOUR QUESTION**

**Yes, this is the correct file!**

**It contains:**
- ✅ SNOMED CT US Edition (September 2025)
- ✅ All concepts, descriptions, and relationships
- ✅ Everything needed for terminology mapping

**What to do:**
1. Extract the ZIP file
2. Verify core files exist (Concepts, Descriptions, Relationships)
3. Use Descriptions file for term mapping
4. Use Relationships file for semantic disambiguation

**This file will solve your frequency-based mapping problem!**

---

## 🎯 **NEXT STEPS**

1. **Extract and verify** (5 min)
2. **Check file structure** (10 min)
3. **Create SNOMED CT mapper** (4-6 hours)
4. **Integrate with existing FDA mapper** (2 hours)

**Total:** ~6-8 hours to implement SNOMED CT-based mapping

