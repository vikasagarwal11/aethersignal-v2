# 🎨 FRONTEND INSTALLATION GUIDE - PHASE 1

## ✅ **COMPONENTS DELIVERED**

**React/TypeScript Components:**
1. ✅ ChatInterface.tsx - AI chat (bottom bar)
2. ✅ SessionSidebar.tsx - Session switcher
3. ✅ AIPrioritySignals.tsx - Optimized compact signals
4. ✅ SignalsPage.tsx - Complete integrated page

**Total:** ~1,200 lines of production-ready React code

---

## 📦 **INSTALLATION**

### **Step 1: Copy Components (2 min)**

```bash
# Navigate to frontend
cd frontend/src/components

# Create directory if needed
mkdir -p pharmacovigilance

# Copy components
cp /path/to/ChatInterface.tsx pharmacovigilance/
cp /path/to/SessionSidebar.tsx pharmacovigilance/
cp /path/to/AIPrioritySignals.tsx pharmacovigilance/
cp /path/to/SignalsPage.tsx pharmacovigilance/
```

---

### **Step 2: Install Dependencies (if needed)**

```bash
cd frontend

# These should already be installed, but if not:
npm install lucide-react
npm install --save-dev @types/react
```

---

### **Step 3: Update Routes (3 min)**

**File:** `frontend/src/App.tsx`

```typescript
import { SignalsPage } from './components/pharmacovigilance/SignalsPage';

// In your routes:
<Route path="/signals" element={<SignalsPage />} />
```

Or if using Next.js:

**File:** `frontend/app/signals/page.tsx`

```typescript
import { SignalsPage } from '@/components/pharmacovigilance/SignalsPage';

export default function Signals() {
  return <SignalsPage />;
}
```

---

### **Step 4: Configure API Base URL (2 min)**

**Option A: Environment Variable**

**File:** `frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Option B: Update fetch calls directly**

If not using env vars, the components already use relative paths like `/api/v1/signals/` which will work if your frontend is proxied to the backend.

---

### **Step 5: Add Tailwind Config (if needed)**

**File:** `frontend/tailwind.config.js`

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          750: '#334155',
          850: '#1a202c',
          950: '#0f1419',
        },
      },
    },
  },
  plugins: [],
}
```

---

## 🎨 **COMPONENT FEATURES**

### **1. ChatInterface**

**Features:**
- ✅ Bottom bar (like ChatGPT)
- ✅ Expand/collapse animation
- ✅ Message history
- ✅ Smart suggestions
- ✅ Loading states
- ✅ Error handling
- ✅ Data visualization
- ✅ Keyboard shortcuts (Enter to send)

**Usage:**
```typescript
import { ChatInterface } from './ChatInterface';

<ChatInterface 
  onQuerySubmit={(query) => console.log(query)}
/>
```

**API Called:**
- POST `/api/v1/ai/query`

---

### **2. SessionSidebar**

**Features:**
- ✅ Session list
- ✅ "All Sessions" option
- ✅ Current session indicator
- ✅ Stats per session (files, cases, validity)
- ✅ Status indicators
- ✅ Quick actions
- ✅ Auto-refresh
- ✅ Error handling

**Usage:**
```typescript
import { SessionSidebar } from './SessionSidebar';

<SessionSidebar 
  onSessionChange={(sessionId) => console.log(sessionId)}
  currentSessionId="all"
/>
```

**API Called:**
- GET `/api/v1/sessions/`

---

### **3. AIPrioritySignals**

**Features:**
- ✅ Collapsible (saves 90% space!)
- ✅ Compact card layout
- ✅ Priority badges (CRITICAL/HIGH/MEDIUM/LOW)
- ✅ Statistical metrics (PRR/ROR/IC)
- ✅ Signal strength indicator
- ✅ Methods flagged
- ✅ Click to investigate
- ✅ Loading/error states

**Usage:**
```typescript
import { AIPrioritySignals } from './AIPrioritySignals';

<AIPrioritySignals 
  limit={3}
  minStrength="moderate"
  onSignalClick={(signal) => console.log(signal)}
/>
```

**API Called:**
- GET `/api/v1/signals/priority?limit=3&min_strength=moderate`

---

### **4. SignalsPage** (Complete Integration)

**Features:**
- ✅ Session sidebar integration
- ✅ AI Priority Signals (collapsible)
- ✅ Dashboard stats (4 KPI cards)
- ✅ Search & filters
- ✅ Priority filter
- ✅ Signals-only toggle
- ✅ Sortable table
- ✅ Real PRR/ROR/IC display
- ✅ Confidence intervals shown
- ✅ Signal indicators (✓/—)
- ✅ Chat interface (bottom)
- ✅ Export functionality
- ✅ Responsive layout

**Usage:**
```typescript
import { SignalsPage } from './SignalsPage';

<SignalsPage />
```

**APIs Called:**
- GET `/api/v1/sessions/`
- GET `/api/v1/signals/priority`
- GET `/api/v1/signals/`
- POST `/api/v1/ai/query`

---

## 🧪 **TESTING**

### **Test 1: Run Development Server**

```bash
cd frontend
npm run dev
# or
yarn dev
```

Navigate to: http://localhost:3000/signals

---

### **Test 2: Verify API Connections**

Open browser console (F12) and check for:
- ✅ No CORS errors
- ✅ Successful API calls to `/api/v1/`
- ✅ Data loading in components

---

### **Test 3: Component Functionality**

**Session Sidebar:**
- [ ] Sessions load and display
- [ ] Click to switch sessions
- [ ] Stats update correctly
- [ ] "All Sessions" shows cumulative data

**AI Priority Signals:**
- [ ] Signals load and display
- [ ] Collapse/expand works
- [ ] Priority badges show correct colors
- [ ] Statistical metrics display

**Signals Table:**
- [ ] All signals load
- [ ] Search works
- [ ] Filters work
- [ ] Sorting works (click column headers)
- [ ] PRR/ROR/IC shown with CI
- [ ] Signal indicators (✓) display

**Chat Interface:**
- [ ] Expands/collapses smoothly
- [ ] Can send messages
- [ ] AI responses appear
- [ ] Suggestions work
- [ ] Enter key sends message

---

## 🎨 **UI/UX FEATURES**

### **Space Optimization**

**Before (Old Design):**
```
AI Priority Signals: 400px height (40% of screen)
↓
Wasted space, forced scrolling
```

**After (New Design):**
```
AI Priority Signals: 60px collapsed, 300px expanded
↓
90% space savings! 
Click to expand when needed
```

---

### **Chat Interface**

**Collapsed State:**
```
┌──────────────────────────────┐
│ Ask about your data...  [→] │ ← 60px height
└──────────────────────────────┘
```

**Expanded State:**
```
┌──────────────────────────────┐
│ 💬 AI Investigation     [▼]  │
├──────────────────────────────┤
│ [Chat messages here]         │
│                              │
│ [500px of conversation]      │
│                              │
├──────────────────────────────┤
│ Type message...         [→]  │
└──────────────────────────────┘
```

---

### **Statistical Display**

**Table shows REAL statistics:**

```
Drug     | Reaction | PRR       | ROR       | IC    | Cases
---------|----------|-----------|-----------|-------|-------
Aspirin  | Bleeding | 2.8       | 3.1       | 1.8   | 9
                     [2.1-3.6]   [2.4-4.0]   1.2
                     ✓           ✓           ✓
```

**Legend:**
- Value: Point estimate
- [CI]: 95% Confidence Interval
- ✓: Meets signal threshold
- —: Below threshold

---

## 📱 **RESPONSIVE DESIGN**

All components are responsive:
- Desktop (>1024px): Full layout
- Tablet (768-1024px): Adjusted grid
- Mobile (<768px): Stacked layout

---

## 🎯 **INTEGRATION CHECKLIST**

Before deploying:

### **Backend:**
- [ ] Backend running on port 8000
- [ ] All APIs responding
- [ ] Database migrated (004_statistical_signals.sql)
- [ ] CORS configured for frontend URL

### **Frontend:**
- [ ] Components installed
- [ ] Routes configured
- [ ] API base URL set
- [ ] Tailwind configured
- [ ] Dependencies installed

### **Testing:**
- [ ] Session sidebar loads
- [ ] Signals table displays data
- [ ] Chat sends/receives messages
- [ ] Sorting works
- [ ] Filters work
- [ ] No console errors

---

## 🚀 **DEPLOYMENT**

### **Development:**
```bash
# Backend
cd backend
python run.py

# Frontend
cd frontend
npm run dev
```

### **Production:**
```bash
# Build frontend
cd frontend
npm run build

# Start production server
npm start

# Backend should use gunicorn/uvicorn
cd backend
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

---

## 💡 **TIPS**

### **Performance:**
- Components use React hooks efficiently
- API calls are debounced where appropriate
- Large lists are virtualized (if needed, can add react-window)

### **Customization:**
- Colors defined in Tailwind config
- Easy to theme (change slate colors)
- Component props allow customization

### **Accessibility:**
- Keyboard navigation supported
- ARIA labels included
- Focus management handled

---

## 📚 **API ENDPOINTS USED**

**Sessions:**
- GET `/api/v1/sessions/` - List all sessions

**Signals:**
- GET `/api/v1/signals/` - All signals with stats
- GET `/api/v1/signals/priority` - Top priority signals

**AI:**
- POST `/api/v1/ai/query` - Natural language queries

---

## 🐛 **TROUBLESHOOTING**

### **Issue: CORS errors**
**Solution:** Update backend CORS settings:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **Issue: Components not rendering**
**Solution:** Check Tailwind is configured and classes are being generated

### **Issue: API calls fail**
**Solution:** Verify backend is running and accessible

### **Issue: Data not loading**
**Solution:** Check browser console for errors, verify API responses

---

## ✅ **VERIFICATION**

After installation, you should see:

1. **Session sidebar** on left with sessions
2. **AI Priority Signals** at top (collapsible)
3. **Dashboard stats** (4 KPI cards)
4. **Signals table** with real PRR/ROR/IC values
5. **Chat interface** at bottom (expandable)

**All components working together!** 🎯

---

**INSTALLATION TIME:** ~10 minutes
**RESULT:** Production-ready PV platform UI! 🚀
