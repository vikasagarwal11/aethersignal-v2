# 🆓 Free MedDRA Alternatives Guide

**Date:** December 9, 2024  
**Purpose:** Guide to free alternatives to MedDRA for pharmacovigilance terminology

---

## 📋 Overview

**MedDRA** (Medical Dictionary for Regulatory Activities) is the industry standard, but it's **paid** for commercial use. However, there are **free alternatives** that can work for your needs.

---

## 🎯 Option 1: FDA Adverse Event Codes (RECOMMENDED)

### **What It Is:**
- **Free, official** adverse event terminology from the FDA
- Used for mandatory FDA reporting
- Comprehensive coverage of adverse events
- Regularly updated

### **How to Get It:**

#### **Step 1: Access FDA FAERS Database**
1. Go to: **https://www.fda.gov/drugs/surveillance/questions-and-answers-fdas-adverse-event-reporting-system-faers**
2. Navigate to **"FAERS Data Files"** section
3. Download the latest quarterly data files

#### **Step 2: Extract Adverse Event Codes**
The FAERS data files contain:
- **PT (Preferred Term)** codes
- **SOC (System Organ Class)** codes
- **HLT (High Level Term)** codes
- **HLGT (High Level Group Term)** codes

#### **Step 3: Use FDA's Code Lists**
1. **FDA MDR (Medical Device Reporting) Codes:**
   - URL: **https://www.fda.gov/medical-devices/mdr-adverse-event-codes/how-code-mdr-adverse-event-report**
   - Contains standardized codes for adverse events

2. **FAERS Data Dictionary:**
   - Download from: **https://www.fda.gov/drugs/surveillance/questions-and-answers-fdas-adverse-event-reporting-system-faers**
   - Contains field definitions and code mappings

### **Implementation in AetherSignal:**

```python
# backend/app/core/terminology/fda_codes.py

FDA_ADVERSE_EVENT_CODES = {
    # System Organ Classes (SOC)
    "SOC": {
        "100000004860": "Blood and lymphatic system disorders",
        "100000004851": "Cardiac disorders",
        "100000004858": "Ear and labyrinth disorders",
        # ... more codes
    },
    
    # Preferred Terms (PT)
    "PT": {
        "100000004865": "Anaemia",
        "100000004866": "Thrombocytopenia",
        "100000004867": "Neutropenia",
        # ... more codes
    },
}

def map_to_fda_code(term: str) -> Optional[str]:
    """Map a medical term to FDA adverse event code."""
    term_lower = term.lower()
    
    # Simple mapping (can be enhanced with fuzzy matching)
    for code, description in FDA_ADVERSE_EVENT_CODES["PT"].items():
        if term_lower in description.lower():
            return code
    
    return None
```

### **Pros:**
- ✅ **Free and official**
- ✅ **Comprehensive** (covers most adverse events)
- ✅ **Regularly updated**
- ✅ **FDA-approved** for regulatory reporting

### **Cons:**
- ⚠️ Less detailed than MedDRA (fewer hierarchical levels)
- ⚠️ Requires manual mapping for some terms
- ⚠️ No official API (need to download files)

---

## 🎯 Option 2: SafeTerm (AI-Based)

### **What It Is:**
- **AI-powered** MedDRA query system
- **Free** (research/academic use)
- Automatically maps medical terms to MedDRA Preferred Terms (PTs)
- High accuracy (validated in research studies)

### **How to Get It:**

#### **Step 1: Access SafeTerm**
1. **Research Paper:** https://arxiv.org/abs/2512.07552
2. **GitHub Repository:** (Check if available - may need to contact authors)
3. **Contact:** Look for author contact information in the paper

#### **Step 2: Implementation Options**

**Option A: Use SafeTerm API (if available)**
```python
# If SafeTerm provides an API
import requests

def query_safeterm(medical_term: str) -> List[dict]:
    """Query SafeTerm for MedDRA PT mappings."""
    response = requests.post(
        "https://safeterm-api.example.com/query",
        json={"term": medical_term}
    )
    return response.json()["results"]  # Returns ranked PTs
```

**Option B: Run SafeTerm Locally (if code available)**
```python
# If SafeTerm is open-source
from safeterm import SafeTermQuery

safeterm = SafeTermQuery()
results = safeterm.query("chest pain")
# Returns: [{"pt": "Chest pain", "relevance": 0.95}, ...]
```

### **Pros:**
- ✅ **AI-powered** (handles synonyms, variations)
- ✅ **High accuracy** (validated in research)
- ✅ **Free** (for research/academic use)
- ✅ **Automated** (no manual mapping needed)

### **Cons:**
- ⚠️ May require research collaboration
- ⚠️ Not officially supported by FDA/regulators
- ⚠️ May have usage restrictions

---

## 🎯 Option 3: SNOMED CT (Free for US)

### **What It Is:**
- **Comprehensive** clinical terminology
- **Free** for US users (via NLM)
- More detailed than FDA codes
- Used in EHR systems

### **How to Get It:**

#### **Step 1: Access SNOMED CT**
1. Go to: **https://www.nlm.nih.gov/healthit/snomedct/index.html**
2. Create a **free account** (US users only)
3. Download SNOMED CT files

#### **Step 2: Map to Adverse Events**
```python
# SNOMED CT has adverse event concepts
SNOMED_ADVERSE_EVENTS = {
    "419620001": "Drug-induced disorder",
    "419161006": "Adverse reaction to drug",
    # ... more codes
}
```

### **Pros:**
- ✅ **Free** (for US users)
- ✅ **Very comprehensive**
- ✅ **Standardized** (used in EHRs)

### **Cons:**
- ⚠️ **US-only** (restricted access)
- ⚠️ Not specifically designed for pharmacovigilance
- ⚠️ Requires mapping to PV use cases

---

## 🎯 Option 4: WHO-ART / ICD-10 (Free)

### **What It Is:**
- **WHO-ART** (World Health Organization Adverse Reaction Terminology) - legacy
- **ICD-10** (International Classification of Diseases) - free
- Used in some countries for PV reporting

### **How to Get It:**

#### **ICD-10:**
1. **WHO Website:** https://www.who.int/standards/classifications/classification-of-diseases
2. **Free download** available
3. **API access** via some providers

#### **Implementation:**
```python
# ICD-10 codes for adverse events
ICD10_ADVERSE_EVENTS = {
    "T36": "Poisoning by systemic antibiotics",
    "T37": "Poisoning by other systemic anti-infectives",
    # ... more codes
}
```

### **Pros:**
- ✅ **Free**
- ✅ **Internationally recognized**
- ✅ **Comprehensive**

### **Cons:**
- ⚠️ Not specifically for pharmacovigilance
- ⚠️ WHO-ART is legacy (being phased out)
- ⚠️ Requires mapping to PV terminology

---

## 🚀 Recommended Implementation Strategy

### **For AetherSignal:**

**Phase 1: Start with FDA Codes (Immediate)**
1. Download FAERS data files
2. Extract adverse event codes
3. Create mapping dictionary
4. Integrate into NLP parser

**Phase 2: Add SafeTerm (If Available)**
1. Contact SafeTerm authors
2. Integrate AI-based mapping
3. Use as fallback for FDA codes

**Phase 3: Hybrid Approach**
1. **Primary:** FDA codes (official, free)
2. **Fallback:** SafeTerm (AI-powered synonyms)
3. **Enhancement:** ICD-10 (international coverage)

---

## 📝 Implementation Steps

### **Step 1: Download FDA FAERS Data**

```bash
# Download latest FAERS quarterly data
wget https://fis.fda.gov/content/Exports/faers_ascii_YYYYQ#.zip

# Extract files
unzip faers_ascii_YYYYQ#.zip

# Files include:
# - DEMO*.txt (demographics)
# - DRUG*.txt (drug information)
# - REAC*.txt (reactions/adverse events) ← This is what we need
# - OUTC*.txt (outcomes)
# - RPSR*.txt (report sources)
```

### **Step 2: Extract Adverse Event Codes**

```python
# backend/app/core/terminology/fda_extractor.py

import pandas as pd
from typing import Dict, List

def extract_fda_codes_from_faers(reac_file: str) -> Dict[str, List[str]]:
    """
    Extract unique adverse event codes from FAERS REAC file.
    
    Returns:
        {
            "pt_codes": ["100000004865", "100000004866", ...],
            "soc_codes": ["100000004860", "100000004851", ...],
        }
    """
    df = pd.read_csv(reac_file, sep='$', low_memory=False)
    
    # Extract unique PT codes
    pt_codes = df['PT'].dropna().unique().tolist()
    
    # Extract unique SOC codes
    soc_codes = df['SOC'].dropna().unique().tolist()
    
    return {
        "pt_codes": pt_codes,
        "soc_codes": soc_codes,
    }
```

### **Step 3: Create Mapping Dictionary**

```python
# backend/app/core/terminology/fda_mapper.py

import json
from typing import Optional, Dict

class FDATerminologyMapper:
    """Maps medical terms to FDA adverse event codes."""
    
    def __init__(self, codes_file: str = "data/fda_codes.json"):
        with open(codes_file, 'r') as f:
            self.codes = json.load(f)
    
    def map_term(self, term: str) -> Optional[Dict[str, str]]:
        """
        Map a medical term to FDA code.
        
        Returns:
            {
                "pt_code": "100000004865",
                "pt_name": "Anaemia",
                "soc_code": "100000004860",
                "soc_name": "Blood and lymphatic system disorders"
            }
        """
        term_lower = term.lower()
        
        # Exact match
        for code, data in self.codes["pt"].items():
            if term_lower == data["name"].lower():
                return {
                    "pt_code": code,
                    "pt_name": data["name"],
                    "soc_code": data["soc_code"],
                    "soc_name": data["soc_name"],
                }
        
        # Partial match
        for code, data in self.codes["pt"].items():
            if term_lower in data["name"].lower() or data["name"].lower() in term_lower:
                return {
                    "pt_code": code,
                    "pt_name": data["name"],
                    "soc_code": data["soc_code"],
                    "soc_name": data["soc_name"],
                }
        
        return None
```

### **Step 4: Integrate into NLP Parser**

```python
# Update backend/app/core/nlp/query_parser.py

from app.core.terminology.fda_mapper import FDATerminologyMapper

class EnhancedQueryParser:
    def __init__(self):
        self.fda_mapper = FDATerminologyMapper()
    
    def parse_reaction(self, query: str) -> Dict[str, Any]:
        """Parse reaction with FDA code mapping."""
        # ... existing parsing logic ...
        
        # Map to FDA code
        if reaction_term:
            fda_mapping = self.fda_mapper.map_term(reaction_term)
            if fda_mapping:
                return {
                    "reaction": reaction_term,
                    "fda_pt_code": fda_mapping["pt_code"],
                    "fda_pt_name": fda_mapping["pt_name"],
                    "fda_soc_code": fda_mapping["soc_code"],
                }
        
        return {"reaction": reaction_term}
```

---

## 📚 Resources

### **FDA Resources:**
- **FAERS Database:** https://www.fda.gov/drugs/surveillance/questions-and-answers-fdas-adverse-event-reporting-system-faers
- **MDR Codes:** https://www.fda.gov/medical-devices/mdr-adverse-event-codes/how-code-mdr-adverse-event-report
- **FAERS Data Files:** https://fis.fda.gov/content/Exports/faers_ascii_YYYYQ#.zip

### **SafeTerm:**
- **Research Paper:** https://arxiv.org/abs/2512.07552
- **Contact Authors:** Check paper for contact information

### **SNOMED CT:**
- **NLM Access:** https://www.nlm.nih.gov/healthit/snomedct/index.html
- **US Users Only:** Free registration required

### **ICD-10:**
- **WHO Website:** https://www.who.int/standards/classifications/classification-of-diseases
- **Free Download:** Available from WHO

---

## ✅ Next Steps

1. **Download FAERS data** (start with latest quarter)
2. **Extract adverse event codes** from REAC files
3. **Create mapping dictionary** (JSON file)
4. **Integrate into NLP parser** (update query_parser.py)
5. **Test with sample queries** (verify mapping accuracy)

---

## 🎯 Summary

**Best Option for You:**
- ✅ **FDA Adverse Event Codes** - Free, official, comprehensive
- ✅ **SafeTerm** (if available) - AI-powered fallback
- ✅ **Hybrid approach** - Use both for maximum coverage

**Implementation Priority:**
1. **Now:** FDA codes (immediate, free, official)
2. **Next:** SafeTerm integration (if available)
3. **Future:** ICD-10 for international coverage

---

**Status:** Ready to implement  
**Effort:** 2-4 hours to set up FDA codes  
**Value:** Free alternative to paid MedDRA

