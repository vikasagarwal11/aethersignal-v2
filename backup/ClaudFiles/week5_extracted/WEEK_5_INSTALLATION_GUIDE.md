# 🚀 Week 5: Frontend-Backend Integration - Complete Guide

**Connecting the AI-first UI to the Universal File Processor**

---

## 🎯 **WHAT WE'RE BUILDING**

**Complete End-to-End Flow:**

```
User Experience:
1. Click "Upload Data" button
2. Drag & drop PDF file
3. See real-time progress:
   - "Extracting content..." (10%)
   - "AI entity extraction..." (30%)
   - "Creating cases..." (60%)
   - "Auto-coding..." (90%)
   - "Complete! 3 cases created." (100%)
4. Toast notification appears
5. Table automatically refreshes
6. New cases appear instantly
```

**Technical Flow:**
```
Frontend (React)
  ↓ (FormData)
POST /api/v1/files/upload
  ↓
Backend (FastAPI)
  ↓ (Background Task)
AI Processing (Claude)
  ↓
Database (Supabase)
  ↓ (Poll Status)
GET /api/v1/files/status/{file_id}
  ↓
Frontend Updates (Real-time)
  ↓
User Sees Results ✅
```

---

## 📦 **FILES TO INSTALL**

### **New Files:**

1. **signals-page-integrated.tsx** - Updated frontend page with backend integration
2. **.env.local** - Environment configuration

### **Prerequisites (from Week 4):**

- ✅ Backend with `files.py` installed
- ✅ Database migration run
- ✅ Dependencies installed (anthropic, pdfplumber, etc.)
- ✅ Anthropic API key configured

---

## 🔧 **INSTALLATION STEPS**

### **Step 1: Update Frontend Page**

```bash
# Navigate to frontend
cd frontend

# Replace signals page
cp path/to/signals-page-integrated.tsx app/signals/page.tsx
```

---

### **Step 2: Add Environment Variable**

```bash
# Create .env.local in frontend root
cp path/to/.env.local .env.local

# Edit if needed (default is correct for development)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### **Step 3: Restart Frontend**

```bash
# From frontend directory
npm run dev

# Should see:
# ✓ Ready in 1.5s
# ○ Local: http://localhost:3001
```

---

### **Step 4: Verify Backend is Running**

```bash
# In separate terminal, navigate to backend
cd backend

# Activate venv
source venv/bin/activate  # Mac/Linux
# or
.\venv\Scripts\Activate.ps1  # Windows

# Start backend
python app/main.py

# Should see:
# INFO: Application startup complete
# INFO: Uvicorn running on http://0.0.0.0:8000
```

---

## 🧪 **TESTING THE INTEGRATION**

### **Test 1: Upload a PDF**

1. **Create test PDF with this content:**
   ```
   Adverse Event Report
   
   Patient: Jane Doe
   Age: 45 years
   Sex: Female
   
   Drug: Lipitor 20mg
   Route: Oral
   Frequency: Once daily
   Start Date: 2024-01-01
   
   Adverse Event: Severe muscle pain
   Onset Date: 2024-01-22
   Severity: Moderate
   Outcome: Recovering
   
   Additional Notes: Patient reports difficulty walking.
   CPK levels elevated to 2000 U/L.
   ```

2. **Upload via UI:**
   - Visit: http://localhost:3001/signals
   - Click "Upload Data" button
   - Drag & drop PDF or click to select
   - Watch progress bar

3. **Expected Results:**
   ```
   ✓ Progress: 10% - "Extracting content..."
   ✓ Progress: 30% - "AI entity extraction..."
   ✓ Progress: 60% - "Creating cases..."
   ✓ Progress: 90% - "Auto-coding..."
   ✓ Progress: 100% - "Complete! 1 case created."
   ✓ Toast: "Processing Complete! 1 case(s) created successfully"
   ✓ Dialog closes
   ✓ Table refreshes
   ✓ New case appears in table
   ```

---

### **Test 2: Upload an Email**

1. **Create test email (.txt file saved as .eml):**
   ```
   From: patient@example.com
   To: safety@pharma.com
   Subject: Side effect from Zoloft
   Date: Mon, 7 Dec 2024 10:00:00 -0500
   
   Hello,
   
   I started taking Zoloft (sertraline) 50mg two weeks ago for depression.
   Since then, I haven't been able to sleep at all. I'm up all night.
   Is this a common side effect? Should I stop taking it?
   
   Thanks,
   John Smith (32 years old, male)
   ```

2. **Upload and verify:**
   - Same upload process
   - AI should extract:
     - Drug: Sertraline (Zoloft)
     - Reaction: Insomnia
     - Patient: 32 year old male
     - Seriousness: Non-serious

---

### **Test 3: Upload Word Document**

1. **Create .docx file with:**
   ```
   CASE REPORT
   
   Patient Information:
   - Age: 65
   - Sex: M
   - Weight: 75 kg
   
   Medication:
   - Product: Aspirin
   - Dose: 100mg
   - Route: PO
   - Frequency: QD
   
   Event:
   - Description: Gastrointestinal hemorrhage
   - Date of Onset: 2024-12-05
   - Serious: Yes
   - Outcome: Hospitalized
   ```

2. **Upload and verify cases created**

---

## 📊 **WHAT YOU'LL SEE**

### **Upload Dialog - Before Upload:**
```
┌────────────────────────────────────────┐
│ Upload Data - ANY Format               │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │         📤                        │  │
│  │  Click to upload or drag & drop  │  │
│  │                                   │  │
│  │  📄 PDF • 📧 Email • 📝 Word    │  │
│  │  Our AI handles any format       │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### **Upload Dialog - During Processing:**
```
┌────────────────────────────────────────┐
│ Upload Data - ANY Format               │
│                                         │
│         🔄 AI Processing...            │
│         test-case.pdf                  │
│                                         │
│  ████████████░░░░░░░░░ 60%            │
│  Creating cases...                     │
│                                         │
│  ✓ Extracting content...               │
│  ✓ AI entity extraction...             │
│  ⏳ Creating cases...                  │
│  ○ Auto-coding with MedDRA...          │
└────────────────────────────────────────┘
```

### **Success Toast:**
```
┌────────────────────────────────────────┐
│ ✓ Processing Complete!                 │
│ 3 case(s) created successfully         │
└────────────────────────────────────────┘
```

### **Table Updates Automatically:**
```
All Signals (103)  [was 100 before upload]

┌──────────┬──────────────┬─────┬──────┬─────────┐
│ Drug     │ Reaction     │ PRR │ Cases│ Priority│
├──────────┼──────────────┼─────┼──────┼─────────┤
│ Lipitor  │ Muscle pain  │ 7.2 │    1 │ 🟡High  │ ← NEW
│ Aspirin  │ GI Bleed     │12.5 │1,284 │ 🔴Crit  │
│ Warfarin │ Hemorrhage   │ 8.3 │  892 │ 🟡High  │
└──────────┴──────────────┴─────┴──────┴─────────┘
```

---

## 🔄 **HOW IT WORKS**

### **Frontend Code:**

```typescript
const handleFileUpload = async (file: File) => {
  // 1. Create FormData
  const formData = new FormData();
  formData.append("file", file);
  
  // 2. Upload to backend
  const response = await fetch(`${API_URL}/api/v1/files/upload`, {
    method: "POST",
    body: formData,
  });
  
  const result = await response.json();
  const fileId = result.file_id;
  
  // 3. Poll for status updates
  pollProcessingStatus(fileId);
};

const pollProcessingStatus = async (fileId: string) => {
  // 4. Check status every 2 seconds
  const response = await fetch(`${API_URL}/api/v1/files/status/${fileId}`);
  const status = await response.json();
  
  // 5. Update UI with progress
  setProcessingStatus(status);
  
  // 6. If complete, refresh data
  if (status.status === "completed") {
    fetchSignals();  // Refresh table
    toastSuccess(`${status.cases_created} cases created!`);
  } else {
    // Continue polling
    setTimeout(() => pollProcessingStatus(fileId), 2000);
  }
};
```

---

## 💡 **FEATURES IN THIS UPDATE**

### **1. Real-Time Progress Updates**

- ✅ Progress bar (0-100%)
- ✅ Status messages update
- ✅ Checkmarks appear as steps complete
- ✅ Smooth animations

### **2. Error Handling**

- ✅ Upload failures show error toast
- ✅ Processing failures display error message
- ✅ User can try again

### **3. Automatic Table Refresh**

- ✅ New cases appear without page reload
- ✅ KPI cards update automatically
- ✅ AI priority signals recalculate

### **4. User Feedback**

- ✅ Success toast on completion
- ✅ Shows number of cases created
- ✅ Professional progress animation

---

## 🐛 **TROUBLESHOOTING**

### **Problem: "Failed to fetch"**

**Symptoms:**
- Upload button does nothing
- Console shows CORS error or network error

**Solutions:**

1. **Check backend is running:**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status": "healthy"}
   ```

2. **Check CORS settings in backend:**
   ```python
   # In backend/app/main.py
   allow_origins=[
       "http://localhost:3000",
       "http://localhost:3001",  # Make sure this is here!
   ]
   ```

3. **Check .env.local:**
   ```bash
   # Should be:
   NEXT_PUBLIC_API_URL=http://localhost:8000
   # NOT https, NOT with /api/v1
   ```

4. **Restart both servers**

---

### **Problem: Upload works but no progress**

**Symptoms:**
- File uploads
- Progress stuck at 0%
- No status updates

**Solutions:**

1. **Check backend logs:**
   ```bash
   # Look for errors in terminal running backend
   # Common issues:
   # - "Module 'anthropic' not found"
   # - "API key not found"
   # - "Permission denied" (uploads/ folder)
   ```

2. **Verify file_id is valid:**
   ```bash
   # In browser console (F12):
   # Check Network tab for /upload response
   # Should have file_id in JSON response
   ```

3. **Test status endpoint directly:**
   ```bash
   curl http://localhost:8000/api/v1/files/status/[file_id]
   ```

---

### **Problem: Cases not appearing**

**Symptoms:**
- Processing completes (100%)
- Toast says "X cases created"
- But table doesn't update

**Solutions:**

1. **Check database:**
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM pv_cases 
   WHERE source_file_id IS NOT NULL
   ORDER BY created_at DESC
   LIMIT 10;
   ```

2. **Check table refresh:**
   ```typescript
   // In browser console:
   // After upload completes, table should auto-refresh
   // If not, manually refresh page
   ```

3. **Verify API response:**
   ```bash
   curl http://localhost:8000/api/v1/signals?page_size=100
   # Should include new cases
   ```

---

### **Problem: AI extraction returns empty**

**Symptoms:**
- Processing completes
- "0 cases created"
- File had valid data

**Solutions:**

1. **Check Anthropic API key:**
   ```bash
   # In backend/.env
   ANTHROPIC_API_KEY=sk-ant-...
   # Must be valid key
   ```

2. **Check file content:**
   ```python
   # Test PDF extraction locally:
   import pdfplumber
   with pdfplumber.open("test.pdf") as pdf:
       text = pdf.pages[0].extract_text()
       print(text)
   # Should show readable text
   ```

3. **Check backend logs for AI response:**
   ```bash
   # Look for:
   # "AI extraction error: ..."
   # or
   # "AI response: []"  (empty array)
   ```

---

## 📁 **FILE STRUCTURE**

After installation:

```
aethersignal-v2/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── signals.py     ✅
│   │   │   └── files.py       ✅
│   │   └── main.py            ✅
│   ├── uploads/               ✅ (contains uploaded files)
│   └── .env                   ✅ (with ANTHROPIC_API_KEY)
│
└── frontend/
    ├── app/
    │   └── signals/
    │       └── page.tsx       ✅ (NEW - integrated version)
    └── .env.local             ✅ (NEW)
```

---

## ✅ **VERIFICATION CHECKLIST**

```
□ Frontend page updated (signals-page-integrated.tsx)
□ .env.local created with API_URL
□ Backend running (python app/main.py)
□ Frontend running (npm run dev)
□ Can visit /signals page
□ "Upload Data" button visible
□ Can open upload modal
□ Can select file
□ Upload starts (progress bar appears)
□ Progress updates in real-time
□ Toast appears on completion
□ Table refreshes automatically
□ New cases visible in table
```

---

## 🎯 **NEXT STEPS**

### **After Integration Works:**

1. **Week 6: Advanced Features**
   - Batch processing (ZIP files)
   - Audio transcription (Whisper)
   - Advanced OCR (handwritten notes)

2. **Week 7-8: Multi-Source Integration**
   - Social media monitoring (Reddit, Twitter)
   - Literature monitoring (PubMed)
   - Email integration (Gmail, Outlook)

3. **Week 9-10: Enterprise Features**
   - User management & permissions
   - Audit trail
   - Regulatory reporting
   - Custom workflows

4. **Week 11-12: Beta Testing**
   - Recruit 5-10 beta users
   - Gather feedback
   - Refine product
   - Prepare for launch

---

## 💰 **VALUE DEMONSTRATION**

**Now you can demo:**

> "Watch this. I'm going to upload a patient email 
> about a side effect. [uploads file]
> 
> See? In 30 seconds, our AI:
> - Extracted the patient info
> - Identified the drug and reaction
> - Coded it with MedDRA
> - Scored the quality
> - Created a complete case
> 
> Normally this takes 30-60 minutes of manual work.
> We just did it in 30 seconds.
> 
> That's a 98% cost reduction.
> And we can do this for ANY file format."

**This is your killer demo.** 🎯

---

## 📸 **DEMO PREPARATION**

### **Create Demo Files:**

1. **demo-email.eml** - Patient email
2. **demo-report.pdf** - Medical report
3. **demo-notes.docx** - Doctor's notes
4. **demo-batch.zip** - ZIP with 5 files

### **Record Demo Video:**

1. Visit /signals
2. Click "Upload Data"
3. Drag PDF
4. Show progress (screen record)
5. Show completion toast
6. Show new case in table
7. Export to show it's real

**Time:** 2 minutes  
**Impact:** Massive  

---

## 💬 **REPORT BACK**

After installation:

**✅ "Week 5 complete! Frontend-backend integrated!"**

Include:
- Screenshot of upload progress
- Screenshot of completed toast
- Screenshot of new case in table

**Or if stuck:**

**❌ "Issue: [describe problem]"**

Include:
- Which step failed
- Error message (console or backend logs)
- Screenshots

---

## 🚀 **YOU'RE 50% TO MVP!**

**Completed:**
- ✅ Week 1: Setup (3 hours)
- ✅ Week 2: Components (3 hours)
- ✅ Week 3: AI-first UI (2 hours)
- ✅ Week 4: AI processor backend (4 hours)
- ✅ Week 5: Frontend-backend integration (NOW!)

**Remaining:**
- ⏳ Week 6-8: Advanced features
- ⏳ Week 9-10: Enterprise features
- ⏳ Week 11-12: Beta testing

**You have a working end-to-end flow!**

The core product is DONE. Everything else is enhancement.

---

**Install Week 5 integration now and test the full flow!** 🚀

Upload a file and watch the magic happen! ✨
