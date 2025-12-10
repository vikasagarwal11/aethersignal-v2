# SNOMED CT Storage Strategy - Performance & Memory Analysis

**Date:** December 9, 2024  
**Purpose:** Determine best storage approach for SNOMED CT terminology mapping

---

## 📊 **DATA SIZE ANALYSIS**

### **SNOMED CT File Contents:**

| Component | Records | Estimated Size | Access Pattern |
|-----------|---------|----------------|----------------|
| **Concepts** | ~350,000 | 5-10 MB | Load once, infrequent access |
| **Descriptions** | ~1-2 million | 50-100 MB | **Frequent lookups** (term → concept) |
| **Relationships** | ~2-3 million | 100-200 MB | Frequent traversal (hierarchy) |
| **Total** | ~4-5 million | **200-400 MB** | Mixed |

---

## 🔍 **STORAGE OPTIONS COMPARISON**

### **Option 1: File System (JSON/CSV)**

#### **Approach:**
```python
# Load entire file into memory
with open('sct2_Description_Snapshot.txt') as f:
    descriptions = {term.lower(): concept_id for line in f}
```

#### **Pros:**
- ✅ Simple implementation
- ✅ No database setup
- ✅ Fast for small datasets
- ✅ Easy to version control

#### **Cons:**
- ❌ **Loads entire file into memory** (~100 MB for descriptions)
- ❌ **Slow startup** (loads everything on init)
- ❌ **Not efficient for concurrent access**
- ❌ **No indexing** (linear search for lookups)
- ❌ **Poor for offline batch processing** (reloads each time)

#### **Memory Usage:**
- **Startup:** ~200-400 MB (loads all files)
- **Runtime:** ~200-400 MB (keeps everything in memory)
- **Per Process:** Each worker process loads full dataset

#### **Performance:**
- **Lookup:** O(n) linear search (slow for millions of records)
- **Startup:** 5-10 seconds (loads all files)
- **Concurrent:** Poor (each process has own copy)

---

### **Option 2: Database (PostgreSQL/SQLite)**

#### **Approach:**
```python
# Store in database with indexes
CREATE TABLE snomed_descriptions (
    id BIGINT PRIMARY KEY,
    concept_id BIGINT,
    term TEXT,
    language_code TEXT,
    type_id BIGINT,
    active BOOLEAN
);

CREATE INDEX idx_term_lower ON snomed_descriptions(LOWER(term));
CREATE INDEX idx_concept_id ON snomed_descriptions(concept_id);
```

#### **Pros:**
- ✅ **Indexed lookups** (O(log n) - fast!)
- ✅ **Memory efficient** (only loads what's queried)
- ✅ **Concurrent access** (shared database)
- ✅ **Good for offline processing** (single source of truth)
- ✅ **SQL queries** (complex searches, joins)
- ✅ **Scalable** (can add more indexes)

#### **Cons:**
- ⚠️ Requires database setup
- ⚠️ Initial load time (one-time)
- ⚠️ Database connection overhead

#### **Memory Usage:**
- **Startup:** ~10-20 MB (database connection pool)
- **Runtime:** ~50-100 MB (query cache, connection pool)
- **Per Process:** Shared database (no duplication)

#### **Performance:**
- **Lookup:** O(log n) indexed search (fast!)
- **Startup:** <1 second (just connects to DB)
- **Concurrent:** Excellent (shared database)

---

### **Option 3: Hybrid (Database + In-Memory Cache)**

#### **Approach:**
```python
# Database for storage, LRU cache for hot terms
class SNOMEDCTMapper:
    def __init__(self):
        self.db = connect_to_database()
        self.cache = LRUCache(maxsize=10000)  # Cache 10K most-used terms
    
    def map_term(self, term: str):
        # Check cache first
        if term in self.cache:
            return self.cache[term]
        
        # Query database
        result = self.db.query("SELECT concept_id FROM snomed_descriptions WHERE LOWER(term) = ?", term.lower())
        
        # Cache result
        self.cache[term] = result
        return result
```

#### **Pros:**
- ✅ **Best of both worlds** (fast lookups + memory efficient)
- ✅ **Hot term caching** (common terms in memory)
- ✅ **Database for cold terms** (rare terms queried on-demand)
- ✅ **Adaptive** (cache adjusts to usage patterns)

#### **Cons:**
- ⚠️ More complex implementation
- ⚠️ Cache invalidation logic needed

#### **Memory Usage:**
- **Startup:** ~10-20 MB (database + cache)
- **Runtime:** ~50-150 MB (cache grows with usage)
- **Per Process:** Shared database, per-process cache

#### **Performance:**
- **Hot terms:** O(1) cache lookup (instant!)
- **Cold terms:** O(log n) database lookup (fast)
- **Startup:** <1 second
- **Concurrent:** Excellent

---

## 🎯 **RECOMMENDATION: DATABASE (PostgreSQL/SQLite)**

### **Why Database is Best:**

#### **1. Performance:**
- **Indexed lookups:** O(log n) vs O(n) for file system
- **Example:** Finding "bleeding" in 2M descriptions:
  - File system: ~1-2 seconds (linear search)
  - Database: ~1-5 ms (indexed lookup)

#### **2. Memory Efficiency:**
- **File system:** Loads entire 200-400 MB into memory
- **Database:** Only loads query results (~few KB per lookup)
- **Savings:** ~200-400 MB per process

#### **3. Offline Processing:**
- **File system:** Each script loads full dataset
- **Database:** Single source, multiple scripts can query
- **Benefit:** No duplication, faster batch processing

#### **4. Concurrent Access:**
- **File system:** Each process has own copy (wasteful)
- **Database:** Shared access (efficient)

---

## 📋 **IMPLEMENTATION PLAN**

### **Step 1: Choose Database**

#### **Option A: PostgreSQL** (If you're already using it)
**Best if:**
- Already using PostgreSQL for main app
- Need concurrent access from multiple services
- Want ACID transactions

**Pros:**
- ✅ Already set up
- ✅ Production-grade
- ✅ Excellent concurrency

**Cons:**
- ⚠️ Requires database server

---

#### **Option B: SQLite** (Recommended for simplicity)
**Best if:**
- Want simple setup (file-based)
- Single application instance
- Don't need concurrent writes

**Pros:**
- ✅ **No server needed** (file-based)
- ✅ **Easy setup** (just create file)
- ✅ **Fast** (for read-heavy workloads)
- ✅ **Perfect for terminology** (mostly reads)
- ✅ **Good for offline processing** (just copy file)

**Cons:**
- ⚠️ Limited concurrent writes (but we mostly read)
- ⚠️ File locking (but read-only is fine)

**Recommendation:** ✅ **SQLite** - Perfect for terminology mapping (read-heavy, single file, easy to deploy)

---

### **Step 2: Database Schema**

```sql
-- Concepts table
CREATE TABLE snomed_concepts (
    concept_id BIGINT PRIMARY KEY,
    effective_time DATE,
    active BOOLEAN,
    module_id BIGINT,
    definition_status_id BIGINT
);

CREATE INDEX idx_concepts_active ON snomed_concepts(active) WHERE active = TRUE;

-- Descriptions table (MOST IMPORTANT)
CREATE TABLE snomed_descriptions (
    description_id BIGINT PRIMARY KEY,
    effective_time DATE,
    active BOOLEAN,
    module_id BIGINT,
    concept_id BIGINT,
    language_code TEXT,
    type_id BIGINT,
    term TEXT,
    case_significance_id BIGINT
);

-- Indexes for fast lookups
CREATE INDEX idx_desc_term_lower ON snomed_descriptions(LOWER(term));
CREATE INDEX idx_desc_concept_id ON snomed_descriptions(concept_id);
CREATE INDEX idx_desc_active ON snomed_descriptions(active) WHERE active = TRUE;
CREATE INDEX idx_desc_type ON snomed_descriptions(type_id);

-- Relationships table
CREATE TABLE snomed_relationships (
    relationship_id BIGINT PRIMARY KEY,
    effective_time DATE,
    active BOOLEAN,
    module_id BIGINT,
    source_id BIGINT,
    destination_id BIGINT,
    relationship_group INT,
    type_id BIGINT,
    characteristic_type_id BIGINT,
    modifier_id BIGINT
);

CREATE INDEX idx_rel_source ON snomed_relationships(source_id);
CREATE INDEX idx_rel_destination ON snomed_relationships(destination_id);
CREATE INDEX idx_rel_type ON snomed_relationships(type_id);
CREATE INDEX idx_rel_active ON snomed_relationships(active) WHERE active = TRUE;
```

---

### **Step 3: Load Script**

```python
# backend/scripts/load_snomed_ct.py

import sqlite3
import csv
from pathlib import Path

def load_snomed_ct_to_db(snomed_dir: str, db_path: str = "data/snomed_ct.db"):
    """
    Load SNOMED CT RF2 files into SQLite database.
    
    One-time operation: ~10-15 minutes for full load.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create tables
    create_tables(cursor)
    
    # Load concepts
    concepts_file = Path(snomed_dir) / "sct2_Concept_Snapshot_US1000124_20250901.txt"
    load_concepts(cursor, concepts_file)
    
    # Load descriptions (MOST IMPORTANT)
    descriptions_file = Path(snomed_dir) / "sct2_Description_Snapshot_US1000124_20250901.txt"
    load_descriptions(cursor, descriptions_file)
    
    # Load relationships
    relationships_file = Path(snomed_dir) / "sct2_Relationship_Snapshot_US1000124_20250901.txt"
    load_relationships(cursor, relationships_file)
    
    # Create indexes
    create_indexes(cursor)
    
    conn.commit()
    conn.close()
    
    print(f"✅ SNOMED CT loaded to {db_path}")
```

---

### **Step 4: SNOMED CT Mapper**

```python
# backend/app/core/terminology/snomed_mapper.py

import sqlite3
from typing import Optional, List, Tuple
from functools import lru_cache

class SNOMEDCTMapper:
    """
    Maps terms using SNOMED CT semantic relationships.
    Uses SQLite database for efficient lookups.
    """
    
    def __init__(self, db_path: str = "data/snomed_ct.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row  # Dict-like rows
        
    @lru_cache(maxsize=10000)  # Cache 10K most-used terms
    def map_term(self, term: str, context: Optional[str] = None) -> Optional[MappedTerm]:
        """
        Map term to SNOMED CT concept using semantic relationships.
        
        Strategy:
        1. Find all concepts with matching term
        2. Use context to disambiguate (if provided)
        3. Use relationships to find best match
        4. Return concept with confidence score
        """
        term_lower = term.lower()
        
        # Query database (indexed lookup - fast!)
        cursor = self.conn.execute("""
            SELECT DISTINCT concept_id, term, type_id
            FROM snomed_descriptions
            WHERE LOWER(term) = ? AND active = 1
            LIMIT 20
        """, (term_lower,))
        
        candidates = cursor.fetchall()
        
        if not candidates:
            # Try fuzzy match
            return self._fuzzy_match(term_lower)
        
        if len(candidates) == 1:
            # Single match - return it
            return self._build_mapped_term(term, candidates[0])
        
        # Multiple matches - use context to disambiguate
        if context:
            return self._disambiguate_with_context(candidates, context)
        
        # No context - return most common (by concept frequency)
        return self._select_most_common(candidates)
    
    def _disambiguate_with_context(
        self, 
        candidates: List[sqlite3.Row], 
        context: str
    ) -> Optional[MappedTerm]:
        """Use context words to find best matching concept."""
        context_words = set(re.findall(r'\b[a-z]{3,}\b', context.lower()))
        
        best_score = 0
        best_candidate = None
        
        for candidate in candidates:
            concept_id = candidate['concept_id']
            
            # Get all terms for this concept
            cursor = self.conn.execute("""
                SELECT term FROM snomed_descriptions
                WHERE concept_id = ? AND active = 1
            """, (concept_id,))
            
            concept_terms = [row['term'].lower() for row in cursor.fetchall()]
            concept_words = set()
            for term in concept_terms:
                concept_words.update(re.findall(r'\b[a-z]{3,}\b', term))
            
            # Score: how many context words match concept words?
            overlap = len(context_words & concept_words)
            score = overlap / max(len(context_words), 1)
            
            if score > best_score:
                best_score = score
                best_candidate = candidate
        
        if best_candidate:
            return self._build_mapped_term(context, best_candidate)
        
        return self._select_most_common(candidates)
```

---

## 📊 **PERFORMANCE COMPARISON**

| Metric | File System | Database | Hybrid |
|--------|-------------|----------|--------|
| **Startup Time** | 5-10 sec | <1 sec | <1 sec |
| **Memory Usage** | 200-400 MB | 10-50 MB | 50-150 MB |
| **Lookup Speed** | 1-2 sec | 1-5 ms | 0.1-5 ms |
| **Concurrent Access** | Poor | Excellent | Excellent |
| **Offline Processing** | Poor | Excellent | Excellent |
| **Complexity** | Low | Medium | High |

---

## ✅ **FINAL RECOMMENDATION**

### **Use SQLite Database** ✅

**Why:**
1. ✅ **Fast lookups** (indexed, O(log n))
2. ✅ **Memory efficient** (~10-50 MB vs 200-400 MB)
3. ✅ **Good for offline processing** (single file, easy to copy)
4. ✅ **Simple setup** (no server needed)
5. ✅ **Concurrent reads** (perfect for terminology - mostly reads)

**Implementation:**
1. **One-time load:** Extract SNOMED CT → Load into SQLite (~10-15 min)
2. **Runtime:** Query SQLite with indexes (fast!)
3. **Offline:** Copy `snomed_ct.db` file to processing server

**File Location:**
- `data/snomed_ct.db` (SQLite database file)
- ~200-400 MB (compressed, indexed)
- Easy to backup, version, deploy

---

## 🚀 **NEXT STEPS**

1. **Extract SNOMED CT ZIP** (5 min)
2. **Create load script** (2 hours)
3. **Load into SQLite** (10-15 min one-time)
4. **Create SNOMED CT mapper** (4-6 hours)
5. **Integrate with FDA mapper** (2 hours)

**Total:** ~8-10 hours

**Would you like me to:**
1. Create the SQLite load script?
2. Create the SNOMED CT mapper?
3. Set up hybrid approach (FAERS + SNOMED CT)?

