# 🏢 Multi-Tenant Sessions Design

## ✅ **YOUR UNDERSTANDING IS 100% CORRECT!**

This is exactly how it should work for enterprise multi-tenant scenarios.

---

## 🎯 **Design Overview**

### **Session Scope: Organization-Level**
- **Sessions are shared** across all users in the same organization
- **One session per day per organization** (e.g., "Session 2024-12-08" for "PharmaCorp")
- **All users in org** see the same sessions

### **File Tracking: User-Level**
- **Each file tracks** which user uploaded it (`user_id`)
- **Each file tracks** which organization it belongs to (`organization`)
- **Full audit trail** of who uploaded what

### **Analysis Flexibility: Multi-Level**
Users can analyze data at:
1. **User Level**: Only my files
2. **Team Level**: Selected users within my organization
3. **Organization Level**: All users in my organization

---

## 📊 **Example Scenario**

### **Organization: "PharmaCorp"**
- **5 users** in the organization
- **65 files** uploaded today
- **Session**: "Session 2024-12-08" (shared by all 5 users)

### **File Tracking:**
```
Session: "Session 2024-12-08" (PharmaCorp)
├── file1.pdf → uploaded by User A (john@pharmacorp.com)
├── file2.xlsx → uploaded by User B (jane@pharmacorp.com)
├── file3.pdf → uploaded by User A (john@pharmacorp.com)
├── file4.csv → uploaded by User C (bob@pharmacorp.com)
├── ... (61 more files)
└── file65.pdf → uploaded by User E (alice@pharmacorp.com)

Total: 65 files from 5 users
```

### **Analysis Options:**

#### **1. User-Level Analysis (John's View)**
```
Filter: user_id = "john@pharmacorp.com"
Result: 
  - file1.pdf (10 cases)
  - file3.pdf (8 cases)
  - Total: 18 cases from John's files
```

#### **2. Team-Level Analysis (Manager's View)**
```
Filter: user_id IN ["john@pharmacorp.com", "jane@pharmacorp.com", "bob@pharmacorp.com"]
Result:
  - All files from Team 1 (John, Jane, Bob)
  - Total: 45 cases from Team 1's files
```

#### **3. Organization-Level Analysis (Manager's View)**
```
Filter: organization = "PharmaCorp"
Result:
  - All 65 files from all 5 users
  - Total: 200 cases from entire organization
```

---

## 🏗️ **Current Implementation Status**

### ✅ **Already Implemented:**

1. **File Upload Tracking**
   - ✅ `file_uploads` table has `user_id` field
   - ✅ `file_uploads` table has `organization` field
   - ✅ Files API filters by `user_id` and `organization`
   - ✅ Signals API filters by `organization`

2. **Data Chain**
   - ✅ `pv_cases` → `upload_id` → `file_uploads.id`
   - ✅ `file_uploads` → `user_id` and `organization`
   - ✅ Can trace every case back to the user who uploaded it

### ❌ **Missing (Needs Implementation):**

1. **Session Organization Scoping**
   - ❌ `upload_sessions` table doesn't have `organization` field
   - ❌ Sessions are currently global (all orgs see all sessions)
   - ❌ Need to add `organization` to sessions

2. **Multi-User Filtering**
   - ❌ Signals API doesn't support filtering by multiple users
   - ❌ No "team selection" UI/API
   - ❌ Need to add `user_ids[]` parameter

3. **UI Filtering Options**
   - ❌ Frontend doesn't have user/team selection dropdown
   - ❌ No "My Files" vs "Team Files" vs "All Org Files" toggle
   - ❌ Need to add filtering UI

---

## 🔧 **Implementation Plan**

### **Step 1: Add Organization to Sessions**

```sql
-- Migration: Add organization to upload_sessions
ALTER TABLE upload_sessions 
ADD COLUMN organization TEXT;

CREATE INDEX idx_upload_sessions_organization 
ON upload_sessions(organization);

-- Update function to filter by organization
CREATE OR REPLACE FUNCTION get_or_create_session_for_upload(org_name TEXT)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
    today_start TIMESTAMP;
    today_end TIMESTAMP;
BEGIN
    today_start := DATE_TRUNC('day', NOW());
    today_end := today_start + INTERVAL '1 day';
    
    -- Find session for THIS organization and today
    SELECT id INTO session_id
    FROM upload_sessions
    WHERE is_auto = true
      AND organization = org_name  -- NEW: Filter by organization
      AND started_at >= today_start
      AND started_at < today_end
    ORDER BY started_at DESC
    LIMIT 1;
    
    -- Create if doesn't exist
    IF session_id IS NULL THEN
        INSERT INTO upload_sessions (name, started_at, is_auto, status, organization)
        VALUES (
            'Session ' || CURRENT_DATE::text,
            NOW(),
            true,
            'active',
            org_name  -- NEW: Set organization
        )
        RETURNING id INTO session_id;
    END IF;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;
```

### **Step 2: Update Sessions API**

```python
@router.get("/", response_model=List[SessionSummary])
async def get_sessions(
    limit: int = Query(50, ge=1, le=100),
    organization: Optional[str] = Query(None)  # NEW: Filter by org
):
    """Get sessions for current user's organization"""
    # Get user's organization from auth token
    user_org = get_current_user_organization()  # From auth
    
    query = supabase.table("upload_sessions")\
        .select("*")\
        .eq("organization", user_org)  # NEW: Filter by org
        .order("started_at", desc=True)\
        .limit(limit)
    
    # ... rest of code
```

### **Step 3: Add Multi-User Filtering to Signals API**

```python
@router.get("", response_model=List[Signal])
async def get_signals(
    organization: Optional[str] = Query(None),
    user_ids: Optional[List[str]] = Query(None),  # NEW: Multiple users
    team_id: Optional[str] = Query(None),  # NEW: Predefined team
    # ... other filters
):
    """
    Get signals with flexible filtering:
    - organization: Filter by org (required for multi-tenant)
    - user_ids: Filter by specific users (team selection)
    - team_id: Filter by predefined team
    """
    # Build query
    query = "SELECT * FROM pv_cases WHERE 1=1"
    
    if organization:
        query += f" AND organization = '{organization}'"
    
    if user_ids:
        # Filter by multiple users
        user_ids_str = "', '".join(user_ids)
        query += f"""
            AND upload_id IN (
                SELECT id FROM file_uploads 
                WHERE user_id IN ('{user_ids_str}')
            )
        """
    
    if team_id:
        # Get team members from teams table
        team_users = get_team_members(team_id)
        user_ids_str = "', '".join(team_users)
        query += f"""
            AND upload_id IN (
                SELECT id FROM file_uploads 
                WHERE user_id IN ('{user_ids_str}')
            )
        """
    
    # ... execute query
```

### **Step 4: Add Frontend Filtering UI**

```typescript
// Filter options in signals page
const [filterLevel, setFilterLevel] = useState<'user' | 'team' | 'organization'>('organization');
const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

// Filter dropdown
<select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
  <option value="user">My Files Only</option>
  <option value="team">My Team</option>
  <option value="organization">All Organization</option>
</select>

// Team/user selection (if team level)
{filterLevel === 'team' && (
  <MultiSelect
    options={teamMembers}
    selected={selectedUsers}
    onChange={setSelectedUsers}
    placeholder="Select team members..."
  />
)}
```

---

## 📋 **Data Flow**

### **Upload Flow:**
```
1. User uploads file
   ↓
2. File saved with user_id and organization
   ↓
3. Get/create session for organization + today
   ↓
4. Link file to session
   ↓
5. Process file → Create cases
   ↓
6. Cases linked to file (upload_id)
   ↓
7. Can trace: Case → File → User → Organization
```

### **Analysis Flow:**
```
1. User selects filter level:
   - "My Files" → Filter by current_user_id
   - "My Team" → Filter by selected user_ids
   - "All Org" → Filter by organization only
   ↓
2. Query signals with filter
   ↓
3. Join with file_uploads to get user info
   ↓
4. Display results with user attribution
```

---

## 🎯 **Use Cases**

### **Use Case 1: Individual User**
**Scenario**: John wants to see only his uploaded files

**Action**:
- Select filter: "My Files Only"
- API filters: `user_id = "john@pharmacorp.com"`
- Result: Only cases from John's files

### **Use Case 2: Team Manager**
**Scenario**: Manager wants to analyze Team 1's data

**Action**:
- Select filter: "My Team"
- Select team: "Team 1" (John, Jane, Bob)
- API filters: `user_id IN ["john", "jane", "bob"]`
- Result: Cases from Team 1's files only

### **Use Case 3: Organization Manager**
**Scenario**: Director wants to see all organization data

**Action**:
- Select filter: "All Organization"
- API filters: `organization = "PharmaCorp"`
- Result: All cases from all users in organization

### **Use Case 4: Cross-Team Analysis**
**Scenario**: Manager wants to compare Team 1 vs Team 2

**Action**:
- Select filter: "Custom Selection"
- Select users: Team 1 members
- Run analysis → Save as "Team 1 Analysis"
- Select users: Team 2 members
- Run analysis → Save as "Team 2 Analysis"
- Compare results

---

## ✅ **Summary**

### **Your Understanding:**
✅ Sessions = Organization-level (shared)  
✅ Files = User-level tracking (who uploaded what)  
✅ Analysis = Multi-level (user/team/org)  
✅ Manager = Can analyze team or full org  

### **Implementation Status:**
✅ File tracking (user_id, organization) - **DONE**  
✅ Signals filtering by organization - **DONE**  
❌ Session organization scoping - **NEEDS IMPLEMENTATION**  
❌ Multi-user filtering - **NEEDS IMPLEMENTATION**  
❌ UI filtering options - **NEEDS IMPLEMENTATION**  

### **Next Steps:**
1. Add `organization` to `upload_sessions` table
2. Update session creation to use organization
3. Add multi-user filtering to signals API
4. Add filtering UI to frontend
5. Add team management (optional, for predefined teams)

---

## 🚀 **Ready to Implement?**

This is a **perfect design** for enterprise multi-tenancy! Should I implement:
1. Organization-scoped sessions?
2. Multi-user filtering API?
3. Frontend filtering UI?

