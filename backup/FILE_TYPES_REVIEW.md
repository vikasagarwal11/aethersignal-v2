# 📋 File Types Support Review - Backup Analysis

## 🔍 **REVIEW SUMMARY**

This document reviews all file types that were supported in similar file upload/processing functionality found in the backup folder.

---

## 📦 **1. STANDARD FILE FORMATS (from files_compatible.py)**

### **Current Implementation Status:**
✅ **Fully Supported** in `backend/app/api/files.py`

```python
SUPPORTED_FORMATS = {
    'pdf': ['.pdf'],
    'document': ['.doc', '.docx', '.txt', '.rtf'],
    'spreadsheet': ['.xls', '.xlsx', '.csv'],
    'email': ['.eml', '.msg'],
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
    'audio': ['.mp3', '.wav', '.m4a'],
    'archive': ['.zip', '.rar', '.7z'],
    'xml': ['.xml'],
}
```

**Status:**
- ✅ PDF - **IMPLEMENTED** (pdfplumber)
- ✅ Word Documents (.doc, .docx) - **IMPLEMENTED** (python-docx)
- ✅ Text Files (.txt) - **IMPLEMENTED** (direct read)
- ✅ RTF - **LISTED** but not specifically handled (falls back to text)
- ✅ Excel (.xls, .xlsx) - **IMPLEMENTED** (pandas/openpyxl)
- ✅ CSV - **IMPLEMENTED** (pandas)
- ✅ Email (.eml, .msg) - **IMPLEMENTED** (email library)
- ✅ Images (.jpg, .jpeg, .png, .gif, .bmp) - **IMPLEMENTED** (pytesseract OCR)
- ✅ Audio (.mp3, .wav, .m4a) - **LISTED** but not processed (no audio transcription)
- ✅ ZIP - **IMPLEMENTED** (zipfile with recursive extraction)
- ⚠️ RAR - **LISTED** but needs `rarfile` library
- ⚠️ 7Z - **LISTED** but needs `py7zr` library
- ✅ XML - **LISTED** but basic handling (falls back to text)

---

## 🏥 **2. PHARMACOVIGILANCE-SPECIFIC FORMATS (from aethersignal backup)**

### **Found in `backup/aethersignal/src/ui/upload_section.py`:**

**Streamlit file uploader accepted:**
```python
type=["csv", "xlsx", "xls", "txt", "zip", "pdf", "xml"]
```

**Documentation mentions:**
- ✅ **FAERS ASCII files** (DEMO/DRUG/REAC/OUTC/THER/INDI/RPSR as `.txt`)
- ✅ **E2B(R3) XML files** (Argus exports, EudraVigilance, VigiBase)
- ✅ **Argus/Veeva exports** (CSV/Excel)
- ✅ **Custom CSV/Excel files** (any column names)
- ✅ **PDF files** with tables
- ✅ **ZIP archives** containing multiple files

### **FAERS File Types (from `faers_loader.py`):**

**7 Standard FAERS ASCII Files:**
1. **DEMO** - Demographics (pattern: `DEMO\d{2}[A-Z]\d?\.txt`)
2. **DRUG** - Drug information (pattern: `DRUG\d{2}[A-Z]\d?\.txt`)
3. **REAC** - Reactions/Adverse events (pattern: `REAC\d{2}[A-Z]\d?\.txt`)
4. **OUTC** - Patient outcomes (pattern: `OUTC\d{2}[A-Z]\d?\.txt`)
5. **THER** - Therapy dates (pattern: `THER\d{2}[A-Z]\d?\.txt`)
6. **INDI** - Indications (pattern: `INDI\d{2}[A-Z]\d?\.txt`)
7. **RPSR** - Report sources (pattern: `RPSR\d{2}[A-Z]\d?\.txt`)

**Status:**
- ⚠️ **NOT IMPLEMENTED** in current `files.py`
- These are specialized FAERS format files that need specific parsing logic
- Would require `faers_loader.py` functionality to be ported

### **E2B XML Files:**

**Status:**
- ⚠️ **NOT IMPLEMENTED** in current `files.py`
- E2B(R3) XML is a structured pharmacovigilance format
- Would require `e2b_import.py` functionality to be ported
- Mentioned in backup but not in current implementation

---

## 📊 **3. COMPARISON: CURRENT vs BACKUP**

| File Type | Current Implementation | Backup (aethersignal) | Notes |
|-----------|----------------------|----------------------|-------|
| **PDF** | ✅ pdfplumber | ✅ pdfplumber | Same |
| **Word (.doc, .docx)** | ✅ python-docx | ✅ (implied) | Same |
| **Excel (.xls, .xlsx)** | ✅ pandas/openpyxl | ✅ pandas | Same |
| **CSV** | ✅ pandas | ✅ pandas | Same |
| **Text (.txt)** | ✅ direct read | ✅ direct read | Same |
| **ZIP** | ✅ zipfile (recursive) | ✅ zipfile | Same |
| **Email (.eml, .msg)** | ✅ email library | ❌ Not mentioned | **NEW in current** |
| **Images (OCR)** | ✅ pytesseract | ❌ Not mentioned | **NEW in current** |
| **Audio** | ⚠️ Listed but not processed | ❌ Not mentioned | **NEW but not functional** |
| **XML** | ⚠️ Basic (text fallback) | ✅ E2B XML support | **MISSING: E2B parsing** |
| **FAERS ASCII** | ❌ Not implemented | ✅ Full support | **MISSING: FAERS loader** |
| **RAR** | ⚠️ Listed but needs library | ❌ Not mentioned | Needs `rarfile` |
| **7Z** | ⚠️ Listed but needs library | ❌ Not mentioned | Needs `py7zr` |
| **RTF** | ⚠️ Listed but text fallback | ❌ Not mentioned | Could use `striprtf` |

---

## 🎯 **4. RECOMMENDATIONS**

### **High Priority (Pharmacovigilance-Specific):**

1. **FAERS ASCII File Support**
   - Port `faers_loader.py` logic
   - Handle 7 file types (DEMO, DRUG, REAC, OUTC, THER, INDI, RPSR)
   - Join on CASE/ISR ID
   - **Impact:** Critical for FDA FAERS data processing

2. **E2B(R3) XML Support**
   - Port `e2b_import.py` logic
   - Parse structured E2B XML format
   - Extract case data from XML structure
   - **Impact:** Important for Argus/EudraVigilance exports

### **Medium Priority (Enhanced Support):**

3. **RAR Archive Support**
   - Install `rarfile` library
   - Add RAR extraction similar to ZIP
   - **Impact:** Some users may have RAR archives

4. **7Z Archive Support**
   - Install `py7zr` library
   - Add 7Z extraction similar to ZIP
   - **Impact:** Less common but occasionally used

5. **RTF File Support**
   - Install `striprtf` library
   - Extract text from RTF files
   - **Impact:** Some legacy documents are RTF

### **Low Priority (Nice to Have):**

6. **Audio Transcription**
   - Integrate speech-to-text (Whisper, etc.)
   - Process audio files for case narratives
   - **Impact:** Rare use case

7. **Enhanced XML Parsing**
   - Better XML structure parsing
   - Extract structured data from XML
   - **Impact:** Would help with various XML formats

---

## 📝 **5. SUMMARY**

### **Currently Implemented:**
- ✅ PDF, Word, Excel, CSV, Text, Email, Images (OCR), ZIP
- ✅ Basic XML (text extraction)

### **Missing from Backup (Important):**
- ❌ FAERS ASCII file parsing (7 file types)
- ❌ E2B(R3) XML structured parsing
- ⚠️ RAR/7Z archive support (listed but not functional)

### **New in Current (Not in Backup):**
- ✅ Email file support (.eml, .msg)
- ✅ Image OCR support
- ✅ Audio file listing (though not processed)

---

## 🔧 **6. NEXT STEPS (If Implementing Missing Features)**

1. **Port FAERS Loader:**
   - Copy `backup/aethersignal/src/faers_loader.py`
   - Integrate into `extract_content()` function
   - Add FAERS file detection logic

2. **Port E2B Parser:**
   - Find `e2b_import.py` in backup
   - Integrate XML parsing logic
   - Add E2B file detection

3. **Add Archive Libraries:**
   - `pip install rarfile py7zr`
   - Extend archive extraction to handle RAR/7Z

4. **Add RTF Support:**
   - `pip install striprtf`
   - Add RTF text extraction

---

**Review Date:** 2025-01-07  
**Reviewed Files:** 
- `backup/migration_review/files_compatible.py`
- `backup/compatible_migration_extracted/files_compatible.py`
- `backup/aethersignal/src/ui/upload_section.py`
- `backup/aethersignal/src/app_helpers.py`
- `backup/aethersignal/src/faers_loader.py`

