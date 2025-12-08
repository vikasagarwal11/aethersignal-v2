# 🎨 Week 2: Component Library - Installation & Usage Guide

**Status:** Components ready to install!  
**Time to complete:** 30-45 minutes  
**Your effort:** Copy-paste files, test components  

---

## 📦 **WHAT YOU'RE GETTING**

### **Components Created (15 so far):**

**✅ Form Components:**
1. `button.tsx` - Already installed ✅
2. `input.tsx` - Text, email, password, number, search
3. `textarea.tsx` - Auto-resize, character counter
4. `select.tsx` - Dropdown with search
5. `checkbox.tsx` - With indeterminate state
6. `switch.tsx` - Toggle for boolean settings

**✅ Layout Components:**
7. `card.tsx` - Container with header/footer
8. `dialog.tsx` - Modal with animations
9. `tabs.tsx` - Organize content in sections
10. `badge.tsx` - Labels and status indicators
11. `tooltip.tsx` - Helpful hints

**✅ Custom Components (Pharmacovigilance-specific):**
12. `signal-card.tsx` - Display drug safety signals
13. `kpi-card.tsx` - Key metrics with trends

**✅ Utilities:**
14. `utils.ts` - Helper functions

---

## 🚀 **INSTALLATION STEPS**

### **Step 1: Create Utils File** (Required first!)

```bash
# In your terminal, from frontend directory
cd frontend

# Create lib directory if it doesn't exist
mkdir -p lib

# Copy utils.ts from week2-components folder to lib
# This file is required by ALL components
```

**File to copy:** `utils.ts` → `frontend/lib/utils.ts`

---

### **Step 2: Install Components**

All component files go in: `frontend/components/ui/`

**Copy these files from `week2-components/` to `frontend/components/ui/`:**

```
button.tsx       ✅ (already exists)
input.tsx        ⏳ NEW
textarea.tsx     ⏳ NEW
select.tsx       ⏳ NEW
checkbox.tsx     ⏳ NEW
switch.tsx       ⏳ NEW
card.tsx         ⏳ NEW
dialog.tsx       ⏳ NEW
tabs.tsx         ⏳ NEW
badge.tsx        ⏳ NEW
tooltip.tsx      ⏳ NEW
signal-card.tsx  ⏳ NEW (custom)
kpi-card.tsx     ⏳ NEW (custom)
```

**Quick copy command (if files are in Downloads):**

```bash
# From frontend directory
cp ~/Downloads/week2-components/*.tsx components/ui/
cp ~/Downloads/week2-components/utils.ts lib/
```

---

### **Step 3: Verify Installation**

Check that files exist:

```bash
# From frontend directory
ls -la components/ui/
ls -la lib/
```

You should see all 13 component files in `components/ui/` and `utils.ts` in `lib/`.

---

## 🧪 **TESTING COMPONENTS**

### **Create a Test Page**

Create `frontend/app/test/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SignalCard } from "@/components/ui/signal-card";
import { KPICard } from "@/components/ui/kpi-card";
import { Search, Activity, Users } from "lucide-react";

export default function TestPage() {
  const [inputValue, setInputValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [switched, setSwitched] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-white mb-8">
          Component Library Test
        </h1>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button variant="primary" size="sm">
              Primary Small
            </Button>
            <Button variant="primary" size="md">
              Primary Medium
            </Button>
            <Button variant="primary" size="lg">
              Primary Large
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="Search"
              type="search"
              placeholder="Search..."
              leftIcon={<Search className="h-4 w-4" />}
            />
            <Input
              label="Error State"
              error="This field is required"
              placeholder="Required field"
            />
            <Textarea
              label="Description"
              placeholder="Enter description..."
              maxLength={500}
              showCount
            />
          </CardContent>
        </Card>

        {/* Checkboxes and Switches */}
        <Card>
          <CardHeader>
            <CardTitle>Checkboxes & Switches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Checkbox
              label="Accept terms and conditions"
              description="You must agree to continue"
              checked={checked}
              onCheckedChange={(value) => setChecked(value as boolean)}
            />
            <Switch
              label="Enable notifications"
              description="Receive email notifications for new signals"
              checked={switched}
              onCheckedChange={setSwitched}
            />
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="urgent">Urgent</Badge>
            <Badge variant="quantum">Quantum</Badge>
            <Badge variant="outline">Outline</Badge>
          </CardContent>
        </Card>

        {/* Dialog */}
        <Card>
          <CardHeader>
            <CardTitle>Dialog/Modal</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open Modal</Button>
              </DialogTrigger>
              <DialogContent size="md">
                <DialogHeader>
                  <DialogTitle>Signal Details</DialogTitle>
                  <DialogDescription>
                    View detailed information about this signal
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-gray-300">
                    This is a modal dialog. Click outside or press ESC to close.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          <KPICard
            title="Total Cases"
            value={12589}
            change={23}
            trend="up"
            icon={<Users className="h-5 w-5" />}
            description="vs last month"
            sparklineData={[30, 40, 35, 50, 49, 60, 70]}
          />
          <KPICard
            title="Active Signals"
            value={47}
            change={8}
            trend="up"
            icon={<Activity className="h-5 w-5" />}
          />
          <KPICard
            title="Data Quality"
            value="98.4%"
            change={0.2}
            trend="up"
            icon={<Search className="h-5 w-5" />}
          />
        </div>

        {/* Signal Cards */}
        <div className="grid grid-cols-2 gap-4">
          <SignalCard
            data={{
              id: "1",
              drug: "Aspirin",
              reaction: "Gastrointestinal bleeding",
              prr: 12.5,
              cases: 1284,
              quantumScore: 0.94,
              priority: "critical",
              trending: "up",
              newCases: 34,
            }}
            onViewDetails={() => alert("View details clicked")}
            onAddToReport={() => alert("Add to report clicked")}
          />
          <SignalCard
            data={{
              id: "2",
              drug: "Warfarin",
              reaction: "Hemorrhage",
              prr: 8.3,
              cases: 892,
              quantumScore: 0.87,
              priority: "high",
              trending: "stable",
            }}
            onViewDetails={() => alert("View details clicked")}
            onAddToReport={() => alert("Add to report clicked")}
          />
        </div>
      </div>
    </div>
  );
}
```

---

### **View Test Page**

```bash
# Make sure frontend is running
npm run dev

# Open browser to:
http://localhost:3000/test
```

You should see ALL components working! 🎉

---

## 📝 **COMPONENT USAGE EXAMPLES**

### **1. Input Component**

```tsx
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Basic input
<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  required
/>

// With icon
<Input
  label="Search"
  placeholder="Search signals..."
  leftIcon={<Search className="h-4 w-4" />}
/>

// Error state
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>
```

---

### **2. SignalCard Component**

```tsx
import { SignalCard } from "@/components/ui/signal-card";

<SignalCard
  data={{
    id: "signal-123",
    drug: "Aspirin",
    reaction: "Gastrointestinal bleeding",
    prr: 12.5,
    cases: 1284,
    quantumScore: 0.94,
    priority: "critical",
    trending: "up",
    newCases: 34,
  }}
  onViewDetails={() => {
    // Navigate to signal details page
    router.push(`/signals/${signal.id}`);
  }}
  onAddToReport={() => {
    // Add to report state
    addToReport(signal);
  }}
  selected={selectedSignals.includes(signal.id)}
/>
```

---

### **3. KPICard Component**

```tsx
import { KPICard } from "@/components/ui/kpi-card";
import { Users } from "lucide-react";

<KPICard
  title="Total Cases"
  value={12589}
  change={23}
  trend="up"
  icon={<Users className="h-5 w-5" />}
  description="vs last month"
  sparklineData={[30, 40, 35, 50, 49, 60, 70]}
/>
```

---

### **4. Dialog Component**

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog>
  <DialogTrigger asChild>
    <Button>View Signal Details</Button>
  </DialogTrigger>
  <DialogContent size="lg">
    <DialogHeader>
      <DialogTitle>Signal Analysis</DialogTitle>
      <DialogDescription>
        Detailed analysis of Aspirin + GI Bleeding
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Your content here */}
    </div>
  </DialogContent>
</Dialog>
```

---

## ✅ **VERIFICATION CHECKLIST**

After installation, verify:

- [ ] `lib/utils.ts` exists and exports `cn` function
- [ ] All 13 component files in `components/ui/`
- [ ] No TypeScript errors when running `npm run dev`
- [ ] Test page loads at `/test`
- [ ] All buttons work (click them!)
- [ ] Inputs accept text
- [ ] Modal opens and closes
- [ ] SignalCards display correctly
- [ ] KPICards show metrics

---

## 🎯 **WHAT'S NEXT?**

After you verify all components work, I'll create:

**Phase 2 (Next):**
- [ ] DataTable with virtual scrolling
- [ ] Command Palette (Cmd+K)
- [ ] Toast notifications
- [ ] Dropdown menu
- [ ] Avatar component
- [ ] Loading states
- [ ] Empty states

**Then we build actual screens!**

---

## 💬 **REPORT BACK**

Once you've installed and tested:

**Reply with:**
"✅ Week 2 Phase 1 complete! All components working!"

**Or if issues:**
"❌ Issue with [component name]: [error message]"

---

## 🚀 **YOU'RE DOING GREAT!**

**Progress so far:**
- ✅ Week 1: Project setup complete
- ✅ Week 2 Phase 1: 13 components ready
- ⏳ Week 2 Phase 2: 7 more components coming
- ⏳ Week 3: Build Signal Explorer screen

**You're building a $1.3M platform!** 💰

Let me know when components are installed and tested! 🎉
