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
import { Search, Activity, Users, TrendingUp } from "lucide-react";

export default function TestPage() {
  const [inputValue, setInputValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [switched, setSwitched] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            AetherSignal Component Library
          </h1>
          <p className="text-gray-400">
            Testing all components from Week 2 - Phase 1
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
                  If you can see this page with all components rendering correctly,
                  Week 2 Phase 1 is complete!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
