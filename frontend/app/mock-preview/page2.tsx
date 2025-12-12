"use client";

import React, { useState } from "react";
import {
  Home,
  Activity,
  Database,
  BarChart3,
  FileText,
  Search,
  Bell,
  Upload,
  Download,
  Brain,
  AlertTriangle,
  TrendingUp,
  Send,
  Sparkles,
  Filter,
  ChevronRight,
  Plus,
  Clock,
  Users,
  Settings,
  LogOut,
  User,
  Lightbulb,
  Zap,
  RefreshCw,
} from "lucide-react";

// ---------- Mock data ----------

const mockSignals = [
  {
    id: 1,
    drug: "Aspirin",
    reaction: "Gastrointestinal Bleeding",
    prr: 15.3,
    cases: 234,
    priority: "critical",
    serious: true,
    confidence: 0.95,
    trend: "increasing",
  },
  {
    id: 2,
    drug: "Warfarin",
    reaction: "Internal Hemorrhage",
    prr: 12.8,
    cases: 189,
    priority: "critical",
    serious: true,
    confidence: 0.92,
    trend: "stable",
  },
  {
    id: 3,
    drug: "Metformin",
    reaction: "Lactic Acidosis",
    prr: 8.4,
    cases: 156,
    priority: "high",
    serious: true,
    confidence: 0.85,
    trend: "increasing",
  },
  {
    id: 4,
    drug: "Lisinopril",
    reaction: "Angioedema",
    prr: 6.2,
    cases: 98,
    priority: "high",
    serious: true,
    confidence: 0.78,
    trend: "stable",
  },
  {
    id: 5,
    drug: "Atorvastatin",
    reaction: "Rhabdomyolysis",
    prr: 5.1,
    cases: 67,
    priority: "medium",
    serious: false,
    confidence: 0.71,
    trend: "decreasing",
  },
  {
    id: 6,
    drug: "Amoxicillin",
    reaction: "Anaphylaxis",
    prr: 4.8,
    cases: 54,
    priority: "medium",
    serious: true,
    confidence: 0.68,
    trend: "stable",
  },
];

const mockDatasets = [
  {
    id: 1,
    name: "FAERS Q4 2024",
    files: 45,
    cases: 12345,
    uploaded: "2024-12-01",
    status: "processed",
  },
  {
    id: 2,
    name: "Clinical Trial Data",
    files: 23,
    cases: 5432,
    uploaded: "2024-11-28",
    status: "processing",
  },
  {
    id: 3,
    name: "Post-Market Surveillance",
    files: 67,
    cases: 23456,
    uploaded: "2024-11-15",
    status: "processed",
  },
];

const mockAnalyses = [
  { id: 1, title: "Fever Analysis", created: "2024-12-11", cases: 38, filters: "Fever" },
  {
    id: 2,
    title: "Cardiac Events Q4",
    created: "2024-12-10",
    cases: 234,
    filters: "Cardiac, Last 3 months",
  },
  { id: 3, title: "Bleeding Reactions", created: "2024-12-09", cases: 156, filters: "Bleeding, Serious" },
];

const sparklineData = [100, 120, 110, 130, 125, 140, 135, 145, 150, 155];

// ---------- Types ----------

type PageId =
  | "dashboard"
  | "signals"
  | "data"
  | "analytics"
  | "reports"
  | "analysis-detail"
  | "dataset-detail"
  | "social-ae"
  | "portfolio";

type AnalysisLike = {
  title: string;
  created?: string;
  cases?: number;
  prr?: number;
  confidence?: number;
};

type DatasetLike = {
  id: number;
  name: string;
  files: number;
  cases: number;
  uploaded: string;
  status: string;
};

// ---------- Small components ----------

function Sparkline({ data, color = "#3B82F6" }: { data: number[]; color?: string }) {
  return (
    <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#gradient-${color})`}
        points={
          data.map((val, i) => `${i * 10},${30 - val / 5}`).join(" ") + " 100,30 0,30"
        }
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        points={data.map((val, i) => `${i * 10},${30 - val / 5}`).join(" ")}
      />
    </svg>
  );
}

// ---------- Main page ----------

export default function AetherPrototypePage() {
  const [currentPage, setCurrentPage] = useState<PageId>("signals");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string; actions?: string[] }[]
  >([]);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisLike | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<DatasetLike | null>(null);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: chatInput }]);
    setChatInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I found 47 critical signals matching your criteria. Would you like me to generate a detailed analysis report?",
          actions: ["Generate Report", "Show Filters", "View Details"],
        },
      ]);
    }, 800);
  };

  // ---------- Top nav ----------

  const TopNav = () => (
    <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + brand */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setCurrentPage("dashboard")}
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AetherSignal</h1>
              <p className="text-xs text-gray-400">AI-Powered Pharmacovigilance</p>
            </div>
          </div>

          {/* Main nav: modules */}
          <nav className="flex flex-wrap items-center gap-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: Home },
              { id: "signals", label: "Signals", icon: Activity, badge: "5" },
              { id: "social-ae", label: "Social AE", icon: Users },
              { id: "portfolio", label: "Portfolio", icon: BarChart3 },
              { id: "data", label: "Data", icon: Database },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
              { id: "reports", label: "Reports", icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id as PageId)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-500/10 text-blue-400"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {"badge" in item && item.badge && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQuickSearch(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            >
              <Search className="h-4 w-4" />
            </button>
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((x) => !x)}
                className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
              >
                <span className="text-xs font-bold text-white">VK</span>
              </button>
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">Vikas Kumar</p>
                    <p className="text-xs text-gray-400">vikas@example.com</p>
                  </div>
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 text-gray-300 hover:text-white">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Profile</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 text-gray-300 hover:text-white">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">Settings</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 text-gray-300 hover:text-white border-t border-gray-700">
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ---------- Pages ----------

  const DashboardPage = () => (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of your pharmacovigilance activities</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Total Cases</p>
              <p className="text-2xl font-bold text-white">12,345</p>
            </div>
          </div>
          <div className="text-xs text-green-500">↑ 15.5% from last month</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-red-500/20">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Critical Signals</p>
              <p className="text-2xl font-bold text-white">47</p>
            </div>
          </div>
          <div className="text-xs text-red-500">↑ 23% requiring attention</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-amber-500/20">
              <TrendingUp className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Serious Events</p>
              <p className="text-2xl font-bold text-white">3,421</p>
            </div>
          </div>
          <div className="text-xs text-amber-500">↑ 8.2% reported this period</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-green-500/20">
              <FileText className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Reports Generated</p>
              <p className="text-2xl font-bold text-white">156</p>
            </div>
          </div>
          <div className="text-xs text-green-500">↑ 12% this quarter</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {mockAnalyses.slice(0, 5).map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 cursor-pointer"
                onClick={() => {
                  setSelectedAnalysis({
                    title: analysis.title,
                    created: analysis.created,
                    cases: analysis.cases,
                  });
                  setCurrentPage("analysis-detail");
                }}
              >
                <div>
                  <p className="text-sm font-medium text-white">{analysis.title}</p>
                  <p className="text-xs text-gray-400">
                    {analysis.cases} cases • {analysis.created}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCurrentPage("signals")}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-750 text-left"
            >
              <Activity className="h-6 w-6 text-blue-400 mb-2" />
              <p className="text-sm font-medium text-white">View Signals</p>
              <p className="text-xs text-gray-400">Monitor safety signals</p>
            </button>
            <button
              onClick={() => setCurrentPage("data")}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-750 text-left"
            >
              <Upload className="h-6 w-6 text-green-400 mb-2" />
              <p className="text-sm font-medium text-white">Upload Data</p>
              <p className="text-xs text-gray-400">Add new datasets</p>
            </button>
            <button
              onClick={() => setCurrentPage("social-ae")}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-750 text-left"
            >
              <Users className="h-6 w-6 text-pink-400 mb-2" />
              <p className="text-sm font-medium text-white">Social AE</p>
              <p className="text-xs text-gray-400">Monitor social chatter</p>
            </button>
            <button
              onClick={() => setCurrentPage("portfolio")}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-750 text-left"
            >
              <BarChart3 className="h-6 w-6 text-amber-400 mb-2" />
              <p className="text-sm font-medium text-white">Portfolio</p>
              <p className="text-xs text-gray-400">Product-level risk views</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const SignalsPage = () => (
    <div className="flex h-[calc(100vh-76px)]">
      {/* Left Sidebar */}
      <div className="w-72 border-r border-gray-800 bg-gray-900 p-4 space-y-4 overflow-y-auto">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
            Sessions
          </h3>
          <div className="space-y-2">
            <div className="p-3 bg-blue-500/20 border border-blue-500 rounded-lg cursor-pointer">
              <div className="font-medium text-sm text-white">All Sessions</div>
              <div className="text-xs text-gray-400 mt-1">
                1,234 files | 12,345 cases
              </div>
            </div>
            <div className="p-3 bg-gray-800 hover:bg-gray-750 rounded-lg cursor-pointer">
              <div className="font-medium text-sm text-white">Today</div>
              <div className="text-xs text-gray-400 mt-1">
                45 files | 523 cases
              </div>
            </div>
            <div className="p-3 bg-gray-800 hover:bg-gray-750 rounded-lg cursor-pointer">
              <div className="font-medium text-sm text-white">Yesterday</div>
              <div className="text-xs text-gray-400 mt-1">
                38 files | 467 cases
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="relative overflow-hidden bg-gray-900 rounded-lg border border-gray-800 p-6 group hover:shadow-xl transition-all hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50 group-hover:opacity-70" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-gray-800 text-blue-400 group-hover:bg-blue-500/20 transition-all">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase">
                    Total Cases
                  </h3>
                  <p className="text-[10px] text-gray-500">vs last 30 days</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">12,345</div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-green-500">
                  ↑ +15.5%
                </span>
                <span className="text-xs text-gray-400">from last month</span>
              </div>
              <div className="h-16">
                <Sparkline data={sparklineData} color="#3B82F6" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gray-900 rounded-lg border-l-4 border-l-red-500 border-t border-r border-b border-gray-800 p-6 group hover:shadow-xl hover:shadow-red-500/20 transition-all hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-50 group-hover:opacity-70" />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gray-800 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase">
                      Critical Signals
                    </h3>
                    <p className="text-[10px] text-gray-500">vs last 30 days</p>
                  </div>
                </div>
                <div className="p-1 rounded bg-red-500/20 text-red-400">
                  <span className="text-xs">⚠️</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">47</div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-red-500">
                  ↑ +23%
                </span>
                <span className="text-xs text-gray-400">requiring attention</span>
              </div>
              <div className="p-2 rounded-lg bg-gray-800/50 border border-gray-700 mb-3">
                <p className="text-xs text-gray-300">
                  23% increase in cardiac-related signals detected
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gray-900 rounded-lg border border-gray-800 p-6 group hover:shadow-xl transition-all hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-50 group-hover:opacity-70" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-gray-800 text-amber-500">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase">
                    Serious Events
                  </h3>
                  <p className="text-[10px] text-gray-500">vs last 30 days</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">3,421</div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-amber-500">
                  ↑ +8.2%
                </span>
                <span className="text-xs text-gray-400">reported this period</span>
              </div>
              <div className="h-16">
                <Sparkline
                  data={[100, 102, 105, 107, 110, 112, 115, 118, 120, 122]}
                  color="#F59E0B"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Critical signals band */}
        <div className="rounded-lg border-2 border-red-500/30 bg-gradient-to-br from-red-500/10 via-gray-900 to-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-500/20 bg-gray-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20 animate-pulse">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Critical Signals Detected
                  <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                    5
                  </span>
                </h2>
                <p className="text-xs text-gray-400">
                  AI-identified safety signals requiring immediate attention
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-5 gap-4">
              {mockSignals.slice(0, 5).map((signal) => (
                <div
                  key={signal.id}
                  className="group relative rounded-lg border border-gray-700 bg-gray-800 p-4 hover:border-red-500/50 hover:bg-gray-750 transition-all hover:scale-105 cursor-pointer"
                  onClick={() => {
                    setSelectedAnalysis({
                      title: `${signal.drug} - ${signal.reaction}`,
                      cases: signal.cases,
                      prr: signal.prr,
                      confidence: signal.confidence,
                    });
                    setCurrentPage("analysis-detail");
                  }}
                >
                  <div className="absolute top-2 right-2">
                    <div className="px-2 py-0.5 text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      {Math.round(signal.confidence * 100)}%
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-bold text-white truncate">
                      {signal.drug}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <ChevronRight className="h-3 w-3 text-gray-500" />
                      <div className="text-xs text-gray-400 truncate">
                        {signal.reaction}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="text-[10px] text-gray-500 uppercase">
                        PRR
                      </div>
                      <div className="text-base font-bold text-red-400">
                        {signal.prr}
                      </div>
                    </div>
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="text-[10px] text-gray-500 uppercase">
                        Cases
                      </div>
                      <div className="text-base font-bold text-white">
                        {signal.cases}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data table */}
        <div className="bg-gray-900 rounded-lg border border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                All Signals
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-800 rounded-full">
                  {mockSignals.length}
                </span>
              </h2>
              <button className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 rounded-lg hover:bg-gray-700">
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search drug or reaction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                {["critical", "high", "medium"].map((p) => (
                  <button
                    key={p}
                    onClick={() =>
                      setSelectedPriority((prev) =>
                        prev.includes(p)
                          ? prev.filter((x) => x !== p)
                          : [...prev, p]
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedPriority.includes(p)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">
                    Drug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">
                    Reaction
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-300 uppercase">
                    PRR
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-300 uppercase">
                    Cases
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockSignals.map((signal) => (
                  <tr
                    key={signal.id}
                    className="border-b border-gray-800 hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {signal.drug}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {signal.reaction}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-mono text-blue-400">
                      {signal.prr.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-white">
                      {signal.cases}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          signal.priority === "critical"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : signal.priority === "high"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {signal.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedAnalysis({
                            title: `${signal.drug} - ${signal.reaction}`,
                            cases: signal.cases,
                            prr: signal.prr,
                            confidence: signal.confidence,
                          });
                          setCurrentPage("analysis-detail");
                        }}
                        className="px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Sidebar - AI Chat */}
      <div className="w-96 border-l border-gray-800 bg-gray-900 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
              <p className="text-xs text-gray-400">Ask about your data</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 mb-4">
                <Lightbulb className="h-8 w-8 text-purple-400" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">
                Ask me anything
              </h4>
              <p className="text-xs text-gray-400 text-center mb-4">
                Try asking:
              </p>
              <div className="space-y-2 w-full">
                {[
                  "Show critical signals",
                  "Serious events last 30 days",
                  "Cases with bleeding",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setChatInput(q)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-blue-500 hover:bg-gray-750 transition-all text-left"
                  >
                    <AlertTriangle className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-300">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-800 text-gray-200"
                  }`}
                >
                  <div className="text-sm">{msg.text}</div>
                  {msg.actions && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.actions.map((action) => (
                        <button
                          key={action}
                          className="px-3 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about cases, drugs, reactions..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const DataPage = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Data Management
          </h1>
          <p className="text-gray-400">Manage datasets and upload new data</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          <Upload className="h-4 w-4" />
          Upload Dataset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <Database className="h-8 w-8 text-blue-400 mb-3" />
          <p className="text-2xl font-bold text-white mb-1">3</p>
          <p className="text-sm text-gray-400">Total Datasets</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <FileText className="h-8 w-8 text-green-400 mb-3" />
          <p className="text-2xl font-bold text-white mb-1">135</p>
          <p className="text-sm text-gray-400">Total Files</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <Activity className="h-8 w-8 text-purple-400 mb-3" />
          <p className="text-2xl font-bold text-white mb-1">41,233</p>
          <p className="text-sm text-gray-400">Total Cases</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Datasets</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-300 uppercase">
                Files
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-300 uppercase">
                Cases
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">
                Uploaded
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {mockDatasets.map((dataset) => (
              <tr
                key={dataset.id}
                className="border-b border-gray-800 hover:bg-gray-800 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium text-white">
                  {dataset.name}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-300">
                  {dataset.files}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-300">
                  {dataset.cases.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {dataset.uploaded}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      dataset.status === "processed"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {dataset.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => {
                      setSelectedDataset(dataset);
                      setCurrentPage("dataset-detail");
                    }}
                    className="px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const AnalyticsPage = () => (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Advanced Analytics</h1>
        <p className="text-gray-400">
          Deep statistical analysis and quantum fusion
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-blue-500/50 transition-colors cursor-pointer">
          <TrendingUp className="h-8 w-8 text-blue-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Trend Analysis</h3>
          <p className="text-sm text-gray-400">
            Time series analysis with forecasting
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-purple-500/50 transition-colors cursor-pointer">
          <BarChart3 className="h-8 w-8 text-purple-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">
            Comparative Analysis
          </h3>
          <p className="text-sm text-gray-400">
            Compare drugs, periods, and cohorts
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-indigo-500/50 transition-colors cursor-pointer">
          <Zap className="h-8 w-8 text-indigo-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Quantum Fusion</h3>
          <p className="text-sm text-gray-400">
            Advanced AI-powered signal ranking
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500/50 transition-colors cursor-pointer">
          <Activity className="h-8 w-8 text-green-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">
            Statistical Tests
          </h3>
          <p className="text-sm text-gray-400">
            PRR, ROR, IC, BCPNN calculations
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">Recent Analyses</h2>
        <div className="space-y-3">
          {mockAnalyses.map((analysis) => (
            <div
              key={analysis.id}
              className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 cursor-pointer"
              onClick={() => {
                setSelectedAnalysis({
                  title: analysis.title,
                  created: analysis.created,
                  cases: analysis.cases,
                });
                setCurrentPage("analysis-detail");
              }}
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {analysis.title}
                </p>
                <p className="text-xs text-gray-400">
                  {analysis.cases} cases • {analysis.filters}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ReportsPage = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reports Center</h1>
          <p className="text-gray-400">Generate and manage regulatory reports</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          <Plus className="h-4 w-4" />
          Create Report
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-blue-500/50 transition-colors cursor-pointer">
          <FileText className="h-8 w-8 text-blue-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">PSUR Template</h3>
          <p className="text-sm text-gray-400">Periodic Safety Update Report</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-purple-500/50 transition-colors cursor-pointer">
          <FileText className="h-8 w-8 text-purple-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">PBRER Template</h3>
          <p className="text-sm text-gray-400">
            Periodic Benefit-Risk Evaluation Report
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500/50 transition-colors cursor-pointer">
          <FileText className="h-8 w-8 text-green-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Custom Report</h3>
          <p className="text-sm text-gray-400">Build your own report</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">Recent Reports</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-white">
                  Q4 2024 Safety Report
                </p>
                <p className="text-xs text-gray-400">
                  Generated on 2024-12-01 • 45 pages
                </p>
              </div>
            </div>
            <button className="px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600">
              <Download className="h-3 w-3 inline mr-1" />
              Download
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-white">
                  Monthly Signal Summary - November
                </p>
                <p className="text-xs text-gray-400">
                  Generated on 2024-11-30 • 23 pages
                </p>
              </div>
            </div>
            <button className="px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600">
              <Download className="h-3 w-3 inline mr-1" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AnalysisDetailPage = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage("signals")}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            <ChevronRight className="h-5 w-5 text-gray-400 rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {selectedAnalysis?.title || "Analysis Detail"}
            </h1>
            <p className="text-sm text-gray-400">
              Created: {selectedAnalysis?.created || "Recently"} •{" "}
              {selectedAnalysis?.cases || 0} cases
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
            <Download className="h-4 w-4 inline mr-2" />
            Export
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Save Analysis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-400 uppercase mb-2">Total Cases</p>
          <p className="text-3xl font-bold text-white">
            {selectedAnalysis?.cases || 0}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-400 uppercase mb-2">PRR Score</p>
          <p className="text-3xl font-bold text-blue-400">
            {selectedAnalysis?.prr ?? "N/A"}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-400 uppercase mb-2">
            AI Confidence
          </p>
          <p className="text-3xl font-bold text-purple-400">
            {selectedAnalysis?.confidence
              ? `${Math.round(selectedAnalysis.confidence * 100)}%`
              : "N/A"}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">
          Case Distribution Over Time
        </h2>
        <div className="h-64 flex items-end justify-between gap-2">
          {[45, 52, 48, 65, 58, 72, 68, 75, 82, 78, 85, 92].map(
            (height, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-500/20 hover:bg-blue-500/40 transition-colors rounded-t"
                style={{ height: `${height}%` }}
              />
            )
          )}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>Jan</span>
          <span>Dec</span>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">
          Quantum Fusion Results
        </h2>
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase">
                Drug–Event Pair
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-300 uppercase">
                Fusion Score
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase">
                Alert Level
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              { pair: "Aspirin - GI Bleeding", score: 0.947, level: "Critical" },
              { pair: "Warfarin - Hemorrhage", score: 0.923, level: "Critical" },
              {
                pair: "Metformin - Lactic Acidosis",
                score: 0.856,
                level: "High",
              },
            ].map((row, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td className="px-4 py-3 text-sm text-white">{row.pair}</td>
                <td className="px-4 py-3 text-sm text-right font-mono text-blue-400">
                  {row.score.toFixed(3)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      row.level === "Critical"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {row.level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const DatasetDetailPage = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage("data")}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            <ChevronRight className="h-5 w-5 text-gray-400 rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {selectedDataset?.name || "Dataset Detail"}
            </h1>
            <p className="text-sm text-gray-400">
              Uploaded: {selectedDataset?.uploaded || "Recently"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
            <RefreshCw className="h-4 w-4 inline mr-2" />
            Reprocess
          </button>
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
            Delete Dataset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-400 uppercase mb-2">Total Files</p>
          <p className="text-3xl font-bold text-white">
            {selectedDataset?.files || 0}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-400 uppercase mb-2">Total Cases</p>
          <p className="text-3xl font-bold text-white">
            {selectedDataset?.cases?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-400 uppercase mb-2">Status</p>
          <span
            className={`px-3 py-1 text-sm rounded-full font-medium ${
              selectedDataset?.status === "processed"
                ? "bg-green-500/20 text-green-400"
                : "bg-amber-500/20 text-amber-400"
            }`}
          >
            {selectedDataset?.status || "Unknown"}
          </span>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-400 uppercase mb-2">Data Quality</p>
          <p className="text-3xl font-bold text-green-400">98%</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">Data Quality Report</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Complete Records</p>
                <p className="text-xs text-gray-400">All required fields present</p>
              </div>
            </div>
            <span className="text-lg font-bold text-green-400">100%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Valid Dates</p>
                <p className="text-xs text-gray-400">Date formats are correct</p>
              </div>
            </div>
            <span className="text-lg font-bold text-green-400">98%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-lg">!</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Duplicate Cases
                </p>
                <p className="text-xs text-gray-400">
                  Potential duplicates found
                </p>
              </div>
            </div>
            <span className="text-lg font-bold text-amber-500">2%</span>
          </div>
        </div>
      </div>
    </div>
  );

  // --- New: Social AE & Portfolio placeholder screens ---

  const SocialAePage = () => (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Social AE Monitor</h1>
        <p className="text-gray-400">
          High-level view of adverse-event chatter across social media, forums, and
          patient communities.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <Users className="h-8 w-8 text-pink-400 mb-3" />
          <p className="text-2xl font-bold text-white mb-1">8,742</p>
          <p className="text-sm text-gray-400">Mentions this week</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
          <p className="text-2xl font-bold text-white mb-1">63</p>
          <p className="text-sm text-gray-400">High-severity posts</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <TrendingUp className="h-8 w-8 text-amber-400 mb-3" />
          <p className="text-2xl font-bold text-white mb-1">3</p>
          <p className="text-sm text-gray-400">
            Products with rising social risk
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">
          Top Social AE Signals (Mock)
        </h2>
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase">
                Product
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase">
                Event cluster
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-300 uppercase">
                Posts
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-300 uppercase">
                Neg. sentiment
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                product: "Drug X",
                event: "Chest pain / palpitations",
                posts: 324,
                neg: "78%",
              },
              {
                product: "Drug Y",
                event: "Severe insomnia",
                posts: 187,
                neg: "65%",
              },
              {
                product: "Drug Z",
                event: "Mood changes / agitation",
                posts: 142,
                neg: "71%",
              },
            ].map((row, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td className="px-4 py-3 text-sm text-white">{row.product}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{row.event}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-200">
                  {row.posts}
                </td>
                <td className="px-4 py-3 text-sm text-right text-red-400">
                  {row.neg}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const PortfolioPage = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Portfolio Risk Overview
          </h1>
          <p className="text-gray-400">
            Product-level view of aggregated safety signals across all data
            sources.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
          <BarChart3 className="h-4 w-4" />
          Configure portfolios
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-400 uppercase mb-2">Products</p>
          <p className="text-3xl font-bold text-white">24</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-400 uppercase mb-2">
            Products with critical signals
          </p>
          <p className="text-3xl font-bold text-red-400">4</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-400 uppercase mb-2">
            At watchlist threshold
          </p>
          <p className="text-3xl font-bold text-amber-400">7</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-400 uppercase mb-2">
            Improving since last period
          </p>
          <p className="text-3xl font-bold text-green-400">5</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">
          Portfolio Signal Heatmap (Mock)
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          This is a placeholder layout – later you can swap in a real chart
          component (Recharts, ECharts, etc.).
        </p>
        <div className="grid grid-cols-6 gap-1 text-xs text-gray-300">
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 10 }).map((__, col) => {
              const level = (row + col) % 3;
              const bg =
                level === 0
                  ? "bg-green-500/30"
                  : level === 1
                  ? "bg-amber-500/30"
                  : "bg-red-500/40";
              return (
                <div
                  key={`${row}-${col}`}
                  className={`h-6 rounded ${bg} border border-gray-800`}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  // ---------- Router ----------

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "signals":
        return <SignalsPage />;
      case "data":
        return <DataPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "reports":
        return <ReportsPage />;
      case "analysis-detail":
        return <AnalysisDetailPage />;
      case "dataset-detail":
        return <DatasetDetailPage />;
      case "social-ae":
        return <SocialAePage />;
      case "portfolio":
        return <PortfolioPage />;
      default:
        return <SignalsPage />;
    }
  };

  // ---------- Render ----------

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <TopNav />
      {renderPage()}

      {/* Quick Search Modal */}
      {showQuickSearch && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32"
          onClick={() => setShowQuickSearch(false)}
        >
          <div
            className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search signals, analyses, datasets..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                autoFocus
              />
              <kbd className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded">
                ESC
              </kbd>
            </div>
            <div className="p-4">
              <div className="text-sm text-gray-400 mb-3">Recent searches</div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 cursor-pointer">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-300">
                    Cases with fever
                  </span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 cursor-pointer">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-300">
                    Cardiac signals last month
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
