import AetherSignalAppMock from "./AetherSignalAppMock";

export default function Page() {
  return <AetherSignalAppMock />;
}
import React, { useState } from "react";

/**
 * AetherSignal Signals Dashboard Redesign Mock
 *
 * Standalone React mock you can drop into a Next.js page or CRA app
 * to preview the redesigned layout + interactions.
 */

// ---------------------------------------------------------------------------
// Mock data & types
// ---------------------------------------------------------------------------

const kpiCards = [
  { label: "Total Cases", value: "12,487", delta: "+12.3% vs last month" },
  { label: "Critical Signals", value: "37", delta: "+4 since yesterday" },
  { label: "Serious Events", value: "624", delta: "+2.1% vs last month" },
  { label: "Products Monitored", value: "86", delta: "Stable" },
];

type TrendKind = "Increasing" | "Decreasing" | "Stable";

type PrioritySignal = {
  id: string;
  rank: number;
  drug: string;
  reaction: string;
  prr: string;
  cases: number;
  score: string;
  trend: TrendKind;
};

const prioritySignals: PrioritySignal[] = [
  {
    id: "aspirin-gi-bleeding",
    rank: 1,
    drug: "Aspirin",
    reaction: "Gastrointestinal Bleeding",
    prr: "15.3",
    cases: 234,
    score: "0.95",
    trend: "Increasing",
  },
  {
    id: "warfarin-ih",
    rank: 2,
    drug: "Warfarin",
    reaction: "Internal Hemorrhage",
    prr: "12.8",
    cases: 189,
    score: "0.92",
    trend: "Stable",
  },
  {
    id: "metformin-la",
    rank: 3,
    drug: "Metformin",
    reaction: "Lactic Acidosis",
    prr: "8.4",
    cases: 156,
    score: "0.85",
    trend: "Increasing",
  },
  {
    id: "lisinopril-angio",
    rank: 4,
    drug: "Lisinopril",
    reaction: "Angioedema",
    prr: "6.2",
    cases: 98,
    score: "0.78",
    trend: "Stable",
  },
  {
    id: "atorva-rhabdo",
    rank: 5,
    drug: "Atorvastatin",
    reaction: "Rhabdomyolysis",
    prr: "5.1",
    cases: 67,
    score: "0.71",
    trend: "Decreasing",
  },
];

type PageKey = "dashboard" | "signals" | "analyses" | "settings";
type MetricKind = "PRR" | "Cases" | "Trend";

type MetricDetail = {
  metric: MetricKind;
  signal: PrioritySignal;
} | null;

type ChatTab = "assistant" | "analyses";

const sessionData = [
  {
    id: "sess-all",
    label: "All Sessions",
    timestamp: "2025-12-11 09:55 UTC",
    files: 1234,
    cases: 12345,
  },
  {
    id: "sess-today",
    label: "Today",
    timestamp: "2025-12-11 09:45 UTC",
    files: 45,
    cases: 523,
  },
  {
    id: "sess-yday",
    label: "Yesterday",
    timestamp: "2025-12-10 18:30 UTC",
    files: 38,
    cases: 467,
  },
];

const sessionAnalyses = [
  { id: "a1", title: "Bleeding risk · Drug 1", type: "AI summary" },
  { id: "a2", title: "Bleeding risk · Drug 2", type: "AI summary" },
  { id: "a3", title: "Bleeding risk · Drug 3", type: "AI summary" },
];

// ---------------------------------------------------------------------------
// Small shared components
// ---------------------------------------------------------------------------

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
  detail: MetricDetail;
  onClose: () => void;
}) {
  if (!detail) return null;
  const { metric, signal } = detail;

  const heading =
    metric === "PRR"
      ? "PRR drill-down"
      : metric === "Cases"
      ? "Case listing preview"
      : "Trend analysis preview";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-2xl rounded-2xl border border-[#262A33] bg-[#05060A] px-5 py-4 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs font-semibold text-emerald-300 uppercase tracking-[0.16em]">
              {heading}
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-50">
              {signal.drug} · {signal.reaction}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              Selected metric:{" "}
              {metric === "PRR"
                ? `PRR = ${signal.prr}`
                : metric === "Cases"
                ? `${signal.cases} cases`
                : signal.trend === "Increasing"
                ? "Trend: Increasing vs baseline"
                : signal.trend === "Decreasing"
                ? "Trend: Decreasing vs baseline"
                : "Trend: Stable vs baseline"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-100 hover:bg-gray-800 text-xs"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-gray-300">
          In the real app, this interaction would open a dedicated analysis view
          (e.g., PRR timeline, case listing, or trend analysis) for this
          drug–event pair. For now, this dialog shows where that deep-dive would
          appear.
        </p>

        <ul className="mt-3 text-[11px] text-gray-400 list-disc list-inside space-y-0.5">
          <li>Click PRR → open disproportionality detail page.</li>
          <li>Click Cases → open case listing filtered to this signal.</li>
          <li>Click Trend → open temporal trend chart for this combination.</li>
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN APP SHELL
// ---------------------------------------------------------------------------

export default function AetherSignalAppMock() {
  const [activePage, setActivePage] = useState<PageKey>("signals");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* TOP NAVBAR - shared across pages */}
      <header className="h-16 border-b border-gray-800 bg-gray-950/90 backdrop-blur flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-semibold">
            AS
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">
              AetherSignal
            </div>
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
          <button className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 sm:px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_0_1px_rgba(59,130,246,0.6)] hover:bg-blue-400">
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// SIGNALS PAGE MOCK
// ---------------------------------------------------------------------------

function SignalsPageMock() {
  const [metricDetail, setMetricDetail] = useState<MetricDetail>(null);
  const [chatTab, setChatTab] = useState<ChatTab>("assistant");
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [lastAction, setLastAction] = useState<
    "none" | "generated" | "adjusted"
  >("none");

  const handleMetricClick = (metric: MetricKind, signal: PrioritySignal) => {
    setMetricDetail({ metric, signal });
  };

  const handleCardClick = (signal: PrioritySignal) => {
    // Real app: router.push(`/signals/analysis/${signal.id}`)
    alert(
      `Open deep analysis view for ${signal.drug} – ${signal.reaction} (id: ${signal.id})`
    );
  };

  const handleViewInterpretation = () => {
    setShowInterpretation((prev) => !prev);
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

  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* LEFT RAIL: Sessions */}
      <aside className="w-64 border-r border-[#262A33] bg-[#10141C]/95 backdrop-blur flex flex-col text-[11px]">
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
                      <span className="text-[9px] uppercase text-red-200/80">
                        PRR
                      </span>
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
                      <span className="text-[9px] uppercase text-gray-400">
                        Cases
                      </span>
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
          <MetricModal
            detail={metricDetail}
            onClose={() => setMetricDetail(null)}
          />
        </section>

        {/* Signals table placeholder */}
        <section className="px-4 lg:px-6 mt-3 mb-2 flex-1 flex flex-col min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-100">
                All Signals
              </h2>
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
            Signals data table placeholder (wire this to your real data-table
            component).
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
                chatTab === "assistant"
                  ? "bg-gray-800 text-gray-100"
                  : "text-gray-400",
              ].join(" ")}
              onClick={() => setChatTab("assistant")}
            >
              AI Assistant
            </button>
            <button
              className={[
                "px-2 py-0.5 rounded-full",
                chatTab === "analyses"
                  ? "bg-gray-800 text-gray-100"
                  : "text-gray-400",
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
            {/* User message */}
            <div className="ml-6 max-w-xs rounded-2xl bg-blue-500/10 border border-blue-500/50 px-3 py-2 text-[11px] text-gray-50 self-end">
              <div className="text-[9px] uppercase tracking-[0.16em] text-blue-200 mb-0.5">
                You · natural language
              </div>
              <div>
                Show me serious bleeding events for Drug A in the last 12
                months.
              </div>
            </div>

            {/* Assistant summary with 3-dot menu */}
            <div className="relative mr-6 max-w-xs rounded-2xl bg-[#141824] border border-[#262A33] px-3 py-2 text-[11px] text-gray-50">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.16em] text-gray-400 mb-0.5">
                    Assistant · summary
                  </div>
                  <div>
                    I found 37 matching cases across 3 datasets. The
                    disproportionality (PRR 4.8, 95% CI 3.9–5.7) is elevated vs
                    background.
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setChatMenuOpen((v) => !v)}
                    className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-gray-800 text-gray-400 text-xs"
                  >
                    ⋮
                  </button>
                  {chatMenuOpen && (
                    <div className="absolute right-0 mt-1 w-44 rounded-md border border-[#262A33] bg-[#05060A] shadow-lg z-10">
                      <button
                        className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-800"
                        onClick={handleViewInterpretation}
                      >
                        {showInterpretation
                          ? "Hide interpreted filters"
                          : "View interpreted filters"}
                      </button>
                      <button
                        className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-800"
                        onClick={handleConfirmGenerate}
                      >
                        Confirm &amp; generate report
                      </button>
                      <button
                        className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-800"
                        onClick={handleAdjustFilters}
                      >
                        Adjust filters
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {showInterpretation && (
                <div className="mt-2 rounded-md border border-blue-500/40 bg-blue-500/5 px-2 py-1.5 text-[10px] text-blue-100">
                  <div className="font-semibold mb-0.5">Interpreted query</div>
                  <div>
                    Filtering to: <strong>Drug A</strong> ·{" "}
                    <strong>SMQ: Hemorrhage</strong> · Serious ={" "}
                    <strong>Yes</strong> · Period:{" "}
                    <strong>last 12 months</strong> · Scope:{" "}
                    <strong>Org</strong>.
                  </div>
                </div>
              )}

              {lastAction === "generated" && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-100">
                  ✓ Mock: report generated – deep analysis view would open in
                  the real app.
                </div>
              )}

              {lastAction === "adjusted" && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-blue-500/60 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-100">
                  ⧉ Mock: filter builder would open pre-filled with these
                  criteria.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 text-[11px]">
            <div className="text-[10px] uppercase tracking-[0.16em] text-gray-400 mb-1">
              This session’s analyses
            </div>
            <div className="space-y-1.5">
              {sessionAnalyses.map((a) => (
                <button
                  key={a.id}
                  className="w-full rounded-md border border-[#262A33] bg-[#11151E] px-2.5 py-1.5 text-left hover:bg-[#151A22]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-gray-100">
                      {a.title}
                    </span>
                    <span className="text-[10px] text-gray-400">{a.type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt input (anchored, not scrolling with page) */}
        <div className="px-3 py-2 border-t border-[#262A33]">
          <div className="flex items-center gap-2 bg-[#11151E] border border-[#262A33] rounded-full px-3 py-1.5">
            <input
              className="flex-1 bg-transparent text-[11px] text-gray-100 placeholder:text-gray-500 focus:outline-none"
              placeholder="Ask about cases, drugs, time windows, or safety questions…"
            />
            <button className="h-7 w-7 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs hover:bg-blue-400">
              ↗
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Placeholder pages for other nav items
// ---------------------------------------------------------------------------

function PlaceholderPage({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center text-gray-400 text-sm">
      {label} page placeholder – wire this to your real modules later.
    </div>
  );
}

function DashboardPageMock() {
  return <PlaceholderPage label="Dashboard" />;
}

function AnalysesPageMock() {
  return <PlaceholderPage label="Analyses" />;
}

function SettingsPageMock() {
  return <PlaceholderPage label="Settings" />;
}
