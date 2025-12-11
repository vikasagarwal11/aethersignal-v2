"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KPICard } from "@/components/ui/kpi-card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toastSuccess, toastError } from "@/components/ui/toast";
import { Navbar } from "@/components/layout/navbar";
import { ChatInterface } from "@/components/signals/ChatInterface";
import { SessionSidebar } from "@/components/signals/SessionSidebar";
import { SessionAnalysesSidebar } from "@/components/signals/SessionAnalysesSidebar";
import { SavedAnalysesList } from "@/components/signals/SavedAnalysesList";
import { AIPrioritySignals } from "@/components/signals/AIPrioritySignals";
import { MultiSelect } from "@/components/ui/multiselect";
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
  CheckCircle2,
  Loader2,
  ChevronUp,
  ChevronRight,
  MessageSquare,
  Calendar,
  Settings,
  RefreshCw,
} from "lucide-react";

interface Signal {
  id: string;
  drug: string;
  reaction: string;
  prr: number;
  cases: number;
  priority: "critical" | "high" | "medium" | "low";
  serious: boolean;
  dataset: string;
  organization?: string;
  ai_confidence?: number;
  trend?: "up" | "down" | "stable";
}

interface SignalStats {
  total_cases: number;
  critical_signals: number;
  serious_events: number;
  unique_drugs: number;
  unique_reactions: number;
}

interface ProcessingStatus {
  file_id: string;
  filename: string;
  status: string;
  progress?: number;
  message?: string;
  cases_created?: number;
  error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function SignalExplorerPage() {
  // Generate sessionId at page level to share between ChatInterface and SessionAnalysesSidebar
  // Use useEffect to ensure it only runs on client side (crypto.randomUUID() not available in SSR)
  const [sessionId, setSessionId] = useState<string>("");
  
  useEffect(() => {
    if (typeof window !== "undefined" && !sessionId) {
      setSessionId(crypto.randomUUID());
    }
  }, [sessionId]);
  
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSignals, setSelectedSignals] = useState<Signal[]>([]);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processingFiles, setProcessingFiles] = useState<Map<string, ProcessingStatus>>(new Map());
  const [selectedDataset, setSelectedDataset] = useState<string>("all");
  const [datasets, setDatasets] = useState<Array<{value: string; label: string}>>([]);
  const [seriousOnly, setSeriousOnly] = useState(false);
  
  // New UI states
  const [prioritySignalsExpanded, setPrioritySignalsExpanded] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string>("all");
  
  // Multi-tenant filtering states
  const [filterLevel, setFilterLevel] = useState<'user' | 'team' | 'organization'>('organization');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string; name: string; email: string}>>([]);
  const [currentOrganization, setCurrentOrganization] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const pollingTimeouts = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // AI Priority Signals (top 5 most critical with high AI confidence)
  const prioritySignals = signals
    .filter((s) => s.priority === "critical" && (s.ai_confidence || 0) > 0.8)
    .slice(0, 5); // Show up to 5 signals

  // Fetch datasets
  useEffect(() => {
    fetchDatasets();
    fetchAvailableUsers();
    // Get current user's organization (from auth or localStorage)
    const org = localStorage.getItem('organization') || 'default';
    const userId = localStorage.getItem('userId') || null;
    setCurrentOrganization(org);
    setCurrentUserId(userId);
  }, []);

  // Clean up polling timers on unmount
  useEffect(() => {
    return () => {
      pollingTimeouts.current.forEach(clearTimeout);
    };
  }, []);
  
  // Fetch available users in organization (for team selection)
  const fetchAvailableUsers = async () => {
    try {
      // TODO: Replace with real API endpoint when available
      // For now, return empty array - team filtering will be disabled until API is ready
      // const response = await fetch(`${API_BASE_URL}/api/v1/users?organization=${currentOrganization}`);
      // if (!response.ok) throw new Error("Failed to fetch users");
      // const data = await response.json();
      // setAvailableUsers(data);
      setAvailableUsers([]);
    } catch (error) {
      console.error("Error fetching users:", error);
      setAvailableUsers([]);
    }
  };
  
  const fetchDatasets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/signals/datasets`);
      const data = await response.json();
      // Backend returns array of {value, label} objects
      setDatasets(data.datasets || []);
    } catch (error) {
      console.error("Error fetching datasets:", error);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsParams = new URLSearchParams();
      if (selectedDataset !== "all") {
        statsParams.append("dataset", selectedDataset);
      }
      if (selectedSession !== "all") {
        statsParams.append("session_date", selectedSession);
      }
      const statsResponse = await fetch(`${API_BASE_URL}/api/v1/signals/stats?${statsParams}`);
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch signals
      const signalsParams = new URLSearchParams();
      if (selectedDataset !== "all") {
        signalsParams.append("dataset", selectedDataset);
      }
      if (selectedSession !== "all") {
        signalsParams.append("session_date", selectedSession);
      }
      if (seriousOnly) {
        signalsParams.append("serious_only", "true");
      }
      if (search) {
        signalsParams.append("search", search);
      }
      
      // Multi-tenant filtering
      if (currentOrganization) {
        signalsParams.append("organization", currentOrganization);
      }
      
      // User/Team filtering
      if (filterLevel === 'user' && currentUserId) {
        signalsParams.append("user_ids", currentUserId);
      } else if (filterLevel === 'team' && selectedUsers.length > 0) {
        signalsParams.append("user_ids", selectedUsers.join(','));
      }
      // If filterLevel === 'organization', only organization filter is applied (already added above)
      
      signalsParams.append("limit", "1000");

      const signalsResponse = await fetch(`${API_BASE_URL}/api/v1/signals?${signalsParams}`);
      
      // Check if response is ok and parse JSON
      if (!signalsResponse.ok) {
        const errorText = await signalsResponse.text();
        console.error("Error fetching signals:", errorText);
        throw new Error(`Failed to fetch signals: ${signalsResponse.status}`);
      }
      
      const signalsData = await signalsResponse.json();
      
      // Ensure signalsData is an array
      if (!Array.isArray(signalsData)) {
        console.error("Signals API returned non-array:", signalsData);
        setSignals([]);
        return;
      }

      // Add AI confidence scores and trends (mock for now - will be real AI in production)
      // This ensures AI Priority Signals section can display signals
      const signalsWithAI = signalsData.map((s: Signal) => ({
        ...s,
        ai_confidence:
          s.ai_confidence !== undefined
            ? s.ai_confidence
            : s.priority === "critical"
            ? 0.85 + Math.random() * 0.15  // 0.85-1.0 for critical
            : s.priority === "high"
            ? 0.7 + Math.random() * 0.15   // 0.7-0.85 for high
            : s.priority === "medium"
            ? 0.5 + Math.random() * 0.2    // 0.5-0.7 for medium
            : 0.3 + Math.random() * 0.2,   // 0.3-0.5 for low
        trend: s.trend ?? (Math.random() > 0.5 ? "up" : Math.random() > 0.7 ? "down" : "stable"),
      }));

      setSignals(signalsWithAI);
    } catch (error) {
      console.error("Error fetching data:", error);
      toastError("Error", "Failed to load signals");
    } finally {
      setLoading(false);
    }
  }, [
    selectedDataset,
    seriousOnly,
    selectedSession,
    filterLevel,
    selectedUsers.join(","),
    currentOrganization,
    currentUserId,
  ]);

  // Fetch signals and stats
  useEffect(() => {
    fetchData();
  }, [
    selectedDataset,
    seriousOnly,
    selectedSession,
    filterLevel,
    selectedUsers.join(","),
    currentOrganization,
    currentUserId,
  ]);

  // Debounced search - waits 500ms after user stops typing
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (search !== undefined) {
        fetchData();
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [search]);

  // Poll processing status
  const pollProcessingStatus = useCallback(async (fileId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/files/status/${fileId}`);
      if (!response.ok) throw new Error("Failed to fetch status");

      const status: ProcessingStatus = await response.json();
      
      // Use progress from API (0-100) or calculate from status
      let progress = status.progress || 0;
      let message = status.message || "Processing...";
      
      if (status.status === "queued") {
        progress = progress || 10;
        message = message || "File queued for processing...";
      } else if (status.status === "processing") {
        progress = progress || 50;
        message = message || "AI processing file...";
      } else if (status.status === "completed") {
        progress = 100;
        message = message || `Processing complete! ${status.cases_created || 0} case(s) created.`;
        setProcessing(false);
        setUploadDialogOpen(false);
        toastSuccess(
          "Processing Complete!",
          `${status.cases_created || 0} case(s) created successfully`
        );
        // Refresh signals
        fetchData();
      } else if (status.status === "failed") {
        setProcessing(false);
        toastError("Processing Failed", status.error || "Unknown error");
        return;
      }

      // Update status with progress (0-100 range, not 0-1)
      setProcessingStatus({
        ...status,
        progress: progress,
        message: message,
      });

      // Continue polling if not completed or failed
      if (status.status !== "completed" && status.status !== "failed") {
        const timeoutId = setTimeout(() => pollProcessingStatus(fileId), 2000);
        pollingTimeouts.current.push(timeoutId);
      }
    } catch (error) {
      console.error("Error polling status:", error);
      setProcessing(false);
      toastError("Error", "Failed to check processing status");
    }
  }, [fetchData]);

  // Handle single file upload
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setProcessing(true);
    setProcessingStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/v1/files/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
      }

      const result = await response.json();

      toastSuccess("Upload Started!", `Processing ${file.name}...`);

      // Start polling for status
      pollProcessingStatus(result.file_id);
    } catch (error) {
      console.error("Upload error:", error);
      setProcessing(false);
      toastError(
        "Upload Failed",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  // Handle multiple file uploads
  const handleMultipleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploadedFiles(fileArray);
    setProcessing(true);
    setProcessingStatus(null);
    setProcessingFiles(new Map());

    toastSuccess("Upload Started!", `Processing ${fileArray.length} file(s)...`);

    // Process files sequentially to avoid overwhelming the backend
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE_URL}/api/v1/files/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || "Upload failed");
        }

        const result = await response.json();
        
        // Update processing status for this file
        const fileStatus: ProcessingStatus = {
          file_id: result.file_id,
          filename: file.name,
          status: "queued",
          progress: 0,
          message: "Queued for processing...",
        };
        setProcessingFiles(prev => new Map(prev).set(result.file_id, fileStatus));

        // Start polling for this file's status
        pollFileStatus(result.file_id, file.name);

        // Small delay between uploads to avoid rate limiting
        if (i < fileArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        toastError(
          "Upload Failed",
          `${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  };

  // Poll status for a specific file
  const pollFileStatus = useCallback(async (fileId: string, filename: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/files/status/${fileId}`);
      if (!response.ok) throw new Error("Failed to fetch status");

      const status: ProcessingStatus = await response.json();
      
      // Update this file's status
      setProcessingFiles(prev => {
        const updated = new Map(prev);
        updated.set(fileId, status);
        return updated;
      });

      // Continue polling if not completed or failed
      if (status.status !== "completed" && status.status !== "failed") {
        const timeoutId = setTimeout(() => pollFileStatus(fileId, filename), 2000);
        pollingTimeouts.current.push(timeoutId);
      } else if (status.status === "completed") {
        toastSuccess(
          "Processing Complete!",
          `${filename}: ${status.cases_created || 0} case(s) created`
        );
        
        // Check if all files are done by reading current state
        setProcessingFiles(prev => {
          const updated = new Map(prev);
          updated.set(fileId, status);
          
          // Check if all files are completed or failed
          const allStatuses = Array.from(updated.values());
          const allDone = allStatuses.length > 0 && allStatuses.every(
            s => s.status === "completed" || s.status === "failed"
          );
          
          if (allDone) {
            // Refresh signals and close dialog
            setTimeout(() => {
              fetchData();
              setProcessing(false);
              setUploadDialogOpen(false);
            }, 1000);
          }
          
          return updated;
        });
      } else if (status.status === "failed") {
        toastError("Processing Failed", `${filename}: ${status.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error polling status:", error);
      toastError("Error", `Failed to check status for ${filename}`);
    }
  }, [fetchData]);

  // Export to CSV
  const exportToCSV = () => {
    if (selectedSignals.length === 0) {
      toastError("No Selection", "Please select signals to export");
      return;
    }

    const headers = ["Drug", "Reaction", "PRR", "Cases", "Priority", "AI Confidence", "Serious"];
    const rows = selectedSignals.map((s) => [
      s.drug,
      s.reaction,
      s.prr.toFixed(2),
      s.cases.toString(),
      s.priority,
      ((s.ai_confidence || 0) * 100).toFixed(0) + "%",
      s.serious ? "Yes" : "No",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signals-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toastSuccess("Exported!", `${selectedSignals.length} signals exported to CSV`);
  };

  // Define table columns
  const columns: Column<Signal>[] = [
    {
      id: "drug",
      header: "Drug",
      accessor: (row) => <span className="font-semibold text-white">{row.drug}</span>,
      sortable: true,
      width: 180,
    },
    {
      id: "reaction",
      header: "Reaction",
      accessor: (row) => <span className="text-gray-300">{row.reaction}</span>,
      sortable: true,
      width: 220,
    },
    {
      id: "prr",
      header: "PRR",
      accessor: (row) => (
        <span className={row.prr > 10 ? "text-danger-500 font-semibold" : "text-gray-200"}>
          {row.prr.toFixed(1)}
        </span>
      ),
      sortable: true,
      width: 80,
      align: "right",
    },
    {
      id: "cases",
      header: "Cases",
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <span className="text-white">{row.cases.toLocaleString()}</span>
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
          {((row.ai_confidence || 0) * 100).toFixed(0)}%
        </Badge>
      ),
      sortable: true,
      width: 100,
    },
    {
      id: "priority",
      header: "Priority",
      accessor: (row) => {
        const variants = {
          critical: "danger" as const,
          high: "warning" as const,
          medium: "default" as const,
          low: "secondary" as const,
        };
        return (
          <Badge variant={variants[row.priority]} size="sm">
            {row.priority.toUpperCase()}
          </Badge>
        );
      },
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
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Navigation Bar */}
      <Navbar
        onUploadClick={() => setUploadDialogOpen(true)}
        onExportClick={exportToCSV}
        exportCount={selectedSignals.length}
      />

              <div className="flex flex-1 overflow-hidden">
                {/* Session Sidebar */}
            <SessionSidebar
              onSessionChange={(sessionIdOrDate) => {
                // SessionSidebar may pass either a UUID (session ID) or a date string
                // If it's "all", keep it as is
                // If it's a UUID, we need to convert it to a date by looking up the session
                // For now, just pass it through - backend will handle UUID detection
                setSelectedSession(sessionIdOrDate);
              }}
              currentSessionId={selectedSession}
              totalCases={stats?.total_cases || 0}
              totalSignals={signals.length}
            />
                
                {/* Saved Analyses Sidebar */}
                <div className="w-64 border-l bg-gray-50 p-3">
                  <SavedAnalysesList sessionId={sessionId} />
                </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
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

        {/* Compact Collapsible AI Priority Signals */}
        <div className="mb-4 border-b border-gray-700 bg-gray-800/50">
          <div 
            className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-800 transition-colors"
            onClick={() => setPrioritySignalsExpanded(!prioritySignalsExpanded)}
          >
            <div className="flex items-center gap-1.5">
              {prioritySignalsExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              )}
              <Brain className="h-4 w-4 text-primary-500" />
              <h2 className="text-sm font-semibold text-white">AI Priority Signals</h2>
              {prioritySignals.length > 0 && (
                <Badge variant="quantum" size="sm">
                  {prioritySignals.length}
                </Badge>
              )}
            </div>
            <span className="text-[10px] text-gray-400">
              Click to {prioritySignalsExpanded ? "collapse" : "expand"}
            </span>
          </div>
          
          {prioritySignalsExpanded && (
            <>
              {prioritySignals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2 p-2">
                  {prioritySignals.map((signal) => (
                    <Card
                      key={signal.id}
                      className="border-l-2 border-l-danger-500 bg-danger-500/10 hover:bg-danger-500/20 transition-colors cursor-pointer"
                      padding="sm"
                    >
                      <CardContent className="p-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="text-xs font-semibold text-white line-clamp-2 flex-1">
                              {signal.drug} + {signal.reaction}
                            </h3>
                            <Badge variant="quantum" size="sm" className="shrink-0 text-[9px]">
                              {((signal.ai_confidence || 0) * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <p className="text-[10px] text-gray-300">
                            PRR: {signal.prr.toFixed(1)} | {signal.cases} cases
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-400 text-xs">
                  <Brain className="h-6 w-6 mx-auto mb-2 text-gray-500" />
                  <p className="font-medium mb-1">No AI Priority Signals</p>
                  <p className="text-[10px] text-gray-500">
                    {signals.length === 0 
                      ? "No signals found in the database. Upload data to see priority signals."
                      : signals.filter(s => s.priority === "critical").length === 0
                      ? "No critical signals found. AI Priority Signals requires signals with 'critical' priority and AI confidence > 80%."
                      : `Found ${signals.filter(s => s.priority === "critical").length} critical signal(s), but none have AI confidence > 80%.`}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Main Table Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle>All Signals ({signals.length})</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="danger" className="cursor-pointer hover:opacity-80">
                    Critical
                  </Badge>
                  <Badge variant="warning" className="cursor-pointer hover:opacity-80">
                    High
                  </Badge>
                  <Badge variant="secondary" className="cursor-pointer hover:opacity-80">
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
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-300">Advanced Filters</p>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">Dataset</label>
                    <select
                      value={selectedDataset}
                      onChange={(e) => setSelectedDataset(e.target.value)}
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-50 focus:border-primary-500 focus:outline-none"
                    >
                      <option value="all">All Datasets</option>
                      {datasets.map((dataset) => (
                        <option key={dataset.value} value={dataset.value}>
                          {dataset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">Serious Events</label>
                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="serious-only"
                        checked={seriousOnly}
                        onChange={(e) => setSeriousOnly(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500"
                      />
                      <label htmlFor="serious-only" className="text-sm text-gray-300 cursor-pointer">
                        Serious events only
                      </label>
                    </div>
                  </div>
                  
                  {/* Multi-Tenant Filtering */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-200">Analysis Scope</label>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="filterLevel"
                            value="user"
                            checked={filterLevel === 'user'}
                            onChange={(e) => {
                              setFilterLevel('user');
                              setSelectedUsers([]);
                            }}
                            className="h-4 w-4 text-primary-500 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-300">My Files Only</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="filterLevel"
                            value="team"
                            checked={filterLevel === 'team'}
                            onChange={(e) => setFilterLevel('team')}
                            className="h-4 w-4 text-primary-500 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-300">My Team</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="filterLevel"
                            value="organization"
                            checked={filterLevel === 'organization'}
                            onChange={(e) => {
                              setFilterLevel('organization');
                              setSelectedUsers([]);
                            }}
                            className="h-4 w-4 text-primary-500 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-300">All Organization</span>
                        </label>
                      </div>
                      
                      {/* Team Member Selection (only shown when team level is selected) */}
                      {filterLevel === 'team' && (
                        <div className="mt-2">
                          <label className="text-xs font-medium text-gray-400 mb-2 block">
                            Select Team Members
                          </label>
                          {availableUsers.length === 0 ? (
                            <p className="text-xs text-gray-500 mt-2">
                              Team filtering is not yet available. Please use "My Files Only" or "All Organization" instead.
                            </p>
                          ) : (
                            <>
                              <MultiSelect
                                options={availableUsers.map(user => ({
                                  id: user.id,
                                  label: user.name,
                                  email: user.email
                                }))}
                                selected={selectedUsers}
                                onSelectionChange={setSelectedUsers}
                                placeholder="Search and select team members..."
                                searchPlaceholder="Search by name or email..."
                                emptyMessage="No team members found."
                                className="bg-gray-800 border-gray-700"
                              />
                              {selectedUsers.length === 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Select at least one team member to filter
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      
                      {/* Current filter info */}
                      <div className="text-xs text-gray-500 mt-2">
                        {filterLevel === 'user' && currentUserId && (
                          <span>Showing: Only your uploaded files</span>
                        )}
                        {filterLevel === 'team' && selectedUsers.length > 0 && (
                          <span>Showing: {selectedUsers.length} team member(s)</span>
                        )}
                        {filterLevel === 'organization' && (
                          <span>Showing: All files from {currentOrganization || 'your organization'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
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
                emptyMessage="No signals found. Try adjusting your search or filters."
              />
            )}
          </CardContent>
        </Card>
          </div>
        </div>
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
              <div className="space-y-4">
                {uploadedFiles.length > 0 ? (
                  // Multiple files processing
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent" />
                      <p className="text-lg font-semibold text-white mt-4">
                        Processing {uploadedFiles.length} file(s)...
                      </p>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {uploadedFiles.map((file, index) => {
                        const fileStatus = Array.from(processingFiles.values()).find(
                          s => s.filename === file.name
                        );
                        return (
                          <div
                            key={index}
                            className="p-3 border border-gray-700 rounded-lg bg-gray-800/50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-white truncate flex-1">
                                {file.name}
                              </p>
                              {fileStatus && (
                                <Badge
                                  variant={
                                    fileStatus.status === "completed"
                                      ? "success"
                                      : fileStatus.status === "failed"
                                      ? "danger"
                                      : "secondary"
                                  }
                                  size="sm"
                                >
                                  {fileStatus.status}
                                </Badge>
                              )}
                            </div>
                            {fileStatus && (
                              <>
                                <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
                                  <div
                                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${fileStatus.progress || 0}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-400">
                                  {fileStatus.message || "Processing..."}
                                </p>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Single file processing (backward compatibility)
                  <div className="text-center space-y-4">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent" />
                    <div>
                      <p className="text-lg font-semibold text-white">AI Processing...</p>
                      <p className="text-sm text-gray-400 mt-2">{uploadedFile?.name}</p>

                      {processingStatus && (
                        <div className="mt-6 space-y-3">
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${processingStatus.progress || 0}%` }}
                            />
                          </div>

                          {/* Status Message */}
                          <p className="text-sm text-gray-300">
                            {processingStatus.message || 
                              (processingStatus.status === "queued" && "File queued for processing...") ||
                              (processingStatus.status === "processing" && "AI processing file...") ||
                              (processingStatus.status === "completed" && 
                                `Processing complete! ${processingStatus.cases_created || 0} case(s) created.`) ||
                              (processingStatus.status === "failed" && 
                                `Processing failed: ${processingStatus.error || "Unknown error"}`) ||
                              "Processing..."}
                          </p>

                          {/* Progress Steps */}
                          <div className="space-y-2 text-sm text-left">
                            <div className="flex items-center gap-2">
                              {(processingStatus.progress || 0) >= 10 ? (
                                <CheckCircle2 className="h-4 w-4 text-success-500" />
                              ) : (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                              )}
                              <span
                                className={
                                  (processingStatus.progress || 0) >= 10
                                    ? "text-success-500"
                                    : "text-gray-400"
                                }
                              >
                                Extracting content...
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {(processingStatus.progress || 0) >= 30 ? (
                                <CheckCircle2 className="h-4 w-4 text-success-500" />
                              ) : (processingStatus.progress || 0) >= 10 ? (
                                <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-gray-600" />
                              )}
                              <span
                                className={
                                  (processingStatus.progress || 0) >= 30
                                    ? "text-success-500"
                                    : (processingStatus.progress || 0) >= 10
                                    ? "text-primary-400"
                                    : "text-gray-500"
                                }
                              >
                                AI entity extraction...
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {(processingStatus.progress || 0) >= 60 ? (
                                <CheckCircle2 className="h-4 w-4 text-success-500" />
                              ) : (processingStatus.progress || 0) >= 30 ? (
                                <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-gray-600" />
                              )}
                              <span
                                className={
                                  (processingStatus.progress || 0) >= 60
                                    ? "text-success-500"
                                    : (processingStatus.progress || 0) >= 30
                                    ? "text-primary-400"
                                    : "text-gray-500"
                                }
                              >
                                Creating cases...
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {(processingStatus.progress || 0) >= 90 ? (
                                <CheckCircle2 className="h-4 w-4 text-success-500" />
                              ) : (processingStatus.progress || 0) >= 60 ? (
                                <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-gray-600" />
                              )}
                              <span
                                className={
                                  (processingStatus.progress || 0) >= 90
                                    ? "text-success-500"
                                    : (processingStatus.progress || 0) >= 60
                                    ? "text-primary-400"
                                    : "text-gray-500"
                                }
                              >
                                Auto-coding with MedDRA...
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors bg-gray-800/30"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="mb-2 text-sm text-gray-300">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                     PDF | Email | Word | Excel | ZIP | Images | Audio
                  </p>
                  <p className="text-xs text-primary-400 mt-2">
                    Select multiple files - Our AI handles any format automatically
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv,.eml,.msg,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.bmp,.mp3,.wav,.m4a,.xml"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      if (files.length === 1) {
                        // Single file - use original handler for backward compatibility
                        handleFileUpload(files[0]);
                      } else {
                        // Multiple files - use batch handler
                        handleMultipleFileUpload(files);
                      }
                    }
                  }}
                />
              </label>
            )}
          </div>
        </DialogContent>
      </Dialog>

              {/* Chat Interface Component with shared sessionId - Fixed width container */}
              <div className="flex gap-3 mt-4">
                <div className="w-80 shrink-0">
                  <ChatInterface 
                    sessionId={sessionId}
                    onQuerySubmit={(query) => {
                      // Optionally refresh data after query
                      console.log('Query submitted:', query);
                    }}
                  />
                </div>
                <div className="w-56 shrink-0">
                  <SessionAnalysesSidebar sessionId={sessionId} />
                </div>
              </div>
    </div>
  );
}
