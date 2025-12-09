"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignalCard } from "@/components/ui/signal-card";
import { KPICard } from "@/components/ui/kpi-card";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton, SkeletonSignalCard, SkeletonKPICard, SkeletonTable } from "@/components/ui/skeleton";
import { toastSuccess, toastError, toastWarning, toastInfo } from "@/components/ui/toast";
import { Search, Activity, Users, TrendingUp, MoreVertical, FileText, Settings, User } from "lucide-react";

export default function TestPage() {
  const [inputValue, setInputValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [switched, setSwitched] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Command palette keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Generate test data for DataTable
  const generateTableData = () => {
    const drugs = ["Aspirin", "Warfarin", "Ibuprofen", "Acetaminophen", "Metformin"];
    const reactions = ["Bleeding", "Ulcer", "Rash", "Nausea", "Dizziness"];
    const priorities: ("critical" | "high" | "medium" | "low")[] = ["critical", "high", "medium", "low"];
    
    return Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      drug: drugs[i % drugs.length],
      reaction: reactions[i % reactions.length],
      prr: parseFloat((Math.random() * 15 + 1).toFixed(1)),
      cases: Math.floor(Math.random() * 2000 + 100),
      priority: priorities[i % priorities.length],
    }));
  };

  const tableData = generateTableData();

  const tableColumns: Column<typeof tableData[0]>[] = [
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
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            AetherSignal Component Library
          </h1>
          <p className="text-gray-400">
            Testing all components from Week 2 - Phase 1 & Phase 2
          </p>
        </div>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-center flex-wrap">
              <Button variant="primary" size="sm">
                Primary Small
              </Button>
              <Button variant="primary" size="md">
                Primary Medium
              </Button>
              <Button variant="primary" size="lg">
                Primary Large
              </Button>
            </div>
            <div className="flex gap-4 items-center flex-wrap">
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
              <Button disabled>Disabled</Button>
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Input Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="We'll never share your email"
            />
            <Input
              label="Search"
              type="search"
              placeholder="Search signals..."
              leftIcon={<Search className="h-4 w-4" />}
            />
            <Input
              label="Error Example"
              error="This field is required"
              placeholder="Required field"
            />
            <Input
              label="With Right Icon"
              placeholder="Enter value"
              rightIcon={<TrendingUp className="h-4 w-4" />}
            />
          </CardContent>
        </Card>

        {/* Textarea */}
        <Card>
          <CardHeader>
            <CardTitle>Textarea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              label="Description"
              placeholder="Enter description..."
              maxLength={500}
              showCount
            />
            <Textarea
              label="Auto-resize"
              placeholder="This textarea auto-resizes as you type..."
              autoResize
            />
          </CardContent>
        </Card>

        {/* Select */}
        <Card>
          <CardHeader>
            <CardTitle>Select Dropdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a dataset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="faers">FAERS 2024 Q4</SelectItem>
                <SelectItem value="e2b">E2B Reports</SelectItem>
                <SelectItem value="social">Social Media AEs</SelectItem>
                <SelectItem value="literature">Literature Reports</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Checkboxes and Switches */}
        <Card>
          <CardHeader>
            <CardTitle>Checkboxes & Switches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Checkbox
              label="Accept terms and conditions"
              description="You must agree to continue"
              checked={checked}
              onCheckedChange={(value) => setChecked(value as boolean)}
            />
            <Checkbox
              label="Required field"
              description="This is a required checkbox"
              required
            />
            <Checkbox
              checked="indeterminate"
              label="Select all (indeterminate state)"
            />
            <div className="pt-4 border-t border-gray-700">
              <Switch
                label="Email notifications"
                description="Receive email notifications for new signals"
                checked={switched}
                onCheckedChange={setSwitched}
              />
            </div>
            <Switch
              label="Dark mode"
              description="Toggle dark mode on/off"
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
            <Badge variant="quantum">Quantum AI</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success" size="sm">Small</Badge>
            <Badge variant="danger" size="lg">Large</Badge>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="signals">Signals</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                <p className="text-gray-300">
                  This is the overview tab content. Switch tabs to see different content.
                </p>
              </TabsContent>
              <TabsContent value="signals" className="mt-4">
                <p className="text-gray-300">
                  Signal detection results would go here.
                </p>
              </TabsContent>
              <TabsContent value="trends" className="mt-4">
                <p className="text-gray-300">
                  Trend analysis charts would go here.
                </p>
              </TabsContent>
              <TabsContent value="reports" className="mt-4">
                <p className="text-gray-300">
                  Generated reports would be listed here.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialog */}
        <Card>
          <CardHeader>
            <CardTitle>Dialog / Modal</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open Small Modal</Button>
              </DialogTrigger>
              <DialogContent size="sm">
                <DialogHeader>
                  <DialogTitle>Small Dialog</DialogTitle>
                  <DialogDescription>
                    This is a small modal dialog.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-gray-300">
                    Content goes here. Click outside or press ESC to close.
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Open Large Modal</Button>
              </DialogTrigger>
              <DialogContent size="lg">
                <DialogHeader>
                  <DialogTitle>Large Dialog</DialogTitle>
                  <DialogDescription>
                    This is a larger modal for more content.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-gray-300 mb-4">
                    This modal is wider and can contain more detailed information.
                  </p>
                  <Input label="Example input" placeholder="Input in modal" />
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">KPI Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              description="new this week"
            />
            <KPICard
              title="Data Quality"
              value={98.4}
              change={0.2}
              trend="up"
              icon={<TrendingUp className="h-5 w-5" />}
              format="percentage"
            />
          </div>
        </div>

        {/* Signal Cards */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Signal Cards</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            <SignalCard
              data={{
                id: "3",
                drug: "Ibuprofen",
                reaction: "Gastric ulcer",
                prr: 6.1,
                cases: 654,
                quantumScore: 0.78,
                priority: "medium",
                trending: "down",
              }}
              onViewDetails={() => alert("View details clicked")}
              onAddToReport={() => alert("Add to report clicked")}
            />
            <SignalCard
              data={{
                id: "4",
                drug: "Acetaminophen",
                reaction: "Liver damage",
                prr: 4.2,
                cases: 423,
                priority: "low",
              }}
              onViewDetails={() => alert("View details clicked")}
              onAddToReport={() => alert("Add to report clicked")}
            />
          </div>
        </div>

        {/* Phase 2 Components */}
        <div className="pt-8 border-t border-gray-700">
          <h2 className="text-3xl font-bold text-white mb-6">Phase 2: Advanced Components</h2>
        </div>

        {/* Command Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Command Palette (Cmd+K / Ctrl+K)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
              Press <kbd className="px-2 py-1 bg-gray-700 rounded text-sm">Cmd+K</kbd> or{" "}
              <kbd className="px-2 py-1 bg-gray-700 rounded text-sm">Ctrl+K</kbd> to open
            </p>
            <Button onClick={() => setCommandOpen(true)}>
              Open Command Palette
            </Button>
            <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
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
          </CardContent>
        </Card>

        {/* Toast Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Toast Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button onClick={() => toastSuccess("Success!", "Operation completed successfully")}>
                Success Toast
              </Button>
              <Button onClick={() => toastError("Error!", "Something went wrong")} variant="danger">
                Error Toast
              </Button>
              <Button onClick={() => toastWarning("Warning!", "Please review your input")} variant="secondary">
                Warning Toast
              </Button>
              <Button onClick={() => toastInfo("Info", "New update available")} variant="ghost">
                Info Toast
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dropdown Menu */}
        <Card>
          <CardHeader>
            <CardTitle>Dropdown Menu</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Avatar */}
        <Card>
          <CardHeader>
            <CardTitle>Avatars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar fallback="VA" size="sm" status="online" />
              <Avatar fallback="JD" size="md" status="away" />
              <Avatar fallback="SM" size="lg" status="busy" />
              <Avatar fallback="AB" size="xl" status="offline" />
              <div className="flex -space-x-2">
                <Avatar fallback="U1" size="sm" />
                <Avatar fallback="U2" size="sm" />
                <Avatar fallback="U3" size="sm" />
                <Avatar fallback="+5" size="sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Separator */}
        <Card>
          <CardHeader>
            <CardTitle>Separators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <Separator label="OR" />
            <div className="flex h-5 items-center space-x-4">
              <div className="text-gray-300">Item 1</div>
              <Separator orientation="vertical" />
              <div className="text-gray-300">Item 2</div>
              <Separator orientation="vertical" />
              <div className="text-gray-300">Item 3</div>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton Loading States */}
        <Card>
          <CardHeader>
            <CardTitle>Skeleton Loading States</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonSignalCard />
              <SkeletonKPICard />
            </div>
            <SkeletonTable rows={5} />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>

        {/* DataTable */}
        <Card>
          <CardHeader>
            <CardTitle>DataTable - Virtual Scrolling (100 rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={tableData}
              columns={tableColumns}
              enableSelection
              enableSorting
              enableFiltering
              virtualScrolling
              maxHeight="600px"
              onSelectionChange={(selected) =>
                console.log(`${selected.length} rows selected`)
              }
            />
          </CardContent>
        </Card>

        {/* Success Message */}
        <Card variant="elevated" className="border-l-4 border-l-success-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="text-success-500 text-2xl">✅</div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  All Components Working!
                </h3>
                <p className="text-sm text-gray-400">
                  Week 2 Phase 1 & Phase 2 complete! All 21 components are ready to use.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

