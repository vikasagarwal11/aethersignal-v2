# 📋 Test Files for AI Extraction

These sample files are designed to test the AI-powered file upload and case extraction functionality.

---

## 📄 **Available Test Files**

### **1. sample_case_1.txt**
- **Content:** Single case with Lipitor (statin) causing muscle pain
- **Expected:** 1 case extracted
- **Key Data:** Patient age 52, female, serious event, hospitalization

### **2. sample_case_2.txt**
- **Content:** Single case with Aspirin causing GI bleeding
- **Expected:** 1 case extracted
- **Key Data:** Patient age 45, male, serious event, life-threatening

### **3. sample_case_3.txt**
- **Content:** Multiple drugs and multiple events
- **Expected:** 2 cases extracted (Ibuprofen + Metformin)
- **Key Data:** Patient age 38, male, 2 separate adverse events

### **4. sample_case_4.txt**
- **Content:** Single case with Warfarin causing bleeding
- **Expected:** 1 case extracted
- **Key Data:** Patient age 67, female, serious event, INR elevation

---

## 🧪 **Testing Instructions**

### **Step 1: Start Backend**
```bash
cd backend
python run.py
```

### **Step 2: Start Frontend** (in another terminal)
```bash
cd frontend
npm run dev
```

### **Step 3: Test Upload**
1. Visit: http://localhost:3001/signals
2. Click "Upload Data" button
3. Upload one of the test files
4. Watch the progress bar
5. Check backend logs for:
   - `✓ Parsed from markdown json block`
   - `✓ Successfully extracted X entities`
   - `Created case: ...`

### **Step 4: Verify Results**
1. Check frontend table for new cases
2. Check database:
   ```sql
   SELECT 
       drug_name,
       reaction,
       age,
       sex,
       serious,
       ai_extracted,
       ai_confidence
   FROM pv_cases
   WHERE source_file_id IS NOT NULL
   ORDER BY created_at DESC;
   ```

---

## ✅ **Expected Results**

After uploading each file, you should see:

- ✅ Progress: 10% → 30% → 60% → 90% → 100%
- ✅ Backend logs showing successful parsing
- ✅ Cases created in database
- ✅ Cases visible in frontend table
- ✅ KPI cards updated (Total Cases)

---

## 🎯 **What to Look For**

### **Success Indicators:**
- ✅ No "AI extraction error" messages
- ✅ "✓ Parsed from..." messages in logs
- ✅ "✓ Successfully extracted X entities" in logs
- ✅ Cases appear in `pv_cases` table
- ✅ `ai_extracted = true` in database
- ✅ `ai_confidence` values between 0.5-1.0

### **If Errors Occur:**
- Check backend logs for detailed error messages
- Verify Anthropic API key is set
- Check database connection
- Verify file content was extracted

---

## 📊 **Test Scenarios**

1. **Single Case Test:** Upload `sample_case_1.txt` or `sample_case_2.txt`
2. **Multiple Cases Test:** Upload `sample_case_3.txt` (should extract 2 cases)
3. **Serious Event Test:** Upload `sample_case_4.txt` (serious = true)
4. **Batch Test:** Upload all files one by one

---

**Happy Testing!** 🚀

