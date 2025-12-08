# 📚 Component Library - Quick Reference

**Fast lookup for all component props and usage**

---

## 🔘 **Button**

```tsx
import { Button } from "@/components/ui/button";

// Props
variant?: "primary" | "secondary" | "danger" | "ghost"
size?: "sm" | "md" | "lg"

// Examples
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>
<Button variant="ghost" disabled>Disabled</Button>
```

---

## 📝 **Input**

```tsx
import { Input } from "@/components/ui/input";

// Props
label?: string
error?: string
helperText?: string
leftIcon?: React.ReactNode
rightIcon?: React.ReactNode
variant?: "default" | "error" | "success"
inputSize?: "sm" | "md" | "lg"

// Examples
<Input 
  label="Email"
  type="email"
  placeholder="you@example.com"
  required
  helperText="We'll never share your email"
/>

<Input
  label="Search"
  leftIcon={<SearchIcon />}
  error="No results found"
/>
```

---

## 📄 **Textarea**

```tsx
import { Textarea } from "@/components/ui/textarea";

// Props
label?: string
error?: string
maxLength?: number
showCount?: boolean
autoResize?: boolean

// Examples
<Textarea
  label="Description"
  placeholder="Enter details..."
  maxLength={500}
  showCount
  autoResize
/>
```

---

## 📋 **Select**

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Example
<Select>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select dataset" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="faers">FAERS 2024</SelectItem>
    <SelectItem value="e2b">E2B Reports</SelectItem>
    <SelectItem value="social">Social Media</SelectItem>
  </SelectContent>
</Select>
```

---

## ☑️ **Checkbox**

```tsx
import { Checkbox } from "@/components/ui/checkbox";

// Props
label?: string
description?: string
checked?: boolean | "indeterminate"
onCheckedChange?: (checked: boolean) => void

// Examples
<Checkbox
  label="Accept terms"
  description="You must agree to continue"
  required
/>

<Checkbox 
  checked="indeterminate"
  label="Select all"
/>
```

---

## 🔄 **Switch**

```tsx
import { Switch } from "@/components/ui/switch";

// Props
label?: string
description?: string
checked?: boolean
onCheckedChange?: (checked: boolean) => void

// Example
<Switch
  label="Email notifications"
  description="Receive updates about new signals"
  checked={enabled}
  onCheckedChange={setEnabled}
/>
```

---

## 🎴 **Card**

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

// Props
variant?: "default" | "hover" | "elevated" | "outline"
padding?: "none" | "sm" | "md" | "lg"

// Example
<Card variant="hover" padding="md">
  <CardHeader>
    <CardTitle>Signal Analysis</CardTitle>
    <CardDescription>Latest pharmacovigilance data</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Your content */}
  </CardContent>
  <CardFooter>
    <Button>View More</Button>
  </CardFooter>
</Card>
```

---

## 🪟 **Dialog (Modal)**

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

// Props for DialogContent
size?: "sm" | "md" | "lg" | "xl" | "full"

// Example
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent size="lg">
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to continue?
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Content */}
    </div>
    <DialogFooter>
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 📑 **Tabs**

```tsx
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

// Example
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="signals">Signals</TabsTrigger>
    <TabsTrigger value="trends">Trends</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    {/* Overview content */}
  </TabsContent>
  <TabsContent value="signals">
    {/* Signals content */}
  </TabsContent>
  <TabsContent value="trends">
    {/* Trends content */}
  </TabsContent>
</Tabs>
```

---

## 🏷️ **Badge**

```tsx
import { Badge } from "@/components/ui/badge";

// Props
variant?: "default" | "secondary" | "success" | "warning" | "danger" | "urgent" | "quantum" | "outline"
size?: "sm" | "md" | "lg"
icon?: React.ReactNode
onRemove?: () => void

// Examples
<Badge variant="danger">Critical</Badge>
<Badge variant="success" icon={<CheckIcon />}>Verified</Badge>
<Badge variant="quantum">AI: 0.94</Badge>
<Badge onRemove={() => console.log("removed")}>Removable</Badge>
```

---

## 💬 **Tooltip**

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Example (Wrap app in TooltipProvider)
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost">Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>This is a helpful tooltip</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## 🎯 **SignalCard** (Custom)

```tsx
import { SignalCard } from "@/components/ui/signal-card";

// Props
data: {
  id: string
  drug: string
  reaction: string
  prr: number
  cases: number
  quantumScore?: number
  priority: "critical" | "high" | "medium" | "low"
  trending?: "up" | "down" | "stable"
  newCases?: number
}
onViewDetails?: () => void
onAddToReport?: () => void
selected?: boolean

// Example
<SignalCard
  data={{
    id: "1",
    drug: "Aspirin",
    reaction: "GI Bleeding",
    prr: 12.5,
    cases: 1284,
    quantumScore: 0.94,
    priority: "critical",
    trending: "up",
    newCases: 34,
  }}
  onViewDetails={() => router.push(`/signals/1`)}
  onAddToReport={handleAddToReport}
  selected={selectedIds.includes("1")}
/>
```

---

## 📊 **KPICard** (Custom)

```tsx
import { KPICard } from "@/components/ui/kpi-card";

// Props
title: string
value: string | number
change?: number  // Percentage
trend?: "up" | "down" | "stable"
icon?: React.ReactNode
description?: string
sparklineData?: number[]
format?: "number" | "currency" | "percentage"

// Examples
<KPICard
  title="Total Cases"
  value={12589}
  change={23}
  trend="up"
  icon={<UsersIcon />}
  description="vs last month"
  sparklineData={[30, 40, 35, 50, 70]}
  format="number"
/>

<KPICard
  title="Revenue"
  value={1500000}
  change={12}
  trend="up"
  format="currency"
/>

<KPICard
  title="Data Quality"
  value={98.4}
  format="percentage"
/>
```

---

## 🎨 **Color Reference**

### **Text Colors**
```tsx
text-white          // Primary text on dark backgrounds
text-gray-50        // Slightly muted white
text-gray-200       // Label text
text-gray-300       // Secondary text
text-gray-400       // Tertiary text, placeholders
text-gray-500       // Disabled text
```

### **Background Colors**
```tsx
bg-gray-900         // Main background
bg-gray-800         // Card/panel background
bg-gray-700         // Hover states
bg-primary-500      // Primary brand color
bg-success-500      // Success green
bg-warning-500      // Warning amber
bg-danger-500       // Danger red
```

### **Border Colors**
```tsx
border-gray-700     // Default borders
border-gray-600     // Hover borders
border-primary-500  // Focus/active borders
border-danger-500   // Error borders
```

---

## 📏 **Spacing Scale**

```tsx
// Padding/Margin
p-0, p-1, p-2, p-3, p-4, p-6, p-8, p-12
m-0, m-1, m-2, m-3, m-4, m-6, m-8, m-12

// Gap (flex/grid)
gap-1, gap-2, gap-3, gap-4, gap-6, gap-8

// Space Between
space-y-2, space-y-4, space-y-6
space-x-2, space-x-4, space-x-6
```

**Scale:** 0.25rem increments (4px, 8px, 12px, 16px, 24px, 32px, 48px)

---

## 🔤 **Typography**

```tsx
// Headings
text-4xl font-bold    // h1 - 36px
text-3xl font-bold    // h2 - 30px
text-2xl font-bold    // h3 - 24px
text-xl font-semibold // h4 - 20px
text-lg font-semibold // h5 - 18px

// Body
text-base             // 16px (default)
text-sm               // 14px (small)
text-xs               // 12px (tiny)

// Weights
font-normal           // 400
font-medium           // 500
font-semibold         // 600
font-bold             // 700
```

---

## 🎬 **Common Patterns**

### **Form Layout**
```tsx
<div className="space-y-4">
  <Input label="Field 1" />
  <Input label="Field 2" />
  <Textarea label="Description" />
  <Button type="submit">Submit</Button>
</div>
```

### **Grid Layout**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

### **Flex Layout**
```tsx
<div className="flex items-center justify-between">
  <h2>Title</h2>
  <Button>Action</Button>
</div>
```

---

## 🔍 **Responsive Classes**

```tsx
// Mobile first approach
className="text-sm md:text-base lg:text-lg"
           // 14px   → 16px      → 18px

// Grid columns
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
           // 1 col   → 2 cols   → 3 cols

// Hide on mobile
className="hidden md:block"

// Show only on mobile
className="block md:hidden"
```

---

## ⚡ **Performance Tips**

1. **Use `"use client"` only when needed** (forms, state, events)
2. **Virtual scrolling for large lists** (>100 items)
3. **Lazy load heavy components** (charts, modals)
4. **Debounce search inputs** (300ms delay)
5. **Memoize expensive calculations** (`useMemo`)

---

## 🎯 **Common Combinations**

### **Search Input**
```tsx
<Input
  type="search"
  placeholder="Search signals..."
  leftIcon={<Search className="h-4 w-4" />}
  onChange={debounce(handleSearch, 300)}
/>
```

### **Form with Validation**
```tsx
<form onSubmit={handleSubmit}>
  <Input
    label="Email"
    type="email"
    required
    error={errors.email}
  />
  <Input
    label="Password"
    type="password"
    required
    error={errors.password}
  />
  <Button type="submit">Sign In</Button>
</form>
```

### **Stat Cards Grid**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <KPICard title="Cases" value={12589} trend="up" />
  <KPICard title="Signals" value={47} trend="up" />
  <KPICard title="Quality" value="98%" />
  <KPICard title="Reports" value={43} />
</div>
```

---

## 📱 **Mobile Optimization**

```tsx
// Touch-friendly button sizes
<Button size="lg">Mobile Button</Button>  // 48px height

// Full-width on mobile
<Button className="w-full md:w-auto">
  Responsive Width
</Button>

// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>
```

---

## 🎨 **Custom Styling**

All components accept `className` prop:

```tsx
<Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600">
  Custom Gradient Button
</Button>

<Card className="border-l-4 border-l-danger-500">
  Card with Left Border
</Card>
```

---

## 🚀 **Next Steps**

After mastering these components:
1. Build test page to try all variants
2. Create your first feature (Signal Explorer)
3. Connect to real API data
4. Add loading and error states

---

**Print this reference and keep it handy while building!** 📋
