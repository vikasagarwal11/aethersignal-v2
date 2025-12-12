import React, { useState } from "react";

/**
 * Compact, multi-page AetherSignal shell
 * - Top nav with clickable tabs (Dashboard, Signals, Analyses, Settings)
 * - Signals page uses the richer compact layout
 * - AI Priority Signals cards have clickable PRR / Cases / Trend
 * - Upload Data opens a front-end-only modal
 */

const kpiCards = [
  {
    label: "Total Cases",
    value: "12,487",
    delta: "+12.3% vs last month",
  },
  {
    label: "Critical Signals",
    value: "37",
    delta: "+4 since yesterday",
  },
  {
    label: "Serious Events",
    value: "624",
    delta: "+2.1% vs last month",
  },
  {
    label: "Products Monitored",
    value: "86",
    delta: "Stable",
  },
];

const prioritySignals = [
  {
    rank: 1,
    drug: "Aspirin",
    reaction: "Gastrointestinal bleeding",
    prr: "15.3",
    cases: 234,
    score: "0.95",
    trend: "Increasing",
  },
  {
    rank: 2,
    drug: "Warfarin",
    reaction: "Internal hemorrhage",
    prr: "12.8",
    cases: 189,
    score: "0.92",
    trend: "Stable",
  },
  {
    rank: 3,
    drug: "Metformin",
    reaction: "Lactic acidosis",
    prr: "8.4",
    cases: 156,
    score: "0.85",
    trend: "Increasing",
  },
];

type PageKey = "dashboard" | "signals" | "analyses" | "settings";

type MetricKind = "PRR" | "Cases" | "Trend";

type PrioritySignal = (typeof prioritySignals)[number];

interface MetricDetail {
  metric: MetricKind;
  signal: PrioritySignal;
}

function NavPill({
  label,
  page,
  active,
  onClick,
}: {
  label: string;
  page: PageKey;
  active: boolean;
  onClick: (page: PageKey) => void;
}) {
  return (
    <button
      onClick={() => onClick(page)}
      className={[
        "px-2 py-1 rounded-full text-xs font-medium transition-colors",
        active
          ? "bg-blue-500/10 text-blue-400 border border-blue-500/40"
          : "text-gray-400 hover:text-gray-100 hover:bg-gray-800 border border-transparent",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

/* ---------------- Upload Modal (front-end only) ---------------- */

function UploadDataDialogMock({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  const mockFiles = [
    {
      name: "faers_q4_2024.zip",
      size: "124 MB",
      stage: "Creating cases…",
      progress: 72,
    },
    {
      name: "trial_1234_sae.xlsx",
      size: "4.2 MB",
      stage: "AI entity extraction…",
      progress: 38,
    },
  ];

  const stages = [
    "Upload & integrity checks",
    "Extracting content",
    "AI entity extraction",
    "Creating cases",
    "Auto-coding with MedDRA",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="w-full max-w-3xl rounded-2xl border border-[#262A33] bg-[#10141C] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#262A33] px-6 py-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-medium text-blue-300 border border-blue-500/40">
              ⚡ Smart ingestion
            </div>
            <h2 className="mt-2 text-lg font-semibold text-gray-50">
              Upload data – any safety format
            </h2>
            <p className="mt-1 text-xs text-gray-400 max-w-xl">
              Drop FAERS dumps, CIOMS forms, line listings, PDFs, Excel, ZIPs, or
              social exports. AetherSignal will auto-detect structure, extract
              entities, and create coded cases.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-full px-2 py-1 text-xs text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-4">
          {/* Left: Drop zone */}
          <div className="space-y-3">
            <div className="rounded-xl border-2 border-dashed border-[#2A2F36] bg-[#151A22]/80 px-4 py-6 text-center hover:border-blue-500/70 hover:bg-[#151A22] transition-colors">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-xl">
                📄
              </div>
              <p className="text-sm font-medium text-gray-50">
                Drag & drop files here
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                Or <span className="text-blue-400">browse from your computer</span>
              </p>
              <p className="mt-2 text-[10px] text-gray-500">
                Supported: PDF, DOCX, XLSX/CSV, XML, JSON, ZIP, images, audio logs
              </p>
            </div>

            <div className="rounded-lg border border-[#262A33] bg-[#151A22]/90 px-3 py-2 text-[11px] text-gray-300">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-200">Ingestion profile</span>
                <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] text-gray-400 border border-gray-700">
                  Auto-detect
                </span>
              </div>
              <p className="mt-1 text-[10px] text-gray-400">
                You can fine-tune mappings later in Settings → Data connectors.
              </p>
            </div>
          </div>

          {/* Right: Pipeline & file list */}
          <div className="space-y-3">
            {/* Pipeline steps */}
            <div className="rounded-lg border border-[#262A33] bg-[#151A22]/90 px-3 py-2">
              <p className="text-[11px] font-semibold text-gray-200 mb-2">
                Processing pipeline
              </p>
              <ol className="space-y-1">
                {stages.map((stage, idx) => (
                  <li key={stage} className="flex items-center gap-2 text-[11px]">
                    <span
                      className={[
                        "flex h-4 w-4 items-center justify-center rounded-full border text-[9px]",
                        idx === 0
                          ? "border-blue-400 text-blue-300 bg-blue-500/20"
                          : "border-gray-600 text-gray-400",
                      ].join(" ")}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className={idx === 0 ? "text-gray-100" : "text-gray-400"}
                    >
                      {stage}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* File list */}
            <div className="rounded-lg border border-[#262A33] bg-[#151A22]/90 px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-gray-200">
                  Files in this batch
                </p>
                <p className="text-[10px] text-gray-400">2 files • 128 MB</p>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {mockFiles.map((file) => (
                  <div
                    key={file.name}
                    className="rounded-md border border-[#262A33] bg-[#10141C]/95 px-2 py-1.5 text-[11px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-gray-100">{file.name}</div>
                      <span className="text-[10px] text-gray-500">
                        {file.size}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-gray-400">
                        {file.stage}
                      </span>
                      <span className="text-[10px] text-blue-300">
                        {file.progress}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-[#242936] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-gray-500">
                When processing completes, signals will auto-refresh in the Signals
                view.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#262A33] bg-[#10141C] px-6 py-3">
          <div className="text-[10px] text-gray-500">
            Data stays in your secure environment. No PHI is sent to third-party
            LLMs.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 text-[11px] text-gray-200 hover:bg-gray-800"
            >
              Close
            </button>
            <button className="rounded-full bg-blue-500 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-400 shadow-[0_0_0_1px_rgba(59,130,246,0.6)]">
              Start processing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Metric detail panel (drill-down) ---------------- */

function MetricDetailPanel({
  detail,
  onClose,
}: {
  detail: MetricDetail | null;
  onClose: () => void;
}) {
  if (!detail) return null;

  const { metric, signal } = detail;

  const metricValue =
    metric === "PRR"
      ? signal.prr
      : metric === "Cases"
      ? signal.cases
      : signal.trend;

  return (
    <div className="mt-3 rounded-xl border border-blue-500/40 bg-[#10141C]/95 px-4 py-3 text-[11px] text-gray-200">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold text-blue-200 mb-1">
            {metric} drill-down
          </div>
          <div className="text-sm font-semibold text-gray-50">
            {signal.drug} · {signal.reaction}
          </div>
          <p className="mt-1 text-[11px] text-gray-300">
            Selected metric:{" "}
            <span className="font-semibold text-blue-200">
              {metric} = {metricValue}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-gray-400 max-w-xl">
            In the real app, this interaction would open a dedicated analysis
            view (e.g., PRR timeline, case listing, or trend analysis) for this
            drug–event pair. For now, this panel is a placeholder so you can
            see where that drill-down would appear.
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full px-2 py-1 text-[10px] text-gray-400 hover:text-gray-100 hover:bg-gray-800"
        >
          ✕
        </button>
      </div>
      <div className="mt-2 text-[10px] text-gray-500">
        Suggested behaviours:
        <ul className="list-disc list-inside">
          <li>Click PRR → open disproportionality detail page.</li>
          <li>Click Cases → open case listing filtered to this signal.</li>
          <li>Click Trend → open temporal trend chart for this combination.</li>
        </ul>
      </div>
    </div>
  );
}

/* ---------------- MAIN APP SHELL ---------------- */

export default function AetherSignalAppMock() {
  const [activePage, setActivePage] = useState<PageKey>("signals");
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F1115] text-gray-100 flex flex-col">
      {/* TOP NAVBAR - shared across pages */}
      <header className="h-16 border-b border-[#262A33] bg-[#10141C]/95 backdrop-blur flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-semibold">
            AS
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">AetherSignal</div>
            <div className="text-[11px] text-gray-400">
              AI-powered pharmacovigilance
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-2 ml-8">
            <NavPill
              label="Dashboard"
              page="dashboard"
              active={activePage === "dashboard"}
              onClick={setActivePage}
            />
            <NavPill
              label="Signals"
              page="signals"
              active={activePage === "signals"}
              onClick={setActivePage}
            />
            <NavPill
              label="Analyses"
              page="analyses"
              active={activePage === "analyses"}
              onClick={setActivePage}
            />
            <NavPill
              label="Settings"
              page="settings"
              active={activePage === "settings"}
              onClick={setActivePage}
            />
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden sm:inline-flex items-center gap-1 rounded-full border border-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-800">
            Export
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 sm:px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_0_1px_rgba(59,130,246,0.6)] hover:bg-blue-400"
          >
            Upload data
          </button>
          <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-[11px] font-semibold">
            AR
          </div>
        </div>
      </header>

      {/* PAGE CONTENT - switches based on activePage */}
      {activePage === "signals" && <SignalsPageMock />}
      {activePage === "dashboard" && <DashboardPageMock />}
      {activePage === "analyses" && <AnalysesPageMock />}
      {activePage === "settings" && <SettingsPageMock />}

      <UploadDataDialogMock open={showUpload} onClose={() => setShowUpload(false)} />
    </div>
  );
}

/* ---------------- SIGNALS PAGE ---------------- */

function SignalsPageMock() {
  const [metricDetail, setMetricDetail] = useState<MetricDetail | null>(null);

  const handleMetricClick = (metric: MetricKind, signal: PrioritySignal) => {
    setMetricDetail({ metric, signal });
  };

  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
      {/* LEFT RAIL: Sessions + Saved Analyses */}
      <aside className="w-68 border-r border-[#262A33] bg-[#10141C]/95 backdrop-blur flex flex-col">
        <div className="px-3 pt-3 pb-2 border-b border-[#262A33] flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            Context
          </div>
          <button className="text-[10px] text-gray-400 hover:text-gray-200">
            Refresh
          </button>
        </div>

        <div className="px-3 pt-3">
          <div className="inline-flex rounded-full bg-gray-900 p-1 text-[11px] font-medium text-gray-300">
            <button className="px-2 py-1 rounded-full bg-gray-800">Sessions</button>
            <button className="px-2 py-1 rounded-full text-gray-400 hover:text-gray-100">
              Saved
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
          <div className="mt-3 mb-2 text-[11px] font-semibold text-gray-400">
            Recent sessions
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <button
                key={i}
                className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition flex flex-col gap-1 ${
                  i === 0
                    ? "border-blue-500/60 bg-blue-500/10"
                    : "border-[#2A2F36] bg-[#1A1D24]/80 hover:bg-[#1A1D24]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-100">Session {i + 1}</span>
                  <span className="text-[10px] text-gray-400">
                    Today, 09:{5 + i} UTC
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span>Files: {3 + i}</span>
                  <span>Cases: {120 + i * 7}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#262A33] px-3 py-1.5 text-[11px] text-gray-400 flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-200">Current view</div>
            <div>All sessions · Org scope</div>
          </div>
          <div className="text-right">
            <div>Cases: 12.4k</div>
            <div>Signals: 932</div>
          </div>
        </div>
      </aside>

      {/* CENTER: Workbench */}
      <main className="flex-1 flex flex-col border-x border-[#262A33] bg-gradient-to-b from-[#0F1115] via-[#10141C] to-[#151822]">
        {/* Top strip: context chips */}
        <section className="px-4 lg:px-6 pt-2 pb-1.5 border-b border-[#222632] flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-900 px-2 py-1 text-gray-200">
              Org: <span className="font-medium">Global Safety</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-900 px-2 py-1 text-gray-200">
              Dataset: <span className="font-medium">FAERS + EudraVigilance</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-900 px-2 py-1 text-gray-200">
              Scope: <span className="font-medium">Organization</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <label className="inline-flex items-center gap-1 cursor-pointer text-gray-300">
              <input
                type="checkbox"
                className="h-3 w-3 rounded border-gray-600 bg-gray-900"
              />
              Serious only
            </label>
            <button className="text-gray-400 hover:text-gray-100 underline decoration-dotted underline-offset-4">
              Clear filters
            </button>
          </div>
        </section>

        {/* KPI Section */}
        <section className="px-4 lg:px-6 pt-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 mb-2">
            Today’s Safety Snapshot
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {kpiCards.map((kpi) => (
              <div
                key={kpi.label}
                className="relative overflow-hidden rounded-xl border border-[#262A33] bg-gradient-to-br from-[#151A22] via-[#151A22] to-[#1D222C] px-3 py-2.5 shadow-sm"
              >
                <div className="text-[11px] font-medium text-gray-400 mb-1">
                  {kpi.label}
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-xl font-semibold tracking-tight text-gray-50">
                    {kpi.value}
                  </div>
                  <div className="text-[10px] text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5 border border-emerald-500/50">
                    {kpi.delta}
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-[#242936] overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Priority Signals */}
        <section className="px-4 lg:px-6 mt-3">
          <div className="rounded-2xl border border-red-500/35 bg-gradient-to-r from-red-500/12 via-[#141821] to-[#141821] px-4 py-2.5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-[11px] font-semibold text-red-200 border border-red-500/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-300 animate-pulse" />
                  AI Priority Signals
                  <span className="text-[10px] text-red-100/80 ml-1">
                    5 critical · 12 high
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-gray-200 max-w-xl">
                  Highest-risk drug–event combinations ranked by AI confidence,
                  disproportionality, and temporal patterns. Review these first.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <button className="rounded-full border border-red-500/60 px-3 py-1 text-[11px] font-medium text-red-100 hover:bg-red-500/20">
                  View all critical
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {prioritySignals.map((sig) => (
                <div
                  key={sig.drug + sig.reaction}
                  className="rounded-xl border border-red-500/35 bg-[#11151E]/95 px-3 py-1.5 text-[11px] flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-gray-400 mb-0.5">
                        Rank #{sig.rank}
                      </div>
                      <div className="text-[11px] font-semibold text-gray-100 truncate">
                        {sig.drug}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">
                        {sig.reaction}
                      </div>
                    </div>
                    <span className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                      AI score {sig.score}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-300 gap-2">
                    <button
                      onClick={() => handleMetricClick("PRR", sig)}
                      className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[11px] text-red-100 border border-red-500/40 hover:bg-red-500/20"
                    >
                      <span className="text-[10px] uppercase text-red-200/80">
                        PRR
                      </span>
                      <span className="font-semibold">{sig.prr}</span>
                    </button>

                    <button
                      onClick={() => handleMetricClick("Cases", sig)}
                      className="inline-flex items-center gap-1 rounded-md bg-gray-900 px-1.5 py-0.5 text-[11px] text-gray-100 border border-gray-700 hover:bg-gray-800"
                    >
                      <span className="text-[10px] uppercase text-gray-400">
                        Cases
                      </span>
                      <span className="font-semibold">{sig.cases}</span>
                    </button>

                    <button
                      onClick={() => handleMetricClick("Trend", sig)}
                      className="inline-flex items-center gap-1 rounded-md bg-gray-900 px-1.5 py-0.5 text-[11px] text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/10"
                    >
                      <span className="text-[10px] uppercase text-emerald-200/80">
                        Trend
                      </span>
                      <span className="font-semibold">
                        {sig.trend === "Increasing"
                          ? "↗ Increasing"
                          : sig.trend === "Decreasing"
                          ? "↘ Decreasing"
                          : "• Stable"}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metric detail drill-down placeholder */}
          <MetricDetailPanel
            detail={metricDetail}
            onClose={() => setMetricDetail(null)}
          />
        </section>

        {/* Signals Workbench: filters + table (simplified mock) */}
        <section className="px-4 lg:px-6 mt-4 mb-4 flex-1 flex flex-col min-h-0">
          {/* Table header toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-100">Signals</h2>
              <span className="text-[11px] text-gray-400">932 results</span>
              <div className="hidden md:flex items-center gap-1 ml-3 text-[11px]">
                <button className="rounded-full bg-red-500/20 border border-red-500/60 px-2 py-1 text-red-100 text-[11px]">
                  Critical
                </button>
                <button className="rounded-full bg-amber-500/10 border border-amber-500/40 px-2 py-1 text-amber-100 text-[11px]">
                  High
                </button>
                <button className="rounded-full bg-gray-800 border border-gray-700 px-2 py-1 text-gray-200 text-[11px]">
                  Medium
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  className="h-8 w-48 rounded-full border border-gray-700 bg-gray-900 pl-7 pr-2 text-[11px] text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Search drug or reaction..."
                />
                <span className="pointer-events-none absolute left-2 top-1.5 text-[11px] text-gray-500">
                  🔍
                </span>
              </div>
              <button className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 text-[11px] text-gray-100 hover:bg-gray-800">
                <span>Advanced filters</span>
              </button>
            </div>
          </div>

          {/* Advanced filters bar (mock) */}
          <div className="mb-2.5 rounded-xl border border-[#262A33] bg-[#151A22]/90 px-3 py-2 flex flex-wrap items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Dataset</span>
              <select className="h-7 rounded-md border border-gray-700 bg-gray-950 px-2 text-[11px] text-gray-100">
                <option>All datasets</option>
                <option>FAERS only</option>
                <option>EudraVigilance only</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Scope</span>
              <div className="inline-flex rounded-full bg-gray-950 p-1 border border-gray-700">
                <button className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-100">
                  Org
                </button>
                <button className="px-2 py-0.5 rounded-full text-gray-400">
                  Team
                </button>
                <button className="px-2 py-0.5 rounded-full text-gray-400">
                  My files
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <label className="inline-flex items-center gap-1 text-gray-300">
                <input
                  type="checkbox"
                  className="h-3 w-3 rounded border-gray-600 bg-gray-900"
                />
                Serious events only
              </label>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 min-h-0 rounded-xl border border-[#262A33] bg-[#10141C]/95 overflow-hidden">
            <div className="grid grid-cols-[1.5fr,1.5fr,0.6fr,0.6fr,0.8fr,0.7fr,0.9fr] border-b border-[#262A33] bg-[#151A22] text-[11px] text-gray-300">
              {["Drug", "Reaction", "PRR", "Cases", "Priority", "Serious", "Actions"].map(
                (h) => (
                  <div key={h} className="px-3 py-2 font-medium">
                    {h}
                  </div>
                )
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar text-[11px]">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1.5fr,1.5fr,0.6fr,0.6fr,0.8fr,0.7fr,0.9fr] border-b border-[#1C202A] hover:bg-[#171B24]"
                >
                  <div className="px-3 py-2 text-gray-100">Drug {i + 1}</div>
                  <div className="px-3 py-2 text-gray-300">
                    Some adverse event description {i + 1}
                  </div>
                  <div className="px-3 py-2 text-gray-200">{(3.1 + i * 0.2).toFixed(1)}</div>
                  <div className="px-3 py-2 text-gray-200">
                    {42 + i * 3}
                  </div>
                  <div className="px-3 py-2">
                    <span className="inline-flex rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-100 border border-red-500/60">
                      Critical
                    </span>
                  </div>
                  <div className="px-3 py-2 text-gray-100">Yes</div>
                  <div className="px-3 py-2">
                    <button className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] text-gray-100 hover:bg-gray-800">
                      View details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* RIGHT: Chat rail – very light placeholder */}
      <aside className="w-80 border-l border-[#262A33] bg-[#0F1115] flex flex-col">
        <div className="px-3 pt-3 pb-2 border-b border-[#262A33]">
          <div className="text-[11px] font-semibold text-gray-200">AI Assistant</div>
          <div className="text-[10px] text-gray-400">
            Ask about your current view or serious cases.
          </div>
        </div>
        <div className="flex-1 px-3 py-3 text-[11px] text-gray-400">
          (Chat UI placeholder in this mock)
        </div>
      </aside>
    </div>
  );
}

/* ---------------- SIMPLE PLACEHOLDER PAGES ---------------- */

function DashboardPageMock() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Dashboard mock (lighter wireframe). Focus real design effort on the Signals
      page first.
    </div>
  );
}

function AnalysesPageMock() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Analyses mock page – list of saved analyses, filters, and quick links to
      deep reports.
    </div>
  );
}

function SettingsPageMock() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Settings mock – org settings, ingestion profiles, user roles, etc.
    </div>
  );
}
