# 📱 AetherSignal V2: Screen Specifications & Wireframes

**Complete UI/UX specifications for all 5 core screens**

---

## 🎯 **NAVIGATION ARCHITECTURE**

### **Three-Layer System**

```
┌─────────────────────────────────────────────────────────────┐
│  TOP NAV (Fixed, 64px height)                               │
│  [Logo] [Workspace ▼] [Search Cmd+K] [Notifications] [User]│
└─────────────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────────────────┐
│          │                                                  │
│ SIDEBAR  │  MAIN CANVAS                                     │
│ (256px)  │  (flex-1, full-width workspace)                  │
│          │                                                  │
│ Context  │  Current screen content                          │
│ Nav +    │  Responsive grid layout                          │
│ Quick    │  Focus on work                                   │
│ Actions  │                                                  │
│          │                                                  │
│ (collap  │                                                  │
│ sible)   │                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

---

## 📄 **SCREEN 1: LANDING PAGE (Public)**

### **Purpose**
Convert visitors to trial users without overwhelming them.

### **Layout Structure**

```
┌─────────────────────────────────────────────────────────────┐
│  NAV: [Logo] [Product] [Pricing] [Docs] [Login] [Try Free] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      HERO SECTION                           │
│                                                             │
│  ┌───────────────────────┐  ┌──────────────────────────┐   │
│  │  LEFT (50%)           │  │  RIGHT (50%)             │   │
│  │                       │  │                          │   │
│  │  H1: Detect Signals   │  │  [Animated Dashboard]    │   │
│  │  10x Faster with AI   │  │  Preview                 │   │
│  │                       │  │                          │   │
│  │  Subhead: Quantum-    │  │  Shows:                  │   │
│  │  powered pharmaco-    │  │  - Signal cards          │   │
│  │  vigilance platform   │  │  - Data flowing          │   │
│  │                       │  │  - AI insights           │   │
│  │  [Start Free Trial]   │  │  - Quantum scores        │   │
│  │  [Book Demo]          │  │                          │   │
│  │                       │  │                          │   │
│  │  ✓ No credit card     │  │                          │   │
│  │  ✓ 14-day trial       │  │                          │   │
│  │  ✓ Full access        │  │                          │   │
│  └───────────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  FEATURES SHOWCASE                          │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ [Icon]   │  │ [Icon]   │  │ [Icon]   │  │ [Icon]   │   │
│  │ Quantum  │  │ Social   │  │ AI       │  │ Auto     │   │
│  │ Ranking  │  │ AE       │  │ Copilot  │  │ Reports  │   │
│  │          │  │ Explorer │  │          │  │          │   │
│  │ Priori-  │  │ Reddit   │  │ ChatGPT  │  │ PSUR/    │   │
│  │ tize     │  │ Twitter  │  │ -like    │  │ DSUR in  │   │
│  │ signals  │  │ analysis │  │ queries  │  │ minutes  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  VALUE PROPOSITION                          │
│                                                             │
│  "From weeks to minutes. From gut feelings to data-driven  │
│   decisions. From manual reports to AI-powered insights."  │
│                                                             │
│   [3-column comparison: Manual vs Competitors vs Us]       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      FINAL CTA                              │
│                                                             │
│  Ready to transform your pharmacovigilance workflow?       │
│                                                             │
│  [Start Free Trial →]     [Book a Demo →]                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FOOTER: [About] [Privacy] [Terms] [Contact]               │
│  © 2024 AetherSignal. Enterprise pharmacovigilance.        │
└─────────────────────────────────────────────────────────────┘
```

### **Component Details**

**Hero H1:**
- Font: 48px (3rem), Bold (700)
- Color: White
- Line Height: 1.2
- Animation: Fade in + slide up (500ms)

**Dashboard Preview:**
- Mockup/screenshot of actual dashboard
- Subtle animation (data flowing, cards updating)
- Gradient border with quantum colors

**Feature Cards:**
- 4 columns on desktop, 2 on tablet, 1 on mobile
- Icon (32px), Title (18px semibold), Description (14px)
- Hover: Lift up 4px, increase shadow

**CTA Buttons:**
- Primary: "Start Free Trial" (large, primary-500)
- Secondary: "Book Demo" (large, ghost variant)

---

## 🏠 **SCREEN 2: DASHBOARD (After Login)**

### **Purpose**
Welcome users, show key metrics, provide quick access to common tasks.

### **Layout Structure**

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  MAIN CANVAS                                     │
│ SIDEBAR  │                                                  │
│          │  ┌────────────────────────────────────────────┐  │
│ ◉ Dash   │  │  HEADER                                    │  │
│   Signal │  │  Good morning, Vikas 👋                    │  │
│   Copilot│  │  Your signals are trending down this week  │  │
│   Social │  └────────────────────────────────────────────┘  │
│   Reports│                                                  │
│ ─────    │  ┌───────────────────────────────────────────┐   │
│ Upload   │  │  KPI CARDS (4 columns)                    │   │
│ Settings │  │                                           │   │
│          │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │   │
│          │  │  │Cases │ │Alerts│ │AI    │ │Rows  │    │   │
│ Fav:     │  │  │      │ │      │ │Score │ │      │    │   │
│ ★ Asp    │  │  │12.5K │ │  47  │ │0.94  │ │2.1M  │    │   │
│ ★ War    │  │  │+23%  │ │  +8  │ │+0.02 │ │+156K │    │   │
│          │  │  └──────┘ └──────┘ └──────┘ └──────┘    │   │
│          │  └───────────────────────────────────────────┘   │
│          │                                                  │
│          │  ┌────────────────────────────────────────────┐  │
│          │  │  TREND CHART                               │  │
│          │  │  Signal Detections Over Time               │  │
│          │  │                                           │  │
│          │  │  [Line chart: 7 days, sparkline style]    │  │
│          │  │  Interactive hover shows details          │  │
│          │  └────────────────────────────────────────────┘  │
│          │                                                  │
│          │  ┌─────────────┬──────────────────────────────┐  │
│          │  │ ACTIVITY    │ QUICK ACTIONS               │  │
│          │  │ FEED        │                             │  │
│          │  │             │ [Upload Dataset]            │  │
│          │  │ • Signal    │ [Run Analysis]              │  │
│          │  │   detected  │ [Generate Report]           │  │
│          │  │ • Dataset   │ [Ask Copilot]               │  │
│          │  │   uploaded  │                             │  │
│          │  │ • Report    │                             │  │
│          │  │   generated │                             │  │
│          │  └─────────────┴──────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────┘
```

### **Component Details**

**Greeting:**
- "Good morning/afternoon/evening, [Name]"
- Dynamic based on time of day
- Emoji: 👋 (morning), ☀️ (afternoon), 🌙 (evening)

**KPI Cards:**
- Grid: 4 columns desktop, 2 tablet, 1 mobile
- Each card:
  - Metric name (14px, gray-400)
  - Value (36px, bold, white)
  - Trend (14px, green/red with arrow)
  - Sparkline chart (optional, small)
  - Background: gray-800, border gray-700
  - Hover: Lift up, show more details

**Trend Chart:**
- Library: Recharts or D3.js
- Type: Area chart with gradient fill
- Colors: Primary gradient
- X-axis: Last 7/30 days
- Y-axis: Signal count
- Hover: Tooltip with exact values
- Responsive: Simplify on mobile

**Activity Feed:**
- Latest 5-10 activities
- Each item:
  - Icon (signal, upload, report, etc.)
  - Description ("Signal detected: Aspirin + GI Bleed")
  - Timestamp ("2 hours ago")
  - Clickable to view details
- Real-time updates (WebSocket or polling)

**Quick Actions:**
- 4 primary action buttons
- Large touch targets (48px height minimum)
- Icons + text labels
- Primary variant for "Run Analysis"

---

## 🔍 **SCREEN 3: SIGNAL EXPLORER (Core Workflow)**

### **Purpose**
Main workspace for querying data and discovering signals.

### **Layout Structure**

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  SEARCH SECTION (ChatGPT-like)                   │
│ SIDEBAR  │                                                  │
│          │  ┌────────────────────────────────────────────┐  │
│ Filters  │  │  [Search Icon] Ask anything about your     │  │
│ ───────  │  │  data... (large input, 48px height)        │  │
│          │  └────────────────────────────────────────────┘  │
│ Dataset  │                                                  │
│ [FAERS ▼]│  Suggested queries (clickable pills):           │
│          │  [Aspirin trends] [New signals] [Q4 PSUR]       │
│ Date     │                                                  │
│ 2024 Q4  │  ──────────────────────────────────────────────  │
│          │                                                  │
│ Serious  │  RESULTS SECTION                                 │
│ ☑ Yes    │                                                  │
│ ☐ No     │  ┌────────────────────────────────────────────┐  │
│          │  │  TABS: [Overview] [Signals] [Trends]       │  │
│ Priority │  │        [AI Insights]                       │  │
│ ☑ High   │  └────────────────────────────────────────────┘  │
│ ☑ Medium │                                                  │
│ ☐ Low    │  ┌────────────────────────────────────────────┐  │
│          │  │  DATA TABLE (Virtual Scroll)               │  │
│ ─────    │  │                                           │  │
│          │  │  [✓] Drug       Reaction    PRR  Cases   │  │
│ Export   │  │  [ ] Aspirin    GI Bleed   12.5  1,284   │  │
│ [CSV]    │  │  [ ] Warfarin   Bleeding   8.3     892   │  │
│ [Excel]  │  │  [ ] Ibuprofen  Ulcer      6.1     654   │  │
│ [PDF]    │  │  ...                                      │  │
│          │  │  [Load more] or infinite scroll           │  │
│          │  │                                           │  │
│          │  │  Showing 1-50 of 2,847 signals            │  │
│          │  └────────────────────────────────────────────┘  │
│          │                                                  │
│          │  [View Details] [Add to Report] [Export]        │
└──────────┴──────────────────────────────────────────────────┘
```

### **Component Details**

**Search Input:**
- Large (48px height)
- Icon: Magnifying glass (left)
- Placeholder: "Ask anything about your data..."
- Auto-focus on page load
- Keyboard: Enter to search, Esc to clear
- Voice input button (optional, right side)

**Suggested Queries:**
- Pills/badges below search
- Clickable: Populates search, runs query
- Dynamic based on user history
- Examples: "Aspirin trends", "New signals this quarter", "High priority only"

**Filters Sidebar:**
- Collapsible sections
- Dataset selector (dropdown)
- Date range picker
- Checkboxes for serious, priority
- Clear all button at bottom
- Apply filters button (sticky)

**Tabs:**
- Overview: Summary stats, key signals
- Signals: Full list (main table)
- Trends: Charts and graphs
- AI Insights: Copilot analysis

**Data Table:**
- Virtual scrolling (handles 1M+ rows)
- Columns:
  - Checkbox (select)
  - Drug (sortable, searchable)
  - Reaction (sortable, searchable)
  - PRR (sortable, color-coded)
  - Cases (sortable)
  - Quantum Score (badge with gradient)
  - Priority (icon: 🔴 High, 🟡 Medium, 🟢 Low)
  - Actions (view, add to report)
- Sticky header
- Row hover: Highlight, show quick actions
- Row click: Expand inline or open modal

**Bottom Actions:**
- Bulk actions for selected rows
- Export dropdown (CSV, Excel, PDF)
- Pagination or "Load more" button

---

## 💬 **SCREEN 4: AI COPILOT (Conversational Interface)**

### **Purpose**
ChatGPT-like interface for natural language queries and AI assistance.

### **Layout Structure**

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  AI COPILOT                                      │
│ HISTORY  │                                                  │
│ ───────  │  ┌────────────────────────────────────────────┐  │
│          │  │  CONTEXT BAR                               │  │
│ Today    │  │  Dataset: FAERS 2024 Q4 | Tools: Search,  │  │
│ • Aspi   │  │  Calculate, Report                         │  │
│ • Warfa  │  └────────────────────────────────────────────┘  │
│          │                                                  │
│ Yester   │  ┌────────────────────────────────────────────┐  │
│ • PSUR   │  │  CHAT MESSAGES (Scrollable)                │  │
│          │  │                                           │  │
│ This We  │  │  [USER]                                   │  │
│ • Trend  │  │  Show me signals for Aspirin in Q4        │  │
│          │  │                                           │  │
│ ─────    │  │  [AI - with avatar/icon]                  │  │
│          │  │  I found 23 signals for Aspirin in Q4.    │  │
│ [New     │  │                                           │  │
│  Chat]   │  │  ┌─────────────────────────────────────┐  │  │
│          │  │  │ SIGNAL CARD                         │  │
│          │  │  │ Aspirin + GI Bleeding               │  │
│          │  │  │ PRR: 12.5, Cases: 1,284             │  │
│          │  │  │ [View Details] [Add to Report]      │  │
│          │  │  └─────────────────────────────────────┘  │  │
│          │  │                                           │  │
│          │  │  The most significant signal is...        │  │
│          │  │                                           │  │
│          │  │  [Follow-up suggestions:]                 │  │
│          │  │  • Show trend over time                   │  │
│          │  │  • Compare to Warfarin                    │  │
│          │  │  • Generate report                        │  │
│          │  │                                           │  │
│          │  │  [USER]                                   │  │
│          │  │  Show trend over time                     │  │
│          │  │                                           │  │
│          │  │  [AI - typing indicator ...]              │  │
│          │  │                                           │  │
│          │  └────────────────────────────────────────────┘  │
│          │                                                  │
│          │  ┌────────────────────────────────────────────┐  │
│          │  │  INPUT (sticky bottom)                     │  │
│          │  │  [📎] Message Copilot...            [Send] │  │
│          │  └────────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────┘
```

### **Component Details**

**Context Bar:**
- Shows current dataset
- Available tools (Search, Calculate, Report, etc.)
- Model info (GPT-4, Claude, etc.)
- Can switch dataset or tools

**Chat History Sidebar:**
- Grouped by date (Today, Yesterday, This Week, etc.)
- Each conversation:
  - Title (first query, truncated)
  - Click to load
- New Chat button (creates new conversation)
- Search history (find past conversations)

**Chat Messages:**
- User messages:
  - Right-aligned
  - Background: primary-900/20
  - Avatar/icon (user photo or initials)
- AI messages:
  - Left-aligned
  - Background: gray-800
  - Avatar/icon (AI logo/icon)
  - Rich content:
    - Text (markdown supported)
    - Cards (SignalCard, KPICard)
    - Charts (embedded)
    - Tables (simple format)
    - Action buttons ("View Details", "Add to Report")
- Follow-up suggestions:
  - Clickable pills below AI response
  - Populate input, send query
- Typing indicator:
  - Animated dots while AI is thinking
  - Shows "Analyzing..." or "Generating response..."

**Input Box:**
- Large textarea (auto-expand)
- Placeholder: "Message Copilot..."
- Attach button (📎) - upload file, paste image
- Send button (Enter or click)
- Keyboard shortcuts:
  - Enter: Send message
  - Shift+Enter: New line
  - Cmd+K: Clear input
  - Up/Down arrows: Navigate history

**Message Actions:**
- Copy message
- Regenerate (for AI messages)
- Give feedback (👍 👎)
- Add to favorites

---

## 📊 **SCREEN 5: EXECUTIVE DASHBOARD (C-Suite)**

### **Purpose**
High-level overview for executives and stakeholders. Presentation-ready.

### **Layout Structure**

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER                                        [Export PDF]   │
│  Q4 2024 Pharmacovigilance Overview            [Full Screen] │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  KPI TILES (Big numbers, visual focus)                       │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Total Cases  │ │ New Signals  │ │ Critical     │        │
│  │              │ │              │ │ Alerts       │        │
│  │    45,892    │ │      127     │ │      18      │        │
│  │    +12% ↑    │ │    +23% ↑    │ │     -3 ↓     │        │
│  │              │ │              │ │              │        │
│  │ [Sparkline]  │ │ [Sparkline]  │ │ [Sparkline]  │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Reports      │ │ Data Quality │ │ Compliance   │        │
│  │ Generated    │ │ Score        │ │ Status       │        │
│  │              │ │              │ │              │        │
│  │      43      │ │     98.4%    │ │   ✓ 100%     │        │
│  │     +5 ↑     │ │    +0.2% ↑   │ │   All met    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└──────────────────────────────────────────────────────────────┘

┌────────────────────────┬─────────────────────────────────────┐
│ GEOGRAPHIC DISTRIBUTION│  RISK MATRIX                        │
│                        │                                     │
│ [Interactive Map]      │  [Scatter Plot]                     │
│                        │   High Freq                         │
│ Hover shows:           │   High Sev  ┌─────┐                │
│ - Country              │             │ 🔴  │ Critical        │
│ - Case count           │   Low Freq  │     │                │
│ - Trend                │   High Sev  └─────┘                │
│                        │             Low Sev                 │
│ Heat map colors:       │                                     │
│ Green → Yellow → Red   │  Click signal to view details       │
└────────────────────────┴─────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  TOP 10 SIGNALS (Table)                                      │
│                                                              │
│  Rank  Drug          Reaction        PRR    Cases  Priority │
│  1.    Aspirin       GI Bleeding    12.5   1,284  🔴       │
│  2.    Warfarin      Hemorrhage      8.3     892  🔴       │
│  3.    Ibuprofen     Ulcer           6.1     654  🟡       │
│  4.    ...                                                  │
│                                                              │
│  [View All Signals →]                                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  TREND ANALYSIS (Multi-line chart)                          │
│                                                              │
│  Signal Detections by Quarter (Last 4 quarters)             │
│  [Line chart with multiple series]                          │
│                                                              │
│  Legend: — Critical  — High  — Medium  — Low                │
└──────────────────────────────────────────────────────────────┘
```

### **Component Details**

**KPI Tiles (6 total):**
- Large numbers (48px+, bold)
- Trend indicator (percentage + arrow)
- Color-coded trends (green up, red down)
- Mini sparkline chart
- Background: Gradient or solid with subtle border
- Grid: 3 columns desktop, 2 tablet, 1 mobile

**Geographic Map:**
- Library: Mapbox, Google Maps, or D3.js
- Interactive: Hover to see country details
- Heat map: Color intensity = case count
- Zoom controls
- Legend

**Risk Matrix (2x2 Scatter Plot):**
- X-axis: Frequency (Low to High)
- Y-axis: Severity (Low to High)
- Quadrants:
  - Top-right: Critical (red)
  - Top-left: High severity, low freq (orange)
  - Bottom-right: High freq, low severity (yellow)
  - Bottom-left: Low priority (green)
- Each dot: A signal
- Click dot: Show signal details
- Size of dot: Number of cases

**Top 10 Signals Table:**
- Simple, clean table
- Rank (1-10)
- Drug, Reaction
- PRR, Cases
- Priority icon (color-coded)
- Click row: View full signal details
- "View All Signals" link goes to Signal Explorer

**Trend Analysis Chart:**
- Multi-line chart
- X-axis: Quarters (Q1 2024, Q2 2024, etc.)
- Y-axis: Signal count
- Multiple lines: Critical, High, Medium, Low priority
- Legend
- Interactive: Hover to see exact values

**Export & Full Screen:**
- Export PDF:
  - One-click PDF generation
  - Includes all charts and data
  - Professional formatting
  - Company logo/branding
- Full Screen:
  - Hides navigation
  - Maximizes data visibility
  - Press Esc to exit

---

## 🎯 **COMMON PATTERNS ACROSS SCREENS**

### **Empty States**

```
┌────────────────────────────────────┐
│                                    │
│         [Illustration/Icon]        │
│                                    │
│    No data yet                     │
│    Upload a dataset to get started │
│                                    │
│    [Upload Dataset Button]         │
│                                    │
└────────────────────────────────────┘
```

### **Loading States**

```
Skeleton Screens:
- Gray rectangles where content will be
- Subtle shimmer animation
- Preserve layout (no jumping)

Spinners:
- Primary color
- 24px-48px size depending on context
- Center of container
- Optional text: "Loading..."

Progress Bars:
- For long operations (upload, report generation)
- Show percentage (0-100%)
- Estimated time remaining
```

### **Error States**

```
┌────────────────────────────────────┐
│  ⚠️ Error                          │
│                                    │
│  Something went wrong              │
│  [Error message details]           │
│                                    │
│  [Try Again] [Contact Support]     │
└────────────────────────────────────┘
```

### **Success Notifications (Toast)**

```
┌────────────────────────────────────┐
│  ✓ Success                         │
│  Dataset uploaded successfully     │
│  [Undo] [View]                    │
└────────────────────────────────────┘

Position: Top-right corner
Duration: 3-5 seconds (auto-dismiss)
Dismissible: Click X or swipe
Types: Success (green), Error (red), Warning (amber), Info (blue)
```

---

## 🔄 **ANIMATIONS & MICRO-INTERACTIONS**

### **Page Transitions**

```javascript
// Fade in on mount
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.3 }}

// Slide in from bottom
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}
```

### **Card Hover Effects**

```css
/* Lift and increase shadow */
transform: translateY(-4px);
box-shadow: var(--shadow-lg);
transition: all 200ms ease-out;
```

### **Button Press**

```css
/* Scale down slightly */
transform: scale(0.98);
transition: transform 100ms ease-out;
```

### **Modal Open**

```javascript
// Overlay fade in
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}

// Modal scale up
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.2 }}
```

### **List Stagger**

```javascript
// Parent
variants={{
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}}

// Children
variants={{
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}}
```

---

## 📱 **RESPONSIVE BEHAVIOR**

### **Mobile (<768px)**

- **Navigation:** Hamburger menu, bottom tab bar
- **Sidebar:** Full-screen overlay when open
- **Cards:** Stack vertically, full width
- **Tables:** Horizontal scroll OR card view (each row = card)
- **Charts:** Simplified, touch-friendly
- **Touch targets:** Minimum 48px × 48px
- **Font sizes:** Slightly smaller but readable (14px-16px body)

### **Tablet (768px-1024px)**

- **Sidebar:** Collapsible to icons (256px → 64px)
- **Grid:** 2 columns for cards
- **Layout:** Hybrid (some desktop features, some mobile)
- **Touch:** Support both touch and mouse

### **Desktop (>1024px)**

- **Sidebar:** Fixed, always visible (256px)
- **Grid:** 3-4 columns for cards
- **Keyboard:** Full keyboard shortcuts
- **Mouse:** Hover states, tooltips

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Week 2: Component Library**
- [ ] Button (4 variants, 3 sizes)
- [ ] Input, Textarea, Select
- [ ] Card, Modal, Dropdown
- [ ] Tabs, Badge, Tooltip
- [ ] SignalCard (custom)
- [ ] DataTable (virtual scroll)
- [ ] CommandPalette (Cmd+K)
- [ ] Toast notifications

### **Week 3: Signal Explorer**
- [ ] Search input with suggestions
- [ ] Filters sidebar
- [ ] Data table with sorting, filtering
- [ ] Tabs (Overview, Signals, Trends, AI)
- [ ] Export functionality
- [ ] Mobile responsive

### **Week 5: Dashboard**
- [ ] Greeting message
- [ ] KPI cards with sparklines
- [ ] Trend chart (Recharts)
- [ ] Activity feed
- [ ] Quick actions

### **Week 6: AI Copilot**
- [ ] Chat history sidebar
- [ ] Message components (user, AI)
- [ ] Rich content rendering (cards, charts)
- [ ] Input with auto-expand
- [ ] Follow-up suggestions
- [ ] Typing indicator

### **Week 7: Executive Dashboard**
- [ ] KPI tiles (6 big numbers)
- [ ] Geographic map (interactive)
- [ ] Risk matrix (scatter plot)
- [ ] Top 10 signals table
- [ ] Trend analysis chart
- [ ] Export PDF functionality
- [ ] Full-screen mode

### **Week 7: Landing Page**
- [ ] Hero section with animation
- [ ] Features showcase (4 cards)
- [ ] Value proposition
- [ ] Final CTA
- [ ] Mobile responsive

---

## 🚀 **YOU NOW HAVE:**

✅ **Complete Design System** (colors, typography, spacing, etc.)  
✅ **5 Detailed Screen Wireframes** (exact layouts, components)  
✅ **Component Specifications** (sizes, colors, behaviors)  
✅ **Responsive Guidelines** (mobile, tablet, desktop)  
✅ **Animation Patterns** (transitions, hover effects)  
✅ **Common Patterns** (empty states, loading, errors)  

**Everything you need to start building AetherSignal V2!** 🎨

---

**Next: I'll create the project structure and start building Week 2!** 💻
