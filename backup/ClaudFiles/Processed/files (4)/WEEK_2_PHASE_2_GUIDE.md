# 🚀 Week 2 Phase 2: Advanced Components

**Status:** All 8 components ready!  
**Download:** [week2-phase2.zip](computer:///mnt/user-data/outputs/week2-phase2.zip)  
**Time:** 20 minutes to install and test  

---

## 📦 **WHAT'S IN PHASE 2**

### **8 Advanced Components:**

1. ✅ **data-table.tsx** - Virtual scrolling table (1M+ rows)
2. ✅ **command.tsx** - Cmd+K universal search
3. ✅ **toast.tsx** - Notification system
4. ✅ **toaster.tsx** - Toast container
5. ✅ **dropdown-menu.tsx** - Context menus
6. ✅ **avatar.tsx** - User photos with status
7. ✅ **separator.tsx** - Visual dividers
8. ✅ **skeleton.tsx** - Loading states

---

## 📥 **DOWNLOAD & INSTALL**

### **Step 1: Download**

**[Click here to download week2-phase2.zip](computer:///mnt/user-data/outputs/week2-phase2.zip)**

Extract to your Desktop

---

### **Step 2: Copy to Project**

```bash
# From frontend directory
cd frontend

# Copy phase 2 folder
cp -r ~/Desktop/week2-phase2 .
```

---

### **Step 3: Install Components**

```bash
# Copy all components to ui folder
cp week2-phase2/*.tsx components/ui/
```

---

### **Step 4: Install Additional Dependencies**

```bash
# Install React Virtual (for DataTable)
npm install @tanstack/react-virtual

# Install cmdk (for Command Palette)
npm install cmdk

# Install Radix UI components (for Toast, Dropdown, Avatar)
npm install @radix-ui/react-toast
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-avatar
npm install @radix-ui/react-separator
```

---

### **Step 5: Add Toaster to Root Layout**

Edit `app/layout.tsx` to include the Toaster:

```tsx
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster /> {/* Add this line */}
      </body>
    </html>
  );
}
```

---

## 🧪 **TESTING EACH COMPONENT**

### **1. DataTable - Virtual Scrolling**

Create `app/test-table/page.tsx`:

```tsx
"use client";

import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

interface Signal {
  id: number;
  drug: string;
  reaction: string;
  prr: number;
  cases: number;
  priority: "critical" | "high" | "medium" | "low";
}

// Generate 10,000 test rows
const generateData = (): Signal[] => {
  const drugs = ["Aspirin", "Warfarin", "Ibuprofen", "Acetaminophen"];
  const reactions = ["Bleeding", "Ulcer", "Rash", "Nausea"];
  const priorities: Signal["priority"][] = ["critical", "high", "medium", "low"];
  
  return Array.from({ length: 10000 }, (_, i) => ({
    id: i + 1,
    drug: drugs[i % drugs.length],
    reaction: reactions[i % reactions.length],
    prr: parseFloat((Math.random() * 15 + 1).toFixed(1)),
    cases: Math.floor(Math.random() * 2000 + 100),
    priority: priorities[i % priorities.length],
  }));
};

export default function TestTablePage() {
  const data = generateData();

  const columns: Column<Signal>[] = [
    {
      id: "drug",
      header: "Drug",
      accessor: (row) => row.drug,
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      id: "reaction",
      header: "Reaction",
      accessor: (row) => row.reaction,
      sortable: true,
      width: 200,
    },
    {
      id: "prr",
      header: "PRR",
      accessor: (row) => row.prr.toFixed(1),
      sortable: true,
      width: 100,
      align: "right",
    },
    {
      id: "cases",
      header: "Cases",
      accessor: (row) => row.cases.toLocaleString(),
      sortable: true,
      width: 120,
      align: "right",
    },
    {
      id: "priority",
      header: "Priority",
      accessor: (row) => (
        <Badge
          variant={
            row.priority === "critical" ? "danger" :
            row.priority === "high" ? "warning" : "default"
          }
        >
          {row.priority}
        </Badge>
      ),
      sortable: true,
      width: 120,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">
          DataTable Test - 10,000 Rows
        </h1>
        <p className="text-gray-400 mb-8">
          Virtual scrolling handles millions of rows smoothly
        </p>
        
        <DataTable
          data={data}
          columns={columns}
          enableSelection
          enableSorting
          enableFiltering
          virtualScrolling
          maxHeight="600px"
          onSelectionChange={(selected) =>
            console.log(`${selected.length} rows selected`)
          }
        />
      </div>
    </div>
  );
}
```

**Test:** Visit `/test-table` - should scroll smoothly through 10K rows!

---

### **2. Command Palette - Cmd+K Search**

Add to any page (or `app/test/page.tsx`):

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Search, FileText, Settings, User } from "lucide-react";

export default function TestCommandPage() {
  const [open, setOpen] = useState(false);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Command Palette Test
        </h1>
        <p className="text-gray-400 mb-8">
          Press <kbd className="px-2 py-1 bg-gray-700 rounded">Cmd+K</kbd> or{" "}
          <kbd className="px-2 py-1 bg-gray-700 rounded">Ctrl+K</kbd>
        </p>

        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>
                <Search className="mr-2 h-4 w-4" />
                <span>Search Signals</span>
              </CommandItem>
              <CommandItem>
                <FileText className="mr-2 h-4 w-4" />
                <span>Generate Report</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </CommandItem>
              <CommandItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </div>
  );
}
```

**Test:** Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) - palette should open!

---

### **3. Toast Notifications**

Add to any page:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { toast, toastSuccess, toastError, toastWarning, toastInfo } from "@/components/ui/toast";

export default function TestToastPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-white mb-8">Toast Notifications</h1>
        
        <Button onClick={() => toastSuccess("Success!", "Operation completed successfully")}>
          Show Success Toast
        </Button>
        
        <Button onClick={() => toastError("Error!", "Something went wrong")} variant="danger">
          Show Error Toast
        </Button>
        
        <Button onClick={() => toastWarning("Warning!", "Please review your input")} variant="secondary">
          Show Warning Toast
        </Button>
        
        <Button onClick={() => toastInfo("Info", "New update available")} variant="ghost">
          Show Info Toast
        </Button>
        
        <Button
          onClick={() =>
            toast({
              title: "Custom Toast",
              description: "With custom action",
              variant: "default",
              action: (
                <button onClick={() => alert("Action clicked!")}>
                  Undo
                </button>
              ),
            })
          }
        >
          Custom Toast with Action
        </Button>
      </div>
    </div>
  );
}
```

**Test:** Click buttons - toasts appear in bottom-right corner!

---

### **4. Dropdown Menu**

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      View Details
      <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>Add to Report</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-danger-500">
      Delete
      <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### **5. Avatar**

```tsx
import { Avatar } from "@/components/ui/avatar";

{/* With image */}
<Avatar
  src="https://github.com/shadcn.png"
  alt="User"
  size="md"
  status="online"
/>

{/* With fallback initials */}
<Avatar
  fallback="VA"
  size="lg"
  status="away"
/>

{/* Group of avatars */}
<div className="flex -space-x-2">
  <Avatar src="/user1.jpg" fallback="U1" size="sm" />
  <Avatar src="/user2.jpg" fallback="U2" size="sm" />
  <Avatar src="/user3.jpg" fallback="U3" size="sm" />
  <Avatar fallback="+5" size="sm" />
</div>
```

---

### **6. Separator**

```tsx
import { Separator } from "@/components/ui/separator";

{/* Horizontal */}
<Separator />

{/* With label */}
<Separator label="OR" />

{/* Vertical */}
<div className="flex h-5 items-center space-x-4">
  <div>Item 1</div>
  <Separator orientation="vertical" />
  <div>Item 2</div>
</div>
```

---

### **7. Skeleton Loading States**

```tsx
import {
  Skeleton,
  SkeletonCard,
  SkeletonSignalCard,
  SkeletonTable,
  SkeletonKPICard,
} from "@/components/ui/skeleton";

{/* Basic skeleton */}
<Skeleton className="h-12 w-full" />

{/* Preset patterns */}
<SkeletonSignalCard />
<SkeletonKPICard />
<SkeletonTable rows={5} />

{/* Custom pattern */}
<div className="space-y-2">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-4 w-2/3" />
</div>
```

---

## ✅ **VERIFICATION CHECKLIST**

After installation:

- [ ] All 8 component files in `components/ui/`
- [ ] Dependencies installed (`npm install`)
- [ ] Toaster added to `app/layout.tsx`
- [ ] No TypeScript errors
- [ ] `npm run dev` runs without errors
- [ ] DataTable scrolls smoothly
- [ ] Cmd+K opens command palette
- [ ] Toast notifications appear
- [ ] Dropdown menus work
- [ ] Avatars display
- [ ] Skeletons animate

---

## 🎯 **COMPLETE COMPONENT LIBRARY**

You now have **21 total components:**

**Phase 1 (13):**
✅ Button, Input, Textarea, Select, Checkbox, Switch, Card, Dialog, Tabs, Badge, Tooltip, SignalCard, KPICard

**Phase 2 (8):**
✅ DataTable, Command, Toast, Toaster, DropdownMenu, Avatar, Separator, Skeleton

---

## 📊 **WHAT'S NEXT**

**Week 3: Build Signal Explorer Screen**

Now that you have a complete component library, we'll build the first real screen:

1. **Signal Explorer Page** - Main workflow screen
2. **Search and filters** - Using Input + Select
3. **Results table** - Using DataTable (10K+ signals)
4. **Signal cards** - Using SignalCard
5. **Backend integration** - Connect to FastAPI

---

## 💬 **REPORT BACK**

Once installed and tested:

**✅ "Phase 2 complete! All components working!"**

Or if issues:

**❌ "Issue with [component]: [error]"**

---

## 🎉 **YOU'RE CRUSHING IT!**

**Progress:**
- ✅ Week 1: Project setup (3 hours)
- ✅ Week 2 Phase 1: 13 components (1 hour)
- ✅ Week 2 Phase 2: 8 components (just now!)
- ⏳ Week 3: First real screen

**You have a $15K+ component library!** 🚀

Download Phase 2 and let me know when it's ready! 💪
