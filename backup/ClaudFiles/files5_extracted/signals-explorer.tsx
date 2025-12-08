"use client";

import { useState, useEffect } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KPICard } from "@/components/ui/kpi-card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast, toastSuccess, toastError, toastWarning } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Download,
  FileText,
  TrendingUp,
  AlertTriangle,
  Activity,
  Upload,
  Zap,
  Brain,
  ChevronDown,
  MoreVertical,
  Filter,
  X,
} from "lucide-react";

interface Signal {
  id: number;
  drug_name: string;
  reaction: string;
  prr: number;
  case_count: number;
  priority: string;
  serious: boolean;
  ai_confidence?: number;
  trend?: "up" | "down" | "stable";
  event_date?: string;
}

interface Stats {
  total_cases: number;
  critical_signals: number;
  serious_events: number;
}

export default function SignalExplorerPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSignals, setSelectedSignals] = useState<Signal[]>([]);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  // AI Priority Signals (top 3 most critical)
  const prioritySignals = signals
    .filter((s) => s.priority === "critical" && s.ai_confidence && s.ai_confidence > 0.8)
    .slice(0, 3);

  // Fetch signals
  const fetchSignals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: "1",
        page_size: "100",
        dataset: "faers",
      });

      if (search) params.append("search", search);

      const response = await fetch(
        `http://localhost:8000/api/v1/signals?${params}`
      );

      if (!response.ok) throw new Error("Failed to fetch signals");

      const data = await response.json();
      
      // Add mock AI confidence scores for demo
      const signalsWithAI = data.signals.map((s: Signal) => ({
        ...s,
        ai_confidence: s.priority === "critical" ? 0.85 + Math.random() * 0.15 : 0.5 + Math.random() * 0.3,
        trend: Math.random() > 0.5 ? "up" : "stable",
      }));
      
      setSignals(signalsWithAI);
    } catch (error) {
      console.error("Error fetching signals:", error);
      toastError("Error", "Failed to load signals");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/signals/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchSignals();
    fetchStats();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (search) fetchSignals();
    }, 500);
    return () => clearTimeout(debounce);
  }, [search]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setProcessing(true);

    // Simulate AI processing
    setTimeout(() => {
      setProcessing(false);
      setUploadDialogOpen(false);
      toastSuccess(
        "File Processed!",
        `${file.name} successfully processed. 3 new cases created.`
      );
      setUploadedFile(null);
    }, 3000);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (selectedSignals.length === 0) {
      toastError("No Selection", "Please select signals to export");
      return;
    }

    const headers = ["Drug", "Reaction", "PRR", "Cases", "Priority", "AI Confidence"];
    const rows = selectedSignals.map((s) => [
      s.drug_name,
      s.reaction,
      s.prr,
      s.case_count,
      s.priority,
      s.ai_confidence?.toFixed(2) || "N/A",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signals-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toastSuccess("Exported!", `${selectedSignals.length} signals exported to CSV`);
  };

  // Define table columns
  const columns: Column<Signal>[] = [
    {
      id: "drug_name",
      header: "Drug",
      accessor: (row) => row.drug_name,
      sortable: true,
      width: 180,
    },
    {
      id: "reaction",
      header: "Reaction",
      accessor: (row) => row.reaction,
      sortable: true,
      width: 220,
    },
    {
      id: "prr",
      header: "PRR",
      accessor: (row) => (
        <span className={row.prr > 10 ? "text-danger-500 font-semibold" : ""}>
          {row.prr.toFixed(1)}
        </span>
      ),
      sortable: true,
      width: 80,
      align: "right",
    },
    {
      id: "case_count",
      header: "Cases",
      accessor: (row) => (
        <div className="flex items-center gap-1">
          {row.case_count.toLocaleString()}
          {row.trend === "up" && <TrendingUp className="h-3 w-3 text-danger-500" />}
        </div>
      ),
      sortable: true,
      width: 100,
      align: "right",
    },
    {
      id: "ai_confidence",
      header: "AI Score",
      accessor: (row) => (
        <Badge
          variant={
            (row.ai_confidence || 0) > 0.8
              ? "quantum"
              : (row.ai_confidence || 0) > 0.6
              ? "default"
              : "secondary"
          }
          size="sm"
        >
          <Zap className="h-3 w-3 mr-1" />
          {(row.ai_confidence || 0).toFixed(2)}
        </Badge>
      ),
      sortable: true,
      width: 100,
    },
    {
      id: "priority",
      header: "Priority",
      accessor: (row) => (
        <Badge
          variant={
            row.priority === "critical"
              ? "danger"
              : row.priority === "high"
              ? "warning"
              : "secondary"
          }
          size="sm"
        >
          {row.priority}
        </Badge>
      ),
      sortable: true,
      width: 100,
    },
    {
      id: "actions",
      header: "",
      accessor: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Add to Report</DropdownMenuItem>
            <DropdownMenuItem>AI Analysis</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger-500">Dismiss</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      width: 60,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">AetherSignal</h1>
                  <p className="text-xs text-gray-400">AI-Powered Pharmacovigilance</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportToCSV}
                disabled={selectedSignals.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export ({selectedSignals.length})
              </Button>
              <Button variant="primary" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Avatar fallback="VK" size="sm" status="online" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {stats ? (
            <>
              <KPICard
                title="Total Cases"
                value={stats.total_cases}
                icon={<Activity className="h-5 w-5" />}
                trend="up"
                change={12}
                description="vs last month"
              />
              <KPICard
                title="Critical Signals"
                value={stats.critical_signals}
                icon={<AlertTriangle className="h-5 w-5" />}
                trend="up"
                change={5}
              />
              <KPICard
                title="Serious Events"
                value={stats.serious_events}
                icon={<TrendingUp className="h-5 w-5" />}
                trend="down"
                change={-3}
              />
            </>
          ) : (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          )}
        </div>

        {/* AI Priority Signals */}
        {prioritySignals.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-white">
                AI Priority Signals
              </h2>
              <Badge variant="quantum" size="sm">
                High Confidence
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {prioritySignals.map((signal) => (
                <Card
                  key={signal.id}
                  className="border-l-4 border-l-danger-500 hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-danger-500" />
                          <h3 className="text-lg font-semibold text-white">
                            {signal.drug_name} + {signal.reaction}
                          </h3>
                          {signal.trend === "up" && (
                            <Badge variant="danger" size="sm">
                              ↑ Trending
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          PRR: {signal.prr.toFixed(1)} | {signal.case_count.toLocaleString()} cases | AI Confidence: {((signal.ai_confidence || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <Badge variant="quantum" className="ml-4">
                        <Zap className="h-3 w-3 mr-1" />
                        {(signal.ai_confidence || 0).toFixed(2)}
                      </Badge>
                    </div>

                    <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-sm text-gray-300 mb-2">
                        <strong className="text-primary-400">💡 Why AI flagged this:</strong>
                      </p>
                      <ul className="text-sm text-gray-400 space-y-1 ml-4">
                        <li>• Sudden spike in cases (↑ 40% vs last week)</li>
                        <li>• Social media chatter increased 300%</li>
                        <li>• Pattern similar to historical drug recalls</li>
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="primary" size="sm">
                        <Brain className="h-4 w-4 mr-2" />
                        AI Investigation
                      </Button>
                      <Button variant="secondary" size="sm">
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm">
                        Add to Report
                      </Button>
                      <Button variant="ghost" size="sm" className="ml-auto text-gray-400">
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main Table Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle>All Signals ({signals.length})</CardTitle>
                <div className="flex gap-2">
                  <Badge
                    variant="danger"
                    className="cursor-pointer hover:opacity-80"
                  >
                    Critical
                  </Badge>
                  <Badge
                    variant="warning"
                    className="cursor-pointer hover:opacity-80"
                  >
                    High
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:opacity-80"
                  >
                    Medium
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Search drug or reaction..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="w-64"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                  <ChevronDown
                    className={`h-4 w-4 ml-2 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </div>
            </div>

            {/* Advanced Filters (Collapsible) */}
            {showFilters && (
              <div className="mt-4 p-4 border border-gray-700 rounded-lg bg-gray-800/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-300">
                    Advanced Filters
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-400">
                  Filter options coming soon...
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <DataTable
                data={signals}
                columns={columns}
                enableSelection
                enableSorting
                enableFiltering={false}
                virtualScrolling
                maxHeight="600px"
                onSelectionChange={setSelectedSignals}
                emptyMessage="No signals found. Try adjusting your search."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Upload Data - ANY Format</DialogTitle>
            <DialogDescription>
              Drop any file type - we'll figure out what it is and process it automatically
            </DialogDescription>
          </DialogHeader>

          <div className="py-8">
            {processing ? (
              <div className="text-center space-y-4">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent" />
                <div>
                  <p className="text-lg font-semibold text-white">
                    AI Processing...
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {uploadedFile?.name}
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-gray-400">
                    <p>✓ Detecting file format...</p>
                    <p>✓ Extracting content...</p>
                    <p>⏳ AI entity extraction...</p>
                    <p className="text-gray-500">• Auto-coding with MedDRA...</p>
                    <p className="text-gray-500">• Quality scoring...</p>
                  </div>
                </div>
              </div>
            ) : (
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors bg-gray-800/30"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="mb-2 text-sm text-gray-300">
                    <span className="font-semibold">Click to upload</span> or drag
                    and drop
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                    📄 PDF • 📧 Email • 📝 Word • 📊 Excel • 🗜️ ZIP • 📷 Images • 🎤 Audio
                  </p>
                  <p className="text-xs text-primary-400 mt-2">
                    Our AI handles any format automatically
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </label>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
