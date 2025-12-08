# 📚 SESSIONS CONCEPT EXPLAINED

## 🎯 What is a Session?

A **session** is like a **folder** or **batch** that groups file uploads together. It helps you:
- **Organize** your uploads by date or project
- **Filter** signals by which session they came from
- **Track** what files were uploaded together
- **Analyze** data from specific time periods or projects

---

## 💡 How Sessions Work

### **Two Types of Sessions:**

#### 1. **AUTO Sessions (Date-Based)** 📅
- **Created automatically** when you upload a file
- **Named by date**: "Session 2024-12-08"
- **All files uploaded on the same day** → Same session
- **Purpose**: Simple organization by date

**Example:**
```
Session 2024-12-08 (Today)
├── file1.pdf → 10 cases
├── file2.xlsx → 15 cases
└── file3.pdf → 8 cases
Total: 33 cases
```

#### 2. **MANUAL Sessions (Named)** ✏️
- **You create and name them** (e.g., "Trial ABC-123", "Q4 Batch Upload")
- **Can span multiple days**
- **Purpose**: Organize by project, trial, or custom grouping

**Example:**
```
Session: "Trial ABC-123"
├── file1.pdf → 10 cases (uploaded Dec 1)
├── file2.xlsx → 15 cases (uploaded Dec 5)
└── file3.pdf → 8 cases (uploaded Dec 8)
Total: 33 cases (spans 8 days)
```

---

## 🔍 Why You See Two "Today" Cards

### **The Problem:**
You're seeing **multiple sessions created for the same day**, which is a bug!

### **Why This Happens:**
1. **Session Status Issue**: The function only looks for `status = 'active'` sessions
   - If a session was marked as `'completed'`, it creates a new one
   - Result: Multiple sessions for the same day

2. **Race Condition**: If multiple files are uploaded simultaneously
   - Each upload might check for a session before one is created
   - Result: Multiple sessions created

3. **Timing Issue**: Sessions created at different times might not be detected
   - The lookup might miss sessions created seconds apart
   - Result: Duplicate sessions

### **What You're Seeing:**
```
SESSIONS:
├── All Sessions (1 files • 0 cases) ← Total across all sessions
├── Today (1 files • 0 cases) ← Session 1 created today
└── Today (0 files • 0 cases) ← Session 2 created today (duplicate!)
```

---

## ✅ The Fix

I've updated the `get_or_create_session_for_upload()` function to:
1. **Look for ANY session today** (not just 'active')
2. **Reuse existing sessions** instead of creating duplicates
3. **Reactivate completed sessions** if needed

### **After Fix:**
```
SESSIONS:
├── All Sessions (1 files • 0 cases)
└── Today (1 files • 0 cases) ← Only ONE session for today!
```

---

## 🎯 How to Use Sessions

### **Filtering by Session:**
1. Click on a session in the sidebar
2. Signals will filter to show only cases from that session
3. Click "All Sessions" to see everything

### **Creating Named Sessions:**
1. Use the API: `POST /api/v1/sessions/`
2. Provide a name: `{"name": "Trial ABC-123"}`
3. All subsequent uploads will use that session

### **Session Statistics:**
Each session shows:
- **Files count**: How many files were uploaded
- **Cases created**: How many cases were extracted
- **Valid/Invalid**: Data quality metrics

---

## 📊 Real-World Example

**Scenario**: You're running a clinical trial

1. **Create Named Session**: "Trial ABC-123"
2. **Upload Files**: All trial data files
3. **Filter Signals**: Click "Trial ABC-123" to see only trial cases
4. **Compare**: Switch to "All Sessions" to compare with other data

**Result**: Clean separation between trial data and other uploads!

---

## 🔧 Technical Details

### **Database Structure:**
- `upload_sessions` table stores session metadata
- `file_uploads` table links files to sessions via `session_id`
- `pv_cases` table links cases to files via `upload_id`

### **Auto-Creation Logic:**
- Trigger fires when a file is uploaded
- Checks if a session exists for today
- Creates one if missing, reuses if exists
- Updates session statistics automatically

---

## ❓ FAQ

**Q: Can I delete a session?**
A: Yes, but you'd need to handle the files/cases first. Sessions are mainly for organization.

**Q: Can I merge sessions?**
A: Not directly, but you can reassign files to a different session via the database.

**Q: What happens to old sessions?**
A: They remain in the database for historical tracking. You can filter by them anytime.

**Q: Why do I see "0 cases" for some sessions?**
A: The files might still be processing, or they might not have extracted any valid cases yet.

---

## 🎉 Summary

- **Sessions = Folders for organizing uploads**
- **Auto-sessions = One per day (automatic)**
- **Manual sessions = Named by you (custom)**
- **Two "Today" = Bug (now fixed!)**
- **Use sessions to filter and organize your data**

