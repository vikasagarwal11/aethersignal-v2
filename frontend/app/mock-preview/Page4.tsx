import React, { useState } from "react";

/**
 * AetherSignal compact mock
 * - Compact sessions rail with CFR-style timestamps
 * - Signals page with 5 AI Priority cards in a single row on xl screens
 * - PRR / Cases / Trend clicks -> drill-down panel (placeholder)
 * - Full-card click -> placeholder for deep analysis navigation
 */

// ---------- Mock data ----------

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

type PageKey = "dashboard" | "signals" | "analyses" | "settings";
type MetricKind = "PRR" | "Cases" | "Trend";
type PrioritySignal = (typeof prioritySignals)[number];

interface MetricDetail {
  metric: MetricKind;
  signal: PrioritySignal;
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
    <div className="mt-2.5 rounded-xl border border-blue-500/40 bg-[#10141C]/95 px-4 py-3 text-[11px] text-gray-200">
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
            In the real application, this interaction would open a dedicated
            analysis view (PRR timeline, case listing, or trend analysis) for
            this drug–event pair. Here it is a placeholder so you can see where
            that drill-down would appear.
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

// ---------- MAIN APP SHELL ----------

export default function AetherSignalAppMock() {
  const [activePage, setActivePage] = useState<PageKey>("signals");

  return (
    <div className="min-h-screen bg-[#0F1115] text-gray-100 flex flex-col">
      {/* TOP NAVBAR */}
      <header className="h-16 border-b border-gray-800 bg-[#10141C]/95 backdrop-blur flex items-center justify-between px-4 lg:px-8">
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

      {/* PAGE CONTENT */}
      {activePage === "signals" && <SignalsPageMock />}
      {activePage === "dashboard" && <DashboardPageMock />}
      {activePage === "analyses" && <AnalysesPageMock />}
      {activePage === "settings" && <SettingsPageMock />}
    </div>
  );
}

// ---------- SIGNALS PAGE ----------

function SignalsPageMock() {
  const [metricDetail, setMetricDetail] = useState<MetricDetail | null>(null);

  const handleMetricClick = (metric: MetricKind, signal: PrioritySignal) => {
    setMetricDetail({ metric, signal });
  };

  const handleCardClick = (signal: PrioritySignal) => {
    // Real app: router.push(`/signals/analysis/${signal.id}`);
    alert(
      `Open deep analysis view for ${signal.drug} – ${signal.reaction} (id: ${signal.id})`
    );
  };

  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
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
                  "w-full rounded-lg border px-2.5 py-1.5 text-left transition",
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
                <div className="mt-0.5 text-[10px] text-gray-400">
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

      {/* CENTER: Workbench */}
      <main className="flex-1 flex flex-col border-x border-[#262A33] bg-gradient-to-b from-[#0F1115] via-[#10141C] to-[#151822] text-[13px]">
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

          {/* Drill-down placeholder */}
          <MetricDetailPanel
            detail={metricDetail}
            onClose={() => setMetricDetail(null)}
          />
        </section>

        {/* Signals table section (unchanged) */}
        <section className="px-4 lg:px-6 mt-3 mb-2 flex-1 flex flex-col min-h-0">
          {/* header + filters + table etc... */}
          {/* Keep your existing table implementation here. */}
          <div className="text-[11px] text-gray-400">
            {/* Placeholder so file compiles even if you haven’t pasted the table yet */}
            All Signals table goes here (same as your existing mock).
          </div>
        </section>
      </main>

      {/* RIGHT: Chat rail (placeholder) */}
      <aside className="w-80 border-l border-[#262A33] bg-[#0F1115] flex flex-col">
        <div className="px-3 pt-3 pb-2 border-b border-[#262A33]">
          <div className="text-[11px] font-semibold text-gray-200">
            AI Assistant
          </div>
          <div className="text-[10px] text-gray-400">
            Ask about your current view or serious cases.
          </div>
        </div>
        <div className="flex-1 px-3 py-3 text-[11px] text-gray-400">
          (Chat UI placeholder)
        </div>
      </aside>
    </div>
  );
}

// ---------- Simple placeholders for other tabs ----------

function DashboardPageMock() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Dashboard mock – focus design effort on the Signals page first.
    </div>
  );
}

function AnalysesPageMock() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Analyses mock – list of saved analyses and deep reports.
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
