import React, { useMemo, useState } from "react";
import { DeepAnalysisModal, type DeepTab } from "./DeepAnalysisModal";
import { kpiCards, prioritySignals, sessionAnalyses, sessionData, type PrioritySignal } from "./mockData";

type ChatTab = "assistant" | "analyses";
type MetricKind = "PRR" | "Cases" | "Trend";

type ChatMenuKey =
  | "view_filters"
  | "evidence_sources"
  | "audit_trail"
  | "confirm_report"
  | "adjust_filters";

export function SignalsPage() {
  const [chatTab, setChatTab] = useState<ChatTab>("assistant");
  const [chatMenuOpen, setChatMenuOpen] = useState(false);

  const [showInterpretedFilters, setShowInterpretedFilters] = useState(false);
  const [showEvidencePanel, setShowEvidencePanel] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [lastAction, setLastAction] = useState<"none" | "generated" | "adjusted">("none");

  const [priorityExpanded, setPriorityExpanded] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSignal, setModalSignal] = useState<PrioritySignal | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<DeepTab>("Trajectory");
  const [modalContext, setModalContext] = useState<{ kind: "metric"; metric: MetricKind } | { kind: "card" }>({
    kind: "card",
  });

  const openMetricModal = (metric: MetricKind, sig: PrioritySignal) => {
    setModalSignal(sig);
    setModalContext({ kind: "metric", metric });
    setModalInitialTab(metric === "PRR" || metric === "Trend" ? "Trajectory" : "Cases");
    setModalOpen(true);
  };

  const openCardModal = (sig: PrioritySignal) => {
    setModalSignal(sig);
    setModalContext({ kind: "card" });
    setModalInitialTab("Trajectory");
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const onChatMenuAction = (key: ChatMenuKey) => {
    setChatMenuOpen(false);

    if (key === "view_filters") {
      setShowInterpretedFilters((v) => !v);
      return;
    }

    if (key === "evidence_sources") {
      setShowEvidencePanel((v) => !v);
      setShowAuditPanel(false);
      return;
    }

    if (key === "audit_trail") {
      setShowAuditPanel((v) => !v);
      setShowEvidencePanel(false);
      return;
    }

    if (key === "confirm_report") {
      setLastAction("generated");
      return;
    }

    if (key === "adjust_filters") {
      setLastAction("adjusted");
      return;
    }
  };

  const severitySummary = useMemo(() => "5 critical · 12 high", []);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* LEFT RAIL: Sessions (scrolls independently) */}
      <aside className="w-68 border-r border-[#262A33] bg-[#10141C]/95 backdrop-blur flex flex-col text-[11px]">
        <div className="px-3 pt-2 pb-1.5 border-b border-gray-800 flex items-center justify-between">
          <div className="font-semibold uppercase tracking-[0.12em] text-gray-400">Context</div>
          <button className="text-[10px] text-gray-400 hover:text-gray-200">Refresh</button>
        </div>

        <div className="px-3 pt-2">
          <div className="inline-flex rounded-full bg-gray-900 p-1 font-medium text-gray-300">
            <button className="px-2 py-0.5 rounded-full bg-gray-800 text-[11px]">Sessions</button>
            <button className="px-2 py-0.5 rounded-full text-[11px] text-gray-400 hover:text-gray-100">
              Saved
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
          <div className="mt-2.5 mb-1.5 text-[10px] font-semibold text-gray-400">Recent sessions</div>
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
                  <span className="font-medium text-gray-100 truncate">{s.label}</span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{s.timestamp}</span>
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
            <div className="font-semibold text-gray-200 text-[11px]">Current view</div>
            <div>All sessions · Org scope</div>
          </div>
          <div className="text-right">
            <div>Cases: 12.4k</div>
            <div>Signals: 932</div>
          </div>
        </div>
      </aside>

      {/* CENTER WORKBENCH (scrolls independently) */}
      <main className="flex-1 overflow-y-auto custom-scrollbar border-x border-[#262A33] bg-gradient-to-b from-[#0F1115] via-[#10141C] to-[#151822] text-[13px]">
        {/* Top strip */}
        <section className="px-4 lg:px-6 pt-2 pb-1.5 border-b border-[#222632] flex items-center justify-between gap-3 sticky top-0 z-10 bg-[#10141C]/80 backdrop-blur">
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
              <input type="checkbox" className="h-3 w-3 rounded border-gray-600 bg-gray-900" />
              Serious only
            </label>
            <button className="text-gray-400 hover:text-gray-100 underline decoration-dotted underline-offset-4">
              Clear filters
            </button>
          </div>
        </section>

        {/* KPI row */}
        <section className="px-4 lg:px-6 pt-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 mb-1.5">
            Today’s Safety Snapshot
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
            {kpiCards.map((kpi) => (
              <div
                key={kpi.label}
                className="relative overflow-hidden rounded-xl border border-[#262A33] bg-gradient-to-br from-[#151A22] via-[#151A22] to-[#1D222C] px-3 py-2 shadow-sm"
              >
                <div className="text-[10px] font-medium text-gray-400 mb-0.5">{kpi.label}</div>
                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-semibold tracking-tight text-gray-50">{kpi.value}</div>
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

        {/* AI Priority Signals (collapsible) */}
        <section className="px-4 lg:px-6 mt-3">
          <div className="rounded-2xl border border-red-500/35 bg-gradient-to-r from-red-500/12 via-[#141821] to-[#141821] px-3.5 py-2">
            <div className="flex flex-wrap items-start justify-between gap-2.5">
              <div className="flex items-start gap-2">
                <button
                  onClick={() => setPriorityExpanded((v) => !v)}
                  className="mt-0.5 rounded-full border border-red-500/50 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-200 hover:bg-red-500/20"
                  aria-label={priorityExpanded ? "Collapse AI Priority Signals" : "Expand AI Priority Signals"}
                >
                  {priorityExpanded ? "▾" : "▸"}
                </button>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-red-200 border border-red-500/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-300 animate-pulse" />
                    AI Priority Signals
                  </div>
                  <p className="mt-1 text-[10px] text-gray-200 max-w-xl">
                    Highest-risk drug–event combinations ranked by AI confidence, disproportionality, and temporal
                    patterns. Review these first.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="rounded-full bg-gray-900/80 border border-gray-700 px-2 py-0.5 text-gray-200">
                  {severitySummary}
                </span>
                <button className="rounded-full border border-red-500/60 px-2.5 py-0.5 text-[10px] font-medium text-red-100 hover:bg-red-500/20">
                  View all critical
                </button>
              </div>
            </div>

            {priorityExpanded && (
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                {prioritySignals.map((sig) => (
                  <button
                    key={sig.id}
                    type="button"
                    onClick={() => openCardModal(sig)}
                    className="text-left rounded-xl border border-red-500/35 bg-[#11151E]/95 px-3 py-2 text-[10px] flex flex-col gap-1.5 hover:border-red-400/70 hover:bg-[#151A22] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-100 truncate text-[11px]">{sig.drug}</div>
                        <div className="text-[10px] text-gray-400 truncate">{sig.reaction}</div>
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

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-300">
                      <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-gray-200">
                        Velocity: <span className="font-semibold text-gray-100">{sig.velocity}</span>
                      </span>
                      <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-blue-200">
                        {sig.recommendation}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-300">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMetricModal("PRR", sig);
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
                          openMetricModal("Cases", sig);
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
                          openMetricModal("Trend", sig);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-200 border border-emerald-500/40"
                      >
                        <span className="text-[9px] uppercase text-emerald-200/80">Trend</span>
                        <span className="font-semibold">
                          {sig.trend === "Increasing"
                            ? "↗"
                            : sig.trend === "Decreasing"
                              ? "↘"
                              : "•"}
                        </span>
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Signals table placeholder */}
        <section className="px-4 lg:px-6 mt-4 pb-6">
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
                <span className="pointer-events-none absolute left-2 top-1.5 text-[11px] text-gray-500">🔍</span>
              </div>
              <button className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 text-[11px] text-gray-100 hover:bg-gray-800">
                Filters
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#262A33] bg-[#151A22]/90 px-3 py-2 text-[11px] text-gray-400">
            Signals data table placeholder (use your existing data-table component in the real implementation).
            <div className="mt-2 text-[10px] text-gray-500">
              Scroll behavior: mouse wheel over this center workbench scrolls the center column only (left/right rails
              remain in place).
            </div>
          </div>
        </section>
      </main>

      {/* RIGHT RAIL: AI Assistant (fixed rail; internal scroll) */}
      <aside className="w-80 border-l border-[#262A33] bg-[#0F1115] flex flex-col overflow-hidden">
        {/* Header + tabs */}
        <div className="px-3 pt-3 pb-2 border-b border-[#262A33] shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold text-gray-200">AI Assistant</div>
              <div className="text-[10px] text-gray-400">Ask about your current view or serious cases.</div>
            </div>
            <label className="flex items-center gap-1 text-[10px] text-gray-400 cursor-pointer">
              <input type="checkbox" className="h-3 w-3 rounded border-gray-600 bg-gray-900" />
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 text-[11px]">
          {chatTab === "assistant" ? (
            <div className="space-y-2">
              <div className="rounded-lg border border-gray-700 bg-[#10141C] px-3 py-2">
                <div className="text-[10px] text-gray-400 mb-1">You · natural language</div>
                <div className="text-[11px] text-gray-100">
                  Show me serious bleeding events for Drug A in the last 12 months.
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-[#10141C] px-3 py-2 relative">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-gray-400 mb-1">Assistant · summary</div>
                    <div className="text-[11px] text-gray-100">
                      I found 37 matching cases across 3 datasets. The disproportionality (PRR 4.8, 95% CI 3.9–5.7) is
                      elevated vs background.
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      className="h-6 w-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                      onClick={() => setChatMenuOpen((open) => !open)}
                      aria-label="Open message actions"
                    >
                      ⋮
                    </button>

                    {chatMenuOpen && (
                      <div className="absolute right-0 mt-1 w-52 rounded-lg border border-gray-700 bg-[#05060A] shadow-lg z-10 text-[11px] text-gray-100">
                        <button className="w-full px-3 py-1.5 text-left hover:bg-gray-800" onClick={() => onChatMenuAction("view_filters")}>
                          View interpreted filters
                        </button>
                        <button className="w-full px-3 py-1.5 text-left hover:bg-gray-800" onClick={() => onChatMenuAction("evidence_sources")}>
                          Evidence &amp; sources
                        </button>
                        <button className="w-full px-3 py-1.5 text-left hover:bg-gray-800" onClick={() => onChatMenuAction("audit_trail")}>
                          Audit trail
                        </button>
                        <div className="border-t border-gray-800 my-1" />
                        <button className="w-full px-3 py-1.5 text-left hover:bg-gray-800" onClick={() => onChatMenuAction("confirm_report")}>
                          Confirm &amp; generate report
                        </button>
                        <button className="w-full px-3 py-1.5 text-left hover:bg-gray-800" onClick={() => onChatMenuAction("adjust_filters")}>
                          Adjust filters
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {showInterpretedFilters && (
                  <div className="mt-2 rounded-md border border-blue-500/40 bg-[#0B1020]/80 px-2.5 py-1.5 text-[10px] text-blue-100">
                    <div className="font-semibold mb-0.5">Interpreted query</div>
                    <div>Filtering to: Drug A · SMQ: Hemorrhage · Serious = Yes · Period: last 12 months · Org scope.</div>
                  </div>
                )}

                {showEvidencePanel && (
                  <div className="mt-2 rounded-md border border-gray-700 bg-[#0B0F19] px-2.5 py-2 text-[10px] text-gray-200">
                    <div className="font-semibold text-[10px] text-gray-100 mb-1">Evidence &amp; sources (mock)</div>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-300">
                      <li>FAERS: 21 reports</li>
                      <li>EudraVigilance: 13 reports</li>
                      <li>Literature: 3 supporting abstracts</li>
                    </ul>
                  </div>
                )}

                {showAuditPanel && (
                  <div className="mt-2 rounded-md border border-gray-700 bg-[#0B0F19] px-2.5 py-2 text-[10px] text-gray-200">
                    <div className="font-semibold text-[10px] text-gray-100 mb-1">Audit trail (mock)</div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-gray-300">Query interpreted</div>
                      <div className="text-gray-500 whitespace-nowrap">11-Dec-2025 09:14:02 UTC</div>
                    </div>
                    <div className="flex items-start justify-between gap-2 mt-1">
                      <div className="text-gray-300">Summary generated</div>
                      <div className="text-gray-500 whitespace-nowrap">11-Dec-2025 09:14:08 UTC</div>
                    </div>
                  </div>
                )}

                {lastAction === "generated" && (
                  <div className="mt-2 rounded-full bg-emerald-500/10 border border-emerald-500/60 px-2.5 py-1 text-[10px] text-emerald-200">
                    Mock: briefing generated (artifact created with timestamp + scope).
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
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-semibold text-gray-200">This session’s analyses</div>
                <button className="text-[10px] text-blue-400 hover:underline">View all</button>
              </div>
              <div className="space-y-1.5">
                {sessionAnalyses.map((a) => (
                  <button
                    key={a.id}
                    className="w-full rounded-lg border border-[#262A33] bg-[#10141C] px-2.5 py-1.5 text-left hover:bg-[#151A22]"
                  >
                    <div className="text-[11px] text-gray-100 truncate">{a.title}</div>
                    <div className="text-[10px] text-gray-400">
                      {a.type} · {a.ts}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat input (fixed at bottom of rail) */}
        <div className="border-t border-[#262A33] px-3 py-2 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              rows={3}
              className="flex-1 resize-none rounded-xl border border-gray-700 bg-gray-950/90 px-3 py-2 text-[13px] text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ask about cases, drugs, reactions, time windows, or safety questions..."
            />
            <button className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm hover:bg-blue-400">
              ➤
            </button>
          </div>
        </div>
      </aside>

      {/* Deep analysis modal */}
      <DeepAnalysisModal
        open={modalOpen}
        signal={modalSignal}
        initialTab={modalInitialTab}
        context={modalContext}
        onClose={closeModal}
      />
    </div>
  );
}
