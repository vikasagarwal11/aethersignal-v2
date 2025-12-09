# 🧪 Testing Multi-Tenant Features Guide

## ✅ Migration Status
**Migration 009 executed successfully!** The database is ready for organization-scoped sessions.

---

## 🎯 What to Test

### **1. Organization-Scoped Sessions**
- Sessions should be filtered by organization
- Each organization sees only their own sessions

### **2. Multi-User Filtering**
- Filter signals by: User / Team / Organization
- Team selection should work

### **3. Frontend Filtering UI**
- Advanced Filters section should show "Analysis Scope" options
- Team member selection should appear when "My Team" is selected

---

## 📋 Step-by-Step Testing Instructions

### **STEP 1: Set Up Test Data (Browser Console)**

Open your browser console (F12) and run:

```javascript
// Set your test organization and user ID
localStorage.setItem('organization', 'PharmaCorp');
localStorage.setItem('userId', 'user1');

// Refresh the page
window.location.reload();
```

**Test Organizations:**
- `PharmaCorp` (for testing)
- `BioTechInc` (for testing)
- `MedResearch` (for testing)

**Test User IDs:**
- `user1` (John Doe)
- `user2` (Jane Smith)
- `user3` (Bob Johnson)

---

### **STEP 2: Test Organization-Scoped Sessions**

**Location:** Left Sidebar → "SESSIONS" section

**What to Check:**
1. ✅ Sessions should only show for your organization
2. ✅ If you change organization in localStorage, sessions should update
3. ✅ No duplicate "Today" entries (should be fixed)

**How to Test:**
```javascript
// In browser console:
// 1. Check current organization
console.log('Current org:', localStorage.getItem('organization'));

// 2. Change organization
localStorage.setItem('organization', 'BioTechInc');
window.location.reload();

// 3. Verify sessions changed
```

**Expected Result:**
- Sessions sidebar shows only sessions for your organization
- If you have no sessions for that org, it should be empty or show "All Sessions: 0 files"

---

### **STEP 3: Test Multi-User Filtering UI**

**Location:** Main Content → "Advanced Filters" button (top right of table)

**Steps:**
1. Click **"Advanced Filters"** button (next to search bar)
2. Scroll down to **"Analysis Scope"** section
3. You should see 3 radio buttons:
   - ✅ **"My Files Only"** (User level)
   - ✅ **"My Team"** (Team level)
   - ✅ **"All Organization"** (Organization level - default)

**Test Each Option:**

#### **A. Test "My Files Only"**
1. Select **"My Files Only"** radio button
2. Signals should filter to only your files
3. Check browser Network tab → Should see `user_ids=user1` in API call

#### **B. Test "My Team"**
1. Select **"My Team"** radio button
2. Team member selection should appear below
3. Select team members (checkboxes)
4. Signals should filter to selected users' files
5. Check browser Network tab → Should see `user_ids=user1,user2` in API call

#### **C. Test "All Organization"**
1. Select **"All Organization"** radio button
2. Signals should show all files from your organization
3. Check browser Network tab → Should see `organization=PharmaCorp` in API call

---

### **STEP 4: Test File Upload with Organization**

**Location:** "Upload Data" button (top right)

**Steps:**
1. Click **"Upload Data"** button
2. Upload a test file
3. Check browser Network tab → Upload request should include:
   - `organization: "PharmaCorp"`
   - `user_id: "user1"`

**Verify in Database:**
```sql
-- Check file_uploads table
SELECT id, filename, organization, user_id, session_id 
FROM file_uploads 
ORDER BY uploaded_at DESC 
LIMIT 5;

-- Check upload_sessions table
SELECT id, name, organization, files_count, cases_created 
FROM upload_sessions 
WHERE organization = 'PharmaCorp'
ORDER BY started_at DESC;
```

**Expected Result:**
- File should be linked to your organization
- Session should be created with your organization
- File should be linked to your user_id

---

### **STEP 5: Test API Endpoints Directly**

#### **A. Test Sessions API**
```bash
# Get sessions for your organization
curl "http://localhost:8000/api/v1/sessions/?organization=PharmaCorp"
```

**Expected:** Only sessions for PharmaCorp

#### **B. Test Signals API - User Level**
```bash
# Get signals for specific user
curl "http://localhost:8000/api/v1/signals?organization=PharmaCorp&user_ids=user1"
```

**Expected:** Only signals from user1's files

#### **C. Test Signals API - Team Level**
```bash
# Get signals for multiple users (team)
curl "http://localhost:8000/api/v1/signals?organization=PharmaCorp&user_ids=user1,user2,user3"
```

**Expected:** Signals from all 3 users' files

#### **D. Test Signals API - Organization Level**
```bash
# Get signals for entire organization
curl "http://localhost:8000/api/v1/signals?organization=PharmaCorp"
```

**Expected:** All signals from PharmaCorp

---

## 🔍 Debugging Tips

### **Check Browser Console**
```javascript
// Check current settings
console.log('Organization:', localStorage.getItem('organization'));
console.log('User ID:', localStorage.getItem('userId'));

// Check API calls
// Open Network tab → Filter by "signals" or "sessions"
// Look for query parameters: organization, user_ids
```

### **Check Backend Logs**
```bash
# Watch backend logs for API calls
cd backend
python run.py
# Look for organization and user_ids in logs
```

### **Check Database**
```sql
-- Verify organization is set on sessions
SELECT id, name, organization, files_count 
FROM upload_sessions 
ORDER BY started_at DESC;

-- Verify organization is set on files
SELECT id, filename, organization, user_id 
FROM file_uploads 
ORDER BY uploaded_at DESC 
LIMIT 10;
```

---

## 🐛 Common Issues & Fixes

### **Issue 1: Sessions showing for all organizations**
**Fix:** Update `SessionSidebar.tsx` to pass organization parameter

### **Issue 2: Filtering not working**
**Fix:** Check browser console for errors, verify localStorage values

### **Issue 3: Team members not showing**
**Fix:** Update `fetchAvailableUsers()` to fetch from your user service

### **Issue 4: Duplicate "Today" sessions**
**Fix:** Should be fixed by migration 008, but check if organization is being set correctly

---

## ✅ Success Criteria

### **Organization Scoping:**
- ✅ Sessions filtered by organization
- ✅ Files linked to organization
- ✅ Signals filtered by organization

### **Multi-User Filtering:**
- ✅ "My Files Only" shows only your files
- ✅ "My Team" shows selected team members' files
- ✅ "All Organization" shows all org files

### **UI:**
- ✅ Advanced Filters shows "Analysis Scope" section
- ✅ Team member selection appears when "My Team" selected
- ✅ Filter changes update signals table immediately

---

## 📝 Next Steps After Testing

1. **Connect to Real Auth System:**
   - Replace localStorage with actual auth tokens
   - Get organization from JWT or session

2. **Implement User Management:**
   - Connect `fetchAvailableUsers()` to your user service
   - Add team management UI

3. **Add Organization Management:**
   - Organization switcher in UI
   - Organization settings page

4. **Performance Testing:**
   - Test with large datasets (1000+ files)
   - Verify filtering performance

---

## 🎯 Quick Test Checklist

- [ ] Set organization in localStorage
- [ ] Set userId in localStorage
- [ ] Refresh page
- [ ] Check sessions sidebar (should show org-scoped sessions)
- [ ] Click "Advanced Filters"
- [ ] Test "My Files Only" filter
- [ ] Test "My Team" filter (select team members)
- [ ] Test "All Organization" filter
- [ ] Upload a file (check organization/user_id in network tab)
- [ ] Verify file appears in correct session
- [ ] Check database (organization set correctly)

---

**Ready to test!** 🚀

