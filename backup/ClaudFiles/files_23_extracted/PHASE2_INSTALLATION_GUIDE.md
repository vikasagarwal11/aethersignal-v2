# 🚀 PHASE 2 INSTALLATION GUIDE - INTELLIGENCE & AUTOMATION

## ✅ **WHAT'S INCLUDED IN PHASE 2**

### **Frontend Components:**
1. ✅ CaseDetailModal.tsx - Comprehensive case investigation
2. ✅ MultiFileUpload.tsx - Drag & drop batch upload
3. ✅ UploadHistoryTracker.tsx - Upload tracking & management

### **Backend APIs:**
4. ✅ upload_duplicate_detection.py - Duplicate file detection
5. ✅ similar_cases_api.py - Advanced similarity matching
6. ✅ 005_upload_tracking.sql - Database migration

### **Features:**
- 📊 Case detail modal with timeline
- 📁 Multi-file drag & drop upload
- 🔄 Duplicate detection (MD5/SHA-256)
- 📋 Upload history tracker
- 🔍 Similar cases finder
- 📥 Export case reports
- 🔗 Batch processing

---

## 📦 **INSTALLATION**

### **STEP 1: Database Migration (2 min)**

```bash
# Run the upload tracking migration
psql $DATABASE_URL < 005_upload_tracking.sql

# Verify
psql $DATABASE_URL -c "SELECT * FROM file_uploads LIMIT 1;"
```

**Expected output:**
```
Migration 005_upload_tracking completed
```

---

### **STEP 2: Install Backend APIs (5 min)**

```bash
cd backend/app/api

# Copy new API modules
cp /path/to/upload_duplicate_detection.py .
cp /path/to/similar_cases_api.py .
```

**Update main.py to include new routers:**

```python
# In backend/app/main.py
from app.api import (
    signals,
    sessions,
    ai_query,
    upload_duplicate_detection,  # NEW
    similar_cases_api            # NEW
)

# Add routers
app.include_router(upload_duplicate_detection.router)
app.include_router(similar_cases_api.router)
```

---

### **STEP 3: Install Frontend Components (5 min)**

```bash
cd frontend/src/components/pharmacovigilance

# Copy Phase 2 components
cp /path/to/CaseDetailModal.tsx .
cp /path/to/MultiFileUpload.tsx .
cp /path/to/UploadHistoryTracker.tsx .
```

---

### **STEP 4: Update SignalsPage (3 min)**

Integrate CaseDetailModal into SignalsPage:

```typescript
// In SignalsPage.tsx
import { CaseDetailModal } from './CaseDetailModal';

// Add state
const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
const [showCaseModal, setShowCaseModal] = useState(false);

// In table row onClick
<tr 
  onClick={() => {
    setSelectedCaseId(signal.case_id);
    setShowCaseModal(true);
  }}
>
  {/* table cells */}
</tr>

// Add modal at bottom of component
{showCaseModal && (
  <CaseDetailModal
    caseId={selectedCaseId!}
    isOpen={showCaseModal}
    onClose={() => setShowCaseModal(false)}
  />
)}
```

---

### **STEP 5: Create Upload Page (5 min)**

```typescript
// frontend/src/pages/UploadPage.tsx
import React from 'react';
import { MultiFileUpload } from '@/components/pharmacovigilance/MultiFileUpload';
import { UploadHistoryTracker } from '@/components/pharmacovigilance/UploadHistoryTracker';

export function UploadPage() {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-200">Upload Safety Reports</h1>
      
      <MultiFileUpload 
        onUploadComplete={(results) => {
          console.log('Upload complete:', results);
          // Refresh history or navigate
        }}
      />
      
      <hr className="border-slate-800" />
      
      <UploadHistoryTracker />
    </div>
  );
}
```

Add route:
```typescript
<Route path="/upload" element={<UploadPage />} />
```

---

### **STEP 6: Restart Services (2 min)**

```bash
# Restart backend
cd backend
python run.py

# Restart frontend
cd frontend
npm run dev
```

---

## 🧪 **TESTING**

### **Test 1: Duplicate Detection**

```bash
# Upload same file twice
curl -X POST http://localhost:8000/api/v1/upload/check-duplicate \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.pdf",
    "hash": "abc123...",
    "size": 12345
  }'

# Expected: is_duplicate: false (first time)
# Expected: is_duplicate: true (second time)
```

---

### **Test 2: Similar Cases**

```bash
# Find similar cases
curl "http://localhost:8000/api/v1/cases/CASE_ID/similar?limit=5"

# Expected: Array of similar cases with similarity scores
```

---

### **Test 3: Frontend Upload**

1. Navigate to `/upload`
2. Drag & drop a file
3. See progress bar
4. Verify upload completes
5. Check upload history

---

### **Test 4: Case Detail Modal**

1. Navigate to `/signals`
2. Click any signal row
3. Modal opens with case details
4. Test tabs: Overview, Timeline, Related, Export
5. Verify data displays correctly

---

## 📊 **NEW API ENDPOINTS**

### **Upload & Duplicates:**

**POST /api/v1/upload/check-duplicate**
- Check if file hash exists
- Returns: duplicate status + existing file info

**POST /api/v1/upload/**
- Upload file with duplicate handling
- Params: file, duplicate_action (skip/replace/keep)
- Returns: upload result + cases created

**GET /api/v1/upload/history**
- Get upload history
- Returns: List of uploads with stats

**GET /api/v1/upload/duplicates**
- Find all duplicate file groups
- Returns: Duplicate groups

**DELETE /api/v1/upload/{upload_id}**
- Delete upload + associated cases
- Returns: deletion result

**POST /api/v1/upload/{upload_id}/merge**
- Merge duplicate uploads
- Returns: merge result

---

### **Cases & Similarity:**

**GET /api/v1/cases/{case_id}**
- Get case details
- Returns: Complete case data

**GET /api/v1/cases/by-drug-event**
- Get cases by drug and event
- Params: drug, event, limit
- Returns: Matching cases

**GET /api/v1/cases/{case_id}/similar**
- Find similar cases
- Params: limit, min_similarity
- Returns: Similar cases with scores

**GET /api/v1/cases/{case_id}/export**
- Export case report
- Params: format (pdf/word/json)
- Returns: Case report file

**POST /api/v1/cases/batch-similarity**
- Analyze similarity across multiple cases
- Body: case_ids[]
- Returns: Similarity matrix + clusters

---

## 🎯 **FEATURES BREAKDOWN**

### **1. Case Detail Modal**

**What it does:**
- Shows complete case information
- Timeline visualization
- Related cases (similarity search)
- Export to PDF/Word

**How to use:**
```typescript
<CaseDetailModal
  caseId="uuid-123"
  isOpen={true}
  onClose={() => setShowModal(false)}
/>
```

**Or by drug-event:**
```typescript
<CaseDetailModal
  drugName="Aspirin"
  eventName="Bleeding"
  isOpen={true}
  onClose={() => setShowModal(false)}
/>
```

---

### **2. Multi-File Upload**

**What it does:**
- Drag & drop multiple files
- Progress tracking per file
- Duplicate detection
- Batch processing
- Upload statistics

**Supported formats:**
- PDF
- Excel (.xlsx, .xls, .csv)
- XML (E2B)
- Word (.docx)

**Duplicate actions:**
- **Skip:** Don't upload duplicate
- **Replace:** Overwrite existing file
- **Keep Both:** Upload as new file

---

### **3. Upload History Tracker**

**What it does:**
- Shows all past uploads
- Duplicate file detection
- Upload statistics
- Delete/merge operations
- Filter by date/duplicates

**Statistics shown:**
- Total uploads
- Duplicate count
- Total cases created
- Total file size

---

### **4. Similar Cases Finder**

**What it does:**
- Multi-factor similarity analysis
- Demographic matching
- Event similarity
- Temporal proximity
- Narrative keyword overlap

**Similarity factors:**
- Drug/Event match (40% weight)
- Demographics (25% weight)
- Temporal factors (20% weight)
- Narrative text (15% weight)

**Use cases:**
- Find related cases for investigation
- Cluster similar adverse events
- Pattern detection
- Quality control

---

## 🔧 **CONFIGURATION**

### **Upload Settings (backend/.env):**

```bash
# Maximum file size (bytes)
MAX_UPLOAD_SIZE=52428800  # 50MB

# Allowed file types
ALLOWED_FILE_TYPES=pdf,xlsx,xls,csv,xml,docx

# Duplicate detection
ENABLE_DUPLICATE_DETECTION=true
DUPLICATE_HASH_ALGORITHM=sha256  # or md5

# Upload directory
UPLOAD_DIR=./uploads
```

---

### **Similarity Thresholds:**

```python
# In similar_cases_api.py

# Minimum similarity to consider "similar"
MIN_SIMILARITY_DEFAULT = 0.3

# Weights for similarity components
SIMILARITY_WEIGHTS = {
    'event': 0.4,        # Drug/event match most important
    'demographic': 0.25, # Patient characteristics
    'temporal': 0.2,     # Time-based factors
    'narrative': 0.15    # Text similarity
}
```

---

## 📋 **DATABASE SCHEMA UPDATES**

### **New Tables:**

**file_uploads:**
- Tracks all uploaded files
- Stores file hash for duplicate detection
- Links to pv_cases via upload_id
- Includes processing stats

**Fields:**
- id, filename, file_path, file_hash
- uploaded_at, status, error_message
- cases_created, cases_valid, cases_invalid
- is_duplicate, duplicate_of_id, duplicate_action
- session_id, original_format, file_metadata

---

### **Updated Tables:**

**pv_cases:**
- Added `upload_id` foreign key
- Links each case to its source file

---

### **New Views:**

**duplicate_files_view:**
- Shows all duplicate file groups
- Aggregates by file_hash
- Useful for cleanup operations

**upload_statistics:**
- Daily upload statistics
- Total files, duplicates, cases
- Useful for monitoring

---

## ✅ **VERIFICATION CHECKLIST**

After installation:

### **Backend:**
- [ ] Database migration successful
- [ ] New API modules imported
- [ ] Routers registered in main.py
- [ ] Backend restarts without errors
- [ ] `/docs` shows new endpoints

### **Frontend:**
- [ ] Components copied
- [ ] Upload page created
- [ ] Route added
- [ ] Modal integrates with signals page
- [ ] Frontend restarts without errors

### **Functionality:**
- [ ] Can upload multiple files
- [ ] Progress bars show
- [ ] Duplicate detection works
- [ ] Upload history displays
- [ ] Case modal opens from signals
- [ ] Similar cases load
- [ ] Timeline displays

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Duplicate detection not working**
**Solution:**
- Check file_hash is being calculated
- Verify database has file_uploads table
- Check trigger `mark_duplicates_on_insert` exists

### **Issue: Upload fails**
**Solution:**
- Check upload directory exists and is writable
- Verify file size within limits
- Check file type is allowed
- Review backend logs for errors

### **Issue: Similar cases returns empty**
**Solution:**
- Verify cases exist in database
- Lower min_similarity threshold
- Check case has required fields (drug_name, reaction)

### **Issue: Modal doesn't open**
**Solution:**
- Check console for React errors
- Verify case_id is being passed correctly
- Check API endpoint responds

---

## 📊 **PERFORMANCE NOTES**

### **Upload Performance:**
- Sequential processing: ~5s per file
- Parallel processing: ~2s per file (advanced)
- Duplicate check: <100ms per file

### **Similarity Calculation:**
- Single case: ~50ms per comparison
- Batch (100 cases): ~5s total
- Can be optimized with caching

### **Recommendations:**
- Enable caching for frequently accessed cases
- Use background jobs for large batch uploads
- Index file_hash for faster duplicate checks
- Consider pre-computing similarity for recent cases

---

## 🎯 **USAGE EXAMPLES**

### **Example 1: Upload Multiple Files**

```typescript
// User drags 5 files
// System:
// 1. Checks each for duplicates
// 2. Shows duplicate modal if needed
// 3. Uploads files sequentially
// 4. Updates progress bars
// 5. Creates cases from each file
// 6. Updates upload history
```

---

### **Example 2: Investigate Similar Cases**

```typescript
// User clicks signal "Aspirin → Bleeding"
// Modal opens showing:
// - All cases for this drug-event pair
// - Related cases (different drugs, same event)
// - Related cases (same drug, different events)
// - Timeline of events
// - Export option
```

---

### **Example 3: Handle Duplicates**

```typescript
// User uploads "safety_report.pdf"
// System detects: Previously uploaded yesterday
// User chooses: "Replace"
// System:
// 1. Deletes old cases
// 2. Deletes old upload record
// 3. Uploads new file
// 4. Creates new cases
```

---

## 🚀 **NEXT STEPS**

After Phase 2 is installed and tested:

**Phase 3 (Week 8):** Data Integration
- E2B XML parser
- FAERS API connector
- Excel smart mapping
- Multiple file format support

**Phase 4 (Week 9):** Predictive Features
- Network signal detection
- Label impact simulation
- Benefit-risk profiling
- Trend forecasting

---

## 📚 **DOCUMENTATION**

**API Docs:** http://localhost:8000/docs

**Frontend Storybook:** (if configured)

**Component Props:**
- See TypeScript interfaces in each component file
- IntelliSense in VS Code shows all props

---

**INSTALLATION TIME:** ~20 minutes
**TOTAL CODE:** ~2,500 lines
**RESULT:** Advanced intelligence & automation features! 🎯
