# 🚀 BACKEND INSTALLATION - Step by Step

**Now that the database is ready, let's install the backend code**

---

## ✅ **DATABASE STATUS: READY**

Your database migration is complete:
- ✅ file_upload_history: 30 columns (5 new AI fields)
- ✅ pv_cases: 31 columns (4 new AI fields)
- ✅ All indexes created
- ✅ Triggers active

---

## 📦 **STEP 1: INSTALL BACKEND DEPENDENCIES**

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source venv/bin/activate  # Mac/Linux
# OR
.\venv\Scripts\Activate.ps1  # Windows

# Install new dependencies
pip install anthropic pdfplumber python-docx openpyxl pytesseract Pillow --break-system-packages

# Verify installation
pip list | grep -E "(anthropic|pdfplumber|python-docx|openpyxl)"
```

**Expected output:**
```
anthropic          0.8.1
pdfplumber         0.10.4
python-docx        1.1.0
openpyxl           3.1.2
```

---

## 📁 **STEP 2: INSTALL BACKEND FILES**

### **Option A: Manual Installation**

1. **Download files_compatible.py** from outputs
2. **Navigate to your backend directory**
3. **Copy to the right location:**

```bash
cd backend
cp ~/Downloads/files_compatible.py app/api/files.py
```

### **Option B: Create Directly**

If you don't have the file, I can show you the content to copy-paste directly into your editor.

---

## 🔑 **STEP 3: ADD ANTHROPIC API KEY**

```bash
# Edit backend/.env
nano backend/.env  # or use any text editor

# Add this line:
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Get your key from:** https://console.anthropic.com/

---

## 📝 **STEP 4: UPDATE MAIN.PY (IF NEEDED)**

Check if `app/main.py` includes the files router:

```python
from app.api.files import router as files_router

# Then later:
app.include_router(files_router)
```

If it doesn't, add it!

---

## 🚀 **STEP 5: RESTART BACKEND**

```bash
# From backend directory
python app/main.py

# Should see:
# INFO:     Application startup complete
# INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## ✅ **STEP 6: VERIFY ENDPOINTS**

Visit: http://localhost:8000/docs

**You should see:**
- POST `/api/v1/files/upload`
- GET `/api/v1/files/status/{file_id}`

---

## 🧪 **STEP 7: TEST UPLOAD**

### **Test with curl:**

```bash
# Create a test text file
echo "Patient: John Doe, 45 years old, male
Drug: Aspirin 100mg daily
Adverse Event: Stomach pain
Onset: 2024-12-01" > test_case.txt

# Upload it
curl -X POST "http://localhost:8000/api/v1/files/upload" \
  -H "accept: application/json" \
  -F "file=@test_case.txt"

# Should return:
{
  "file_id": "some-uuid",
  "filename": "test_case.txt",
  "file_type": "document",
  "size": 123,
  "status": "processing",
  "message": "File uploaded successfully. Processing started."
}
```

### **Check status:**

```bash
# Replace FILE_ID with the ID from above
curl "http://localhost:8000/api/v1/files/status/FILE_ID"

# Should return:
{
  "file_id": "some-uuid",
  "status": "processing",  # or "completed"
  "progress": 30,
  "message": "AI extracting entities...",
  "cases_created": null,
  "error": null
}
```

---

## 🎯 **STEP 8: TEST FROM FRONTEND**

Now try uploading from your frontend:

1. Visit: http://localhost:3001/signals
2. Click "Upload Data"
3. Upload test file
4. Watch progress bar update!

---

## 🐛 **TROUBLESHOOTING**

### **Error: "Module 'anthropic' not found"**

```bash
pip install anthropic --break-system-packages
```

### **Error: "Tesseract not found"**

**Mac:**
```bash
brew install tesseract
```

**Ubuntu:**
```bash
sudo apt-get install tesseract-ocr
```

**Windows:**
- Download from: https://github.com/UB-Mannheim/tesseract/wiki
- Add to PATH

### **Error: "Table 'file_upload_history' not found"**

Check your Supabase connection:
```bash
# In backend/.env, verify:
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_KEY=your-service-key
```

### **Error: "Failed to check processing status"**

This is what you're seeing now. It means:
1. ✅ Frontend is working
2. ✅ Database is ready
3. ❌ Backend endpoint not available

**Solution:** Install backend code (Step 2 above)

---

## 📋 **CHECKLIST**

Before testing:

```
□ Backend dependencies installed (anthropic, pdfplumber, etc.)
□ files.py copied to app/api/files.py
□ Anthropic API key in .env
□ main.py includes files router
□ Backend restarted
□ /docs shows upload endpoints
□ Tesseract installed (for OCR)
□ uploads/ directory exists
```

---

## 💬 **WHAT TO DO NEXT**

1. **Install backend dependencies** (Step 1)
2. **Copy files_compatible.py** to app/api/files.py (Step 2)
3. **Add Anthropic API key** to .env (Step 3)
4. **Restart backend** (Step 5)
5. **Test with curl** (Step 7)
6. **Try frontend upload** (Step 8)

---

## 🎉 **WHEN IT WORKS**

You'll see:
1. ✅ Upload file from frontend
2. ✅ Progress bar updates (10% → 30% → 60% → 90% → 100%)
3. ✅ Success toast: "3 cases created!"
4. ✅ Table refreshes automatically
5. ✅ New cases appear in table

---

**Start with Step 1 now!** Let me know if you need help with any step.
