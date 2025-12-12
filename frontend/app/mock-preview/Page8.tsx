import React, { useState } from "react";

/**
 * AetherSignal Signals Dashboard Redesign Mock
 * - Multi-page shell with top navigation
 * - Compact sessions rail (CFR-style timestamps)
 * - Signals page with KPI row + AI Priority row (5 cards on wide screens)
 * - PRR / Cases / Trend clicks open:
 *    - Centered modal (deep-analysis placeholder)
 *    - Inline drill-down panel above the table
 * - Right-side AI Assistant rail with fixed input + session analyses tab
 */

// ---------- Mock data ----------

const kpiCards = [
  { label: "Total Cases", value: "12,487", delta: "+12.3% vs last month" },
  { label: "Critical Signals", value: "37", delta: "+4 since yesterday" },
  { label: "Serious Events", value: "624", delta: "+2.1% vs last month" },
  { label: "Products Monitored", value: "86", delta: "Stable" },
];

const prioritySignals = [
  {
    id: "aspirin_gi_bleeding",
    rank: 1,
    drug: "Aspirin",
    reaction: "Gastrointestinal bleeding",
    prr: "15.3",
    cases: 234,
    score: "0.95",
    trend: "Increasing" as const,
    severity: "critical" as const,
  },
  {
    id: "warfarin_internal_hemorrhage",
    rank: 2,
    drug: "Warfarin",
    reaction: "Internal hemorrhage",
    prr: "12.8",
    cases: 189,
    score: "0.92",
    trend: "Stable" as const,
    severity: "critical" as const,
  },
  {
    id: "metformin_lactic_acidosis",
    rank: 3,
    drug: "Metformin",
    reaction: "Lactic acidosis",
    prr: "8.4",
    cases: 156,
    score: "0.85",
    trend: "Increasing" as const,
    severity: "high" as const,
  },
  {
    id: "lisinopril_angioedema",
    rank: 4,
    drug: "Lisinopril",
    reaction: "Angioedema",
    prr: "6.2",
    cases: 98,
    score: "0.78",
    trend: "Stable" as const,
    severity: "high" as const,
  },
  {
    id: "atorvastatin_rhabdo",
    rank: 5,
    drug: "Atorvastatin",
    reaction: "Rhabdomyolysis",
    prr: "5.1",
    cases: 67,
    score: "0.71",
    trend: "Decreasing" as const,
    severity: "medium" as const,
  },
];

const sessionData = [
  {
    id: "S-2025-12-11-01",
    label: "Session 1",
    timestamp: "2025-12-11 09:05 UTC",
    files: 3,
    cases: 120,
  },
  {
    id: "S-2025-12-11-02",
    label: "Session 2",
    timestamp: "2025-12-11 09:06 UTC",
    files: 4,
    cases: 127,
  },
  {
    id: "S-2025-12-11-03",
    label: "Session 3",
    timestamp: "2025-12-11 09:07 UTC",
    files: 5,
    cases: 134,
  },
  {
    id: "S-2025-12-11-04",
    label: "Session 4",
    timestamp: "2025-12-11 09:08 UTC",
    files: 6,
    cases: 141,
  },
  {
    id: "S-2025-12-11-05",
    label: "Session 5",
    timestamp: "2025-12-11 09:09 UTC",
    files: 7,
    cases: 148,
  },
  {
    id: "S-2025-12-11-06",
    label: "Session 6",
    timestamp: "2025-12-11 09:10 UTC",
    files: 8,
    cases: 155,
  },
];

const sessionAnalyses = [
  { id: "AN-001", title: "Bleeding risk · Drug 1", type: "AI summary" },
  { id: "AN-002", title: "Bleeding risk · Drug 2", type: "AI summary" },
  { id: "AN-003", title: "Bleeding risk · Drug 3", type: "AI summary" },
];

type PageKey = "dashboard" | "signals" | "analyses" | "settings";
type ChatTab = "assistant" | "analyses";
type MetricKind = "PRR" | "Cases" | "Trend";
type PrioritySignal = (typeof prioritySignals)[number];

interface MetricDetail {
  metric: MetricKind;
  signal: PrioritySignal;
}

// Upload modal types
type UploadStatus = "queued" | "uploading" | "processing" | "completed" | "failed";

interface UploadItem {
  id: string;
  name: string;
  size: string;
  type: string;
  isZip: boolean;
  status: UploadStatus;
  progress: number; // 0–100
}

// ---------- Small components ----------

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

function MetricModal({
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-xl rounded-2xl border border-blue-500/50 bg-[#060910] px-5 py-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-blue-200 mb-1">
              {metric} drill-down
            </div>
            <div className="text-sm font-semibold text-gray-50">
              {signal.drug} · {signal.reaction}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-[11px] text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-[11px] text-gray-300">
          Selected metric:{" "}
          <span className="font-semibold text-blue-200">
            {metric} = {metricValue}
          </span>
        </p>
        <p className="mt-2 text-[11px] text-gray-400">
          In the real application, this interaction would open a dedicated analysis
          view for this drug–event pair (PRR timeline, case listing, or trend
          analysis). This modal is a prototype to show where that deep-analysis
          experience would live.
        </p>
        <div className="mt-3 text-[10px] text-gray-500">
          Suggested behaviours:
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Click PRR → open disproportionality detail page.</li>
            <li>Click Cases → open case listing filtered to this signal.</li>
            <li>Click Trend → open temporal trend chart for this combination.</li>
          </ul>
        </div>
        <div className="mt-4 flex justify-end gap-2 text-[11px]">
          <button
            className="rounded-full border border-gray-700 px-3 py-1 text-gray-300 hover:bg-gray-800"
            onClick={onClose}
          >
            Close
          </button>
          <button className="rounded-full bg-blue-500 px-3 py-1 font-semibold text-white hover:bg-blue-400">
            Open full analysis (mock)
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- MAIN APP SHELL ----------

export default function AetherSignalAppMock() {
  const [activePage, setActivePage] = useState<PageKey>("signals");
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#0F1115] text-gray-100 flex flex-col">
      {/* TOP NAVBAR */}
      <header className="h-16 border-b border-gray-800 bg-[#10141C]/95 backdrop-blur flex items-center justify-between px-4 lg:px-8">
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
            className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 sm:px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_0_1px_rgba(59,130,246,0.6)] hover:bg-blue-400"
            onClick={() => setShowUploadModal(true)}
          >
            Upload data
          </button>
          <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-[11px] font-semibold">
            AR
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      {activePage === "signals" && <SignalsPageMock />}
      {activePage === "dashboard" && <DashboardPageMock />}
      {activePage === "analyses" && <AnalysesPageMock />}
      {activePage === "settings" && <SettingsPageMock />}

      {/* Upload modal prototype */}
      <UploadModal open={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </div>
  );
}

// ---------- SIGNALS PAGE ----------

function SignalsPageMock() {
  const [metricDetail, setMetricDetail] = useState<MetricDetail | null>(null);
  const [inlineDetail, setInlineDetail] = useState<MetricDetail | null>(null);
  const [chatTab, setChatTab] = useState<ChatTab>("assistant");
  const [showFilters, setShowFilters] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [lastAction, setLastAction] = useState<"none" | "generated" | "adjusted">(
    "none",
  );

  const handleMetricClick = (metric: MetricKind, signal: PrioritySignal) => {
    const detail = { metric, signal };
    setMetricDetail(detail);     // centered modal
    setInlineDetail(detail);     // inline panel above table
  };

  const handleCardClick = (signal: PrioritySignal) => {
    // Prototype behaviour:
    // - highlight signal in inline drill-down using PRR as the primary metric
    // In the real app this would ALSO navigate to /signals/analysis/[id].
    setInlineDetail({ metric: "PRR", signal });
  };

  const handleViewInterpretation = () => {
    setShowFilters((prev) => !prev);
    setChatMenuOpen(false);
  };

  const handleConfirmGenerate = () => {
    setLastAction("generated");
    setChatMenuOpen(false);
  };

  const handleAdjustFilters = () => {
    setLastAction("adjusted");
    setChatMenuOpen(false);
  };

  // helper for inline panel
  const renderInlineMetricValue = (detail: MetricDetail) => {
    if (detail.metric === "PRR") return detail.signal.prr;
    if (detail.metric === "Cases") return detail.signal.cases;
    return detail.signal.trend;
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* LEFT RAIL: Sessions */}
      <aside className="w-68 border-r border-[#262A33] bg-[#10141C]/95 backdrop-blur flex flex-col text-[11px]">
        <div className="px-3 pt-2 pb-1.5 border-b border-gray-800 flex items-center justify-between">
          <div className="font-semibold uppercase tracking-[0.12em] text-gray-400">
            Context
          </div>
          <button className="text-[10px] text-gray-400 hover:text-gray-200">
            Refresh
          </button>
        </div>

        <div className="px-3 pt-2">
          <div className="inline-flex rounded-full bg-gray-900 p-1 font-medium text-gray-300">
            <button className="px-2 py-0.5 rounded-full bg-gray-800 text-[11px]">
              Sessions
            </button>
            <button className="px-2 py-0.5 rounded-full text-[11px] text-gray-400 hover:text-gray-100">
              Saved
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
          <div className="mt-2.5 mb-1.5 text-[10px] font-semibold text-gray-400">
            Recent sessions
          </div>
          <div className="space-y-1.5">
            {sessionData.map((s, idx) => (
              <button
                key={s.id}
                className={[
                  "w-full rounded-lg border px-2.5 py-1.5 text-left transition flex flex-col gap-0.5",
                  idx === 0
                    ? "border-blue-500/60 bg-blue-500/12"
                    : "border-[#2A2F36] bg-[#1A1D24]/80 hover:bg-[#1A1D24]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-100 truncate">
                    {s.label}
                  </span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {s.timestamp}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400">
                  {s.files} files · {s.cases} cases
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#262A33] px-3 py-1.5 text-[10px] text-gray-400 flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-200 text-[11px]">
              Current view
            </div>
            <div>All sessions · Org scope</div>
          </div>
          <div className="text-right">
            <div>Cases: 12.4k</div>
            <div>Signals: 932</div>
          </div>
        </div>
      </aside>

      {/* CENTER WORKBENCH */}
      <main className="flex-1 flex flex-col border-x border-[#262A33] bg-gradient-to-b from-[#0F1115] via-[#10141C] to-[#151822] text-[13px] overflow-y-auto">
        {/* Top strip */}
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

        {/* KPI row */}
        <section className="px-4 lg:px-6 pt-1.5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 mb-1.5">
            Today’s Safety Snapshot
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
            {kpiCards.map((kpi) => (
              <div
                key={kpi.label}
                className="relative overflow-hidden rounded-xl border border-[#262A33] bg-gradient-to-br from-[#151A22] via-[#151A22] to-[#1D222C] px-3 py-2 shadow-sm"
              >
                <div className="text-[10px] font-medium text-gray-400 mb-0.5">
                  {kpi.label}
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-semibold tracking-tight text-gray-50">
                    {kpi.value}
                  </div>
                  <div className="text-[10px] text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5 border border-emerald-500/50">
                    {kpi.delta}
                  </div>
                </div>
                <div className="mt-1 h-1 rounded-full bg-[#242936] overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Priority Signals */}
        <section className="px-4 lg:px-6 mt-2">
          <div className="rounded-2xl border border-red-500/35 bg-gradient-to-r from-red-500/12 via-[#141821] to-[#141821] px-3.5 py-2 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-red-200 border border-red-500/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-300 animate-pulse" />
                  AI Priority Signals
                </div>
                <p className="mt-1 text-[10px] text-gray-200 max-w-xl">
                  Highest-risk drug–event combinations ranked by AI confidence,
                  disproportionality, and temporal patterns. Review these first.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="rounded-full bg-gray-900/80 border border-gray-700 px-2 py-0.5 text-gray-200">
                  5 critical · 12 high
                </span>
                <button className="rounded-full border border-red-500/60 px-2.5 py-0.5 text-[10px] font-medium text-red-100 hover:bg-red-500/20">
                  View all critical
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
              {prioritySignals.map((sig) => (
                <button
                  key={sig.id}
                  type="button"
                  onClick={() => handleCardClick(sig)}
                  className="text-left rounded-xl border border-red-500/35 bg-[#11151E]/95 px-3 py-1.5 text-[10px] flex flex-col gap-1.5 hover:border-red-400/70 hover:bg-[#151A22] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-100 truncate text-[11px]">
                        {sig.drug}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {sig.reaction}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                        {Math.round(parseFloat(sig.score) * 100)}% AI
                      </span>
                      <span className="rounded-full border border-gray-700 bg-gray-900 px-1.5 py-0.5 text-[9px] uppercase text-gray-300">
                        Rank #{sig.rank}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-300">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMetricClick("PRR", sig);
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-100 border border-red-500/50"
                    >
                      <span className="text-[9px] uppercase text-red-200/80">PRR</span>
                      <span className="font-semibold">{sig.prr}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMetricClick("Cases", sig);
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-gray-900 px-1.5 py-0.5 text-[10px] text-gray-100 border border-gray-700"
                    >
                      <span className="text-[9px] uppercase text-gray-400">Cases</span>
                      <span className="font-semibold">{sig.cases}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMetricClick("Trend", sig);
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-200 border border-emerald-500/40"
                    >
                      <span className="text-[9px] uppercase text-emerald-200/80">
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
                </button>
              ))}
            </div>
          </div>

          {/* Metric modal */}
          <MetricModal detail={metricDetail} onClose={() => setMetricDetail(null)} />
        </section>

        {/* INLINE DRILL-DOWN PANEL (reintroduced, compact) */}
        {inlineDetail && (
          <section className="px-4 lg:px-6 mt-2">
            <div className="rounded-xl border border-[#262A33] bg-[#10141C]/95 px-3 py-2 text-[11px] text-gray-200 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold text-blue-200 mb-0.5">
                  {inlineDetail.metric} drill-down
                </div>
                <div className="text-[11px] font-semibold text-gray-50">
                  {inlineDetail.signal.drug} · {inlineDetail.signal.reaction}
                </div>
                <p className="mt-1 text-[10px] text-gray-300">
                  Selected metric:{" "}
                  <span className="font-semibold text-blue-200">
                    {inlineDetail.metric} = {renderInlineMetricValue(inlineDetail)}
                  </span>
                </p>
                <p className="mt-1 text-[10px] text-gray-400">
                  In the production app, this active signal would open a dedicated
                  deep-analysis view (PRR timeline, case listing, trend charts) on
                  click, while this panel keeps the key context visible on the
                  dashboard.
                </p>
              </div>
              <button
                className="mt-1 rounded-full px-2 py-1 text-[11px] text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                onClick={() => setInlineDetail(null)}
              >
                ✕
              </button>
            </div>
          </section>
        )}

        {/* Signals table placeholder */}
        <section className="px-4 lg:px-6 mt-3 mb-2 flex-1 flex flex-col min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-100">All Signals</h2>
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
                  className="h-8 w-52 rounded-full border border-gray-700 bg-gray-900 pl-7 pr-2 text-[11px] text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Search drug or reaction..."
                />
                <span className="pointer-events-none absolute left-2 top-1.5 text-[11px] text-gray-500">
                  🔍
                </span>
              </div>
              <button className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 text-[11px] text-gray-100 hover:bg-gray-800">
                Filters
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#262A33] bg-[#151A22]/90 px-3 py-2 text-[11px] text-gray-400 flex-1 flex items-center justify-center">
            Signals data table placeholder (use your existing data-table component
            in the real implementation).
          </div>
        </section>
      </main>

      {/* RIGHT RAIL: AI Assistant */}
      <aside className="w-80 border-l border-[#262A33] bg-[#0F1115] flex flex-col">
        {/* Header + tabs */}
        <div className="px-3 pt-3 pb-2 border-b border-[#262A33]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold text-gray-200">
                AI Assistant
              </div>
              <div className="text-[10px] text-gray-400">
                Ask about your current view or serious cases.
              </div>
            </div>
            <label className="flex items-center gap-1 text-[10px] text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                className="h-3 w-3 rounded border-gray-600 bg-gray-900"
              />
              Refinement
            </label>
          </div>

          <div className="mt-2 inline-flex rounded-full bg-gray-900 p-1 text-[11px] font-medium text-gray-300">
            <button
              className={[
                "px-2 py-0.5 rounded-full",
                chatTab === "assistant" ? "bg-gray-800 text-gray-100" : "text-gray-400",
              ].join(" ")}
              onClick={() => setChatTab("assistant")}
            >
              AI Assistant
            </button>
            <button
              className={[
                "px-2 py-0.5 rounded-full",
                chatTab === "analyses" ? "bg-gray-800 text-gray-100" : "text-gray-400",
              ].join(" ")}
              onClick={() => setChatTab("analyses")}
            >
              Analyses
            </button>
          </div>
        </div>

        {/* Messages / analyses area */}
        {chatTab === "assistant" ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 text-[11px] space-y-2">
            {/* Example conversation */}
            <div className="rounded-lg border border-gray-700 bg-[#10141C] px-3 py-2">
              <div className="text-[10px] text-gray-400 mb-1">
                You · natural language
              </div>
              <div className="text-[11px] text-gray-100">
                Show me serious bleeding events for Drug A in the last 12 months.
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-[#10141C] px-3 py-2 relative">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">
                    Assistant · summary
                  </div>
                  <div className="text-[11px] text-gray-100">
                    I found 37 matching cases across 3 datasets. The
                    disproportionality (PRR 4.8, 95% CI 3.9–5.7) is elevated vs
                    background.
                  </div>
                </div>
                <div className="relative">
                  <button
                    className="h-5 w-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                    onClick={() => setChatMenuOpen((open) => !open)}
                  >
                    ⋮
                  </button>
                  {chatMenuOpen && (
                    <div className="absolute right-0 mt-1 w-44 rounded-lg border border-gray-700 bg-[#05060A] shadow-lg z-10 text-[11px] text-gray-100">
                      <button
                        className="w-full px-3 py-1.5 text-left hover:bg-gray-800"
                        onClick={handleViewInterpretation}
                      >
                        View interpreted filters
                      </button>
                      <button
                        className="w-full px-3 py-1.5 text-left hover:bg-gray-800"
                        onClick={handleConfirmGenerate}
                      >
                        Confirm &amp; generate report
                      </button>
                      <button
                        className="w-full px-3 py-1.5 text-left hover:bg-gray-800"
                        onClick={handleAdjustFilters}
                      >
                        Adjust filters
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {showFilters && (
                <div className="mt-2 rounded-md border border-blue-500/40 bg-[#0B1020]/80 px-2.5 py-1.5 text-[10px] text-blue-100">
                  <div className="font-semibold mb-0.5">Interpreted query</div>
                  <div>
                    Filtering to: Drug A · SMQ: Hemorrhage · Serious = Yes · Period:
                    last 12 months · Org scope.
                  </div>
                </div>
              )}

              {lastAction === "generated" && (
                <div className="mt-2 rounded-full bg-emerald-500/10 border border-emerald-500/60 px-2.5 py-1 text-[10px] text-emerald-200">
                  Mock: report generated and deep analysis view would open in the real
                  application.
                </div>
              )}

              {lastAction === "adjusted" && (
                <div className="mt-2 rounded-full bg-blue-500/10 border border-blue-500/60 px-2.5 py-1 text-[10px] text-blue-200">
                  Mock: filter builder would open so you can refine these criteria.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 text-[11px]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-semibold text-gray-200">
                This session’s analyses
              </div>
              <button className="text-[10px] text-blue-400 hover:underline">
                View all
              </button>
            </div>
            <div className="space-y-1.5">
              {sessionAnalyses.map((a) => (
                <button
                  key={a.id}
                  className="w-full rounded-lg border border-[#262A33] bg-[#10141C] px-2.5 py-1.5 text-left hover:bg-[#151A22]"
                >
                  <div className="text-[11px] text-gray-100 truncate">
                    {a.title}
                  </div>
                  <div className="text-[10px] text-gray-400">{a.type}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat input (fixed within the rail) */}
        <div className="border-t border-[#262A33] px-3 py-2">
          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              className="flex-1 resize-none rounded-xl border border-gray-700 bg-gray-950/90 px-3 py-2 text-[13px] text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ask about drugs, reactions, time windows, or safety questions..."
            />
            <button className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm hover:bg-blue-400">
              ➤
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ---------- Upload modal, and simple placeholder pages ----------

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<UploadItem[]>(() => [
    {
      id: "u1",
      name: "faers_q3_2025.zip",
      size: "120 MB",
      type: "ZIP archive",
      isZip: true,
      status: "uploading",
      progress: 42,
    },
    {
      id: "u2",
      name: "eudravigilance_oct_2025.csv",
      size: "34 MB",
      type: "CSV",
      isZip: false,
      status: "processing",
      progress: 100,
    },
    {
      id: "u3",
      name: "japan_pmda_cases_2025-11.parquet",
      size: "18 MB",
      type: "Parquet",
      isZip: false,
      status: "completed",
      progress: 100,
    },
  ]);

  if (!open) return null;

  const formatSize = (bytes: number) => {
    if (!Number.isFinite(bytes)) return "";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const next: UploadItem[] = Array.from(files).map((file, idx) => {
      const isZip = file.name.toLowerCase().endsWith(".zip");
      return {
        id: `${Date.now()}-${idx}`,
        name: file.name,
        size: formatSize(file.size),
        type: isZip ? "ZIP archive" : file.type || "File",
        isZip,
        status: "queued",
        progress: 0,
      };
    });
    setItems((prev) => [...prev, ...next]);
    e.target.value = "";
  };

  const updateStatus = (status: UploadStatus) => {
    setItems((prev) =>
      prev.map((item) => {
        if (status === "uploading" && item.status === "queued") {
          return {
            ...item,
            status: "uploading",
            progress: item.isZip ? 30 : 65,
          };
        }
        if (status === "completed") {
          return {
            ...item,
            status: "completed",
            progress: 100,
          };
        }
        return item;
      }),
    );
  };

  const statusChipClasses = (status: UploadStatus) => {
    switch (status) {
      case "queued":
        return "bg-gray-800 text-gray-300 border-gray-600";
      case "uploading":
        return "bg-blue-500/10 text-blue-200 border-blue-500/60";
      case "processing":
        return "bg-amber-500/10 text-amber-200 border-amber-500/60";
      case "completed":
        return "bg-emerald-500/10 text-emerald-200 border-emerald-500/60";
      case "failed":
        return "bg-red-500/10 text-red-200 border-red-500/60";
      default:
        return "bg-gray-800 text-gray-300 border-gray-600";
    }
  };

  const statusLabel = (status: UploadStatus) => {
    switch (status) {
      case "queued":
        return "Queued";
      case "uploading":
        return "Uploading";
      case "processing":
        return "Processing";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-2xl rounded-2xl border border-[#262A33] bg-[#05060A] px-5 py-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-[11px] font-semibold text-gray-200">
              Upload safety data
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Select one or more files. ZIP archives are treated as a single
              upload; individual files will be tracked once the archive is unpacked
              server-side.
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-[11px] text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between gap-2 text-[11px]">
          <label className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 cursor-pointer text-gray-100 hover:bg-gray-800">
            <span>+ Add files</span>
            <input type="file" multiple className="hidden" onChange={handleFilesSelected} />
          </label>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-gray-700 px-3 py-1.5 text-[11px] text-gray-200 hover:bg-gray-800"
              onClick={() => updateStatus("uploading")}
            >
              Start upload (mock)
            </button>
            <button
              className="rounded-full bg-blue-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-400"
              onClick={() => updateStatus("completed")}
            >
              Mark all complete (mock)
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#262A33] bg-[#0B0F19] max-h-72 overflow-y-auto custom-scrollbar">
          <table className="w-full text-[11px]">
            <thead className="bg-[#0F1115] text-gray-400">
              <tr>
                <th className="text-left px-3 py-2 font-normal">File</th>
                <th className="text-left px-3 py-2 font-normal w-24">Type</th>
                <th className="text-right px-3 py-2 font-normal w-20">Size</th>
                <th className="text-left px-3 py-2 font-normal w-28">Status</th>
                <th className="text-left px-3 py-2 font-normal w-40">Progress</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-[11px] text-gray-500"
                  >
                    No files selected yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-[#262A33]">
                    <td className="px-3 py-2 align-top">
                      <div className="text-gray-100 truncate">{item.name}</div>
                      {item.isZip && (
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          ZIP archive – overall progress shown here; inner files will
                          appear after server-side unpacking.
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-gray-300">{item.type}</td>
                    <td className="px-3 py-2 align-top text-right text-gray-300">
                      {item.size}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 ${statusChipClasses(
                          item.status,
                        )}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
          <div>
            <div>
              CFR-style timestamps and audit trail will be attached to each file on
              ingestion.
            </div>
            <div>ZIP contents are logged per inner file once unpacked.</div>
          </div>
          <button
            className="rounded-full border border-gray-700 px-3 py-1.5 text-[11px] text-gray-200 hover:bg-gray-800"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple placeholders for other pages
function DashboardPageMock() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Dashboard mock (other modules like Social AE, Portfolio, etc. would plug in
      here).
    </div>
  );
}

function AnalysesPageMock() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Analyses list mock.
    </div>
  );
}

function SettingsPageMock() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Settings mock.
    </div>
  );
}
