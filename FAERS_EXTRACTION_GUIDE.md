# 📦 FAERS Data Extraction Guide

**Date:** December 9, 2024  
**File:** `faers_ascii_2025Q2.zip` ✅ **THIS IS WHAT WE NEED!**

---

## ✅ What You Have

### **FAERS ASCII 2025Q2 Files:**

| File | Size | Purpose |
|------|------|---------|
| **REAC25Q2.txt** | 50.8 MB | **⭐ REACTIONS/ADVERSE EVENTS - THIS IS WHAT WE NEED!** |
| DEMO25Q2.txt | 60.6 MB | Demographics (patient info) |
| DRUG25Q2.txt | 185.1 MB | Drug information |
| INDI25Q2.txt | 54.2 MB | Indications (why drug was used) |
| OUTC25Q2.txt | 6.5 MB | Outcomes (death, hospitalization, etc.) |
| THER25Q2.txt | 18.8 MB | Therapy dates |
| RPSR25Q2.txt | 250 KB | Report sources |

### **SNOMED CT File:**

**What it is:**
- ✅ **Full clinical terminology system** (400MB+ files)
- ✅ **Comprehensive** (covers all medical concepts)
- ⚠️ **Not specifically for adverse events** (general clinical terminology)
- ⚠️ **Very large** (may be overkill for PV use case)

**Recommendation:**
- ✅ **Use FAERS REAC file** for adverse event codes (easier, specific to PV)
- ⏳ **Consider SNOMED CT later** if you need broader clinical terminology

---

## 🎯 What We Need: REAC25Q2.txt

### **File Structure:**

The REAC file contains adverse event reports with these fields:

```
PRIMARYID | CASEID | PT (Preferred Term) | DRUG_SEQ | DRUGNAME
```

**Key Fields:**
- **PRIMARYID**: Unique report identifier
- **CASEID**: Case identifier
- **PT**: **Preferred Term** (this is the adverse event code/name we need!)
- **DRUG_SEQ**: Drug sequence number
- **DRUGNAME**: Drug name

### **What We'll Extract:**

1. **Unique Preferred Terms (PTs)** - List of all adverse events
2. **PT Code Mapping** - Map PT names to codes (if available)
3. **Frequency Counts** - How often each PT appears

---

## 🚀 Extraction Script

### **Step 1: Extract the ZIP File**

```bash
# Extract to a working directory
unzip faers_ascii_2025Q2.zip -d faers_data/
```

### **Step 2: Run Extraction Script**

Create this script:

```python
# backend/scripts/extract_faers_codes.py

import pandas as pd
import json
from pathlib import Path
from collections import Counter
from typing import Dict, List

def extract_faers_codes(reac_file: str, output_file: str = "data/fda_adverse_event_codes.json"):
    """
    Extract unique adverse event codes from FAERS REAC file.
    
    Args:
        reac_file: Path to REAC25Q2.txt file
        output_file: Output JSON file path
    """
    print(f"Reading FAERS REAC file: {reac_file}")
    
    # FAERS files use '$' as delimiter
    df = pd.read_csv(
        reac_file,
        sep='$',
        low_memory=False,
        encoding='latin-1'  # FAERS uses Latin-1 encoding
    )
    
    print(f"Total rows: {len(df):,}")
    print(f"Columns: {list(df.columns)}")
    
    # Extract unique Preferred Terms (PTs)
    if 'PT' in df.columns:
        pt_counts = df['PT'].value_counts()
        unique_pts = df['PT'].dropna().unique()
        
        print(f"\nUnique Preferred Terms (PTs): {len(unique_pts):,}")
        print(f"\nTop 10 Most Common PTs:")
        for pt, count in pt_counts.head(10).items():
            print(f"  {pt}: {count:,} reports")
        
        # Create mapping dictionary
        codes = {
            "preferred_terms": {},
            "statistics": {
                "total_pts": len(unique_pts),
                "total_reports": len(df),
            }
        }
        
        # Store each PT with its frequency
        for pt in unique_pts:
            count = pt_counts.get(pt, 0)
            codes["preferred_terms"][pt] = {
                "name": pt,
                "frequency": int(count),
                "frequency_percent": round(count / len(df) * 100, 4)
            }
        
        # Save to JSON
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(codes, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Saved {len(unique_pts):,} PTs to: {output_file}")
        
        return codes
    else:
        print("❌ 'PT' column not found in file!")
        print(f"Available columns: {list(df.columns)}")
        return None


if __name__ == "__main__":
    # Update this path to your extracted REAC file
    reac_file = r"C:\Users\vikas\Downloads\faers_ascii_2025Q2\ASCII\REAC25Q2.txt"
    
    # Or if extracted to project directory:
    # reac_file = "faers_data/ASCII/REAC25Q2.txt"
    
    extract_faers_codes(reac_file)
```

### **Step 3: Run the Script**

```bash
cd backend
python scripts/extract_faers_codes.py
```

---

## 📊 Expected Output

The script will create `data/fda_adverse_event_codes.json`:

```json
{
  "preferred_terms": {
    "DRUG INEFFECTIVE": {
      "name": "DRUG INEFFECTIVE",
      "frequency": 12345,
      "frequency_percent": 2.45
    },
    "NAUSEA": {
      "name": "NAUSEA",
      "frequency": 9876,
      "frequency_percent": 1.96
    },
    ...
  },
  "statistics": {
    "total_pts": 15000,
    "total_reports": 500000
  }
}
```

---

## 🔧 Integration with AetherSignal

### **Step 1: Create Terminology Mapper**

```python
# backend/app/core/terminology/fda_mapper.py

import json
from pathlib import Path
from typing import Optional, Dict, List

class FDATerminologyMapper:
    """Maps medical terms to FDA adverse event Preferred Terms."""
    
    def __init__(self, codes_file: str = "data/fda_adverse_event_codes.json"):
        codes_path = Path(codes_file)
        if codes_path.exists():
            with open(codes_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.codes = data.get("preferred_terms", {})
        else:
            self.codes = {}
            print(f"⚠️ Warning: Codes file not found: {codes_file}")
    
    def map_term(self, term: str) -> Optional[Dict[str, any]]:
        """
        Map a medical term to FDA Preferred Term.
        
        Args:
            term: Medical term (e.g., "chest pain", "nausea")
        
        Returns:
            {
                "pt_name": "CHEST PAIN",
                "frequency": 1234,
                "frequency_percent": 0.25
            } or None if not found
        """
        term_upper = term.upper().strip()
        
        # Exact match
        if term_upper in self.codes:
            return {
                "pt_name": self.codes[term_upper]["name"],
                "frequency": self.codes[term_upper]["frequency"],
                "frequency_percent": self.codes[term_upper]["frequency_percent"]
            }
        
        # Partial match (contains)
        for pt_name, pt_data in self.codes.items():
            if term_upper in pt_name or pt_name in term_upper:
                return {
                    "pt_name": pt_data["name"],
                    "frequency": pt_data["frequency"],
                    "frequency_percent": pt_data["frequency_percent"]
                }
        
        return None
    
    def search_terms(self, query: str, limit: int = 10) -> List[Dict[str, any]]:
        """
        Search for terms matching query.
        
        Returns:
            List of matching PTs sorted by frequency
        """
        query_upper = query.upper()
        matches = []
        
        for pt_name, pt_data in self.codes.items():
            if query_upper in pt_name:
                matches.append({
                    "pt_name": pt_data["name"],
                    "frequency": pt_data["frequency"],
                    "frequency_percent": pt_data["frequency_percent"]
                })
        
        # Sort by frequency (descending)
        matches.sort(key=lambda x: x["frequency"], reverse=True)
        return matches[:limit]
```

### **Step 2: Integrate with NLP Parser**

```python
# Update backend/app/core/nlp/query_parser.py

from app.core.terminology.fda_mapper import FDATerminologyMapper

class EnhancedQueryParser:
    def __init__(self):
        self.fda_mapper = FDATerminologyMapper()
    
    def parse_reaction(self, query: str) -> Dict[str, Any]:
        """Parse reaction with FDA code mapping."""
        # ... existing parsing logic ...
        
        # Map to FDA Preferred Term
        if reaction_term:
            fda_mapping = self.fda_mapper.map_term(reaction_term)
            if fda_mapping:
                return {
                    "reaction": reaction_term,
                    "fda_pt": fda_mapping["pt_name"],
                    "fda_frequency": fda_mapping["frequency"],
                    "confidence": "high" if fda_mapping["frequency"] > 1000 else "medium"
                }
            else:
                # Try fuzzy search
                matches = self.fda_mapper.search_terms(reaction_term, limit=3)
                if matches:
                    return {
                        "reaction": reaction_term,
                        "fda_pt": matches[0]["pt_name"],
                        "fda_frequency": matches[0]["frequency"],
                        "confidence": "medium",
                        "alternatives": matches[1:] if len(matches) > 1 else []
                    }
        
        return {"reaction": reaction_term, "confidence": "low"}
```

---

## 📋 Quick Start Checklist

- [ ] Extract `faers_ascii_2025Q2.zip` to a directory
- [ ] Create `backend/scripts/extract_faers_codes.py`
- [ ] Run extraction script
- [ ] Verify `data/fda_adverse_event_codes.json` was created
- [ ] Create `backend/app/core/terminology/fda_mapper.py`
- [ ] Integrate with NLP parser
- [ ] Test with sample queries

---

## 🎯 Summary

### **FAERS File:** ✅ **EXACTLY WHAT WE NEED!**
- **REAC25Q2.txt** contains all adverse event Preferred Terms
- **50.8 MB** of real-world adverse event data
- **Free and official** from FDA
- **Perfect for terminology mapping**

### **SNOMED CT:** ⚠️ **Not Needed Right Now**
- Too large (400MB+)
- Not specifically for adverse events
- Can use later if needed for broader clinical terminology

### **Next Steps:**
1. ✅ Extract REAC file from ZIP
2. ✅ Run extraction script
3. ✅ Create terminology mapper
4. ✅ Integrate with NLP parser

---

**Status:** Ready to extract!  
**Effort:** 1-2 hours  
**Value:** Free adverse event terminology from FDA

