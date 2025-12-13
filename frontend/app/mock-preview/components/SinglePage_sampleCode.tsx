"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { DeepAnalysisModal, type DeepTab } from "./DeepAnalysisModal";
import {
  kpiCards,
  prioritySignals,
  sessionAnalyses,
  sessionData,
  chatMessages,
  signalTableRows,
  type PrioritySignal,
  type ChatMessage,
} from "./mockData";

type ChatTab = "assistant" | "analyses";
type MetricKind = "PRR" | "Cases" | "Trend";

type ChatMenuKey =
  | "view_filters"
  | "evidence_sources"
  | "audit_trail"
  | "confirm_report"
  | "adjust_filters";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function severityStyles(priority: "Critical" | "High" | "Medium") {
  // Structural severity encoding: subtle row tint + left accent bar.
  // NOTE: uses tokens + risk-bg vars (works in light/dark).
  if (priority === "Critical") {
    return {
      row: "bg-[color:var(--risk-critical-bg)]/55 hover:bg-[color:var(--risk-critical-bg)]/75",
      bar: "bg-[color:var(--risk-critical)]",
      pill:
        "bg-[color:var(--risk-critical-bg)] border border-[color:var(--risk-critical)]/35 text-[color:var(--risk-critical)]",
    };
  }
  if (priority === "High") {
    return {
      row: "bg-[color:var(--risk-high-bg)]/45 hover:bg-[color:var(--risk-high-bg)]/65",
      bar: "bg-[color:var(--risk-high)]",
      pill:
        "bg-[color:var(--risk-high-bg)] border border-[color:var(--risk-high)]/30 text-[color:var(--risk-high)]",
    };
  }
  return {
    row: "bg-[color:var(--risk-medium-bg)]/35 hover:bg-[color:var(--risk-medium-bg)]/55",
    bar: "bg-[color:var(--risk-medium)]",
    pill:
      "bg-[color:var(--risk-medium-bg)] border border-[color:var(--risk-medium)]/25 text-[color:var(--risk-medium)]",
  };
}

function recommendationPill(rec: string) {
  const r = rec.toLowerCase();
  if (r.includes("escal")) {
    return "bg-[color:var(--risk-critical-bg)] border border-[color:var(--risk-critical)]/30 text-[color:var(--risk-critical)]";
  }
  if (r.includes("monitor")) {
    return "bg-[color:var(--risk-high-bg)] border border-[color:var(--risk-high)]/25 text-[color:var(--risk-high)]";
  }
  return "bg-[color:var(--accent-weak)] border border-[color:var(--border-strong)] text-[color:var(--text)]";
}

export function SignalsPage() {
  const [chatTab, setChatTab] = useState<ChatTab>("assistant");
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const chatMenuRef = useRef<HTMLDivElement | null>(null);

  const [showInterpretedFilters, setShowInterpretedFilters] = useState(false);
  const [showEvidencePanel, setShowEvidencePanel] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [lastAction, setLastAction] = useState<"none" | "generated" | "adjusted">("none");

  const [priorityExpanded, setPriorityExpanded] = useState(true);

  // Chat functionality
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => chatMessages);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

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

  // Chat send function
  const sendMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      type: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    const assistantMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      type: "assistant",
      text: "Mock: I interpreted your query into a cohort spec and ranked the highest-risk cohorts in the current scope.",
      hasMenu: false,
    };

    window.setTimeout(() => {
      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    }, 250);
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!chatMenuOpen) return;

    const onDown = (e: MouseEvent) => {
      if (!chatMenuRef.current) return;
      if (e.target instanceof Node && !chatMenuRef.current.contains(e.target)) {
        setChatMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [chatMenuOpen]);

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
    <div className="flex flex-1 h-[calc(100vh-4rem)] min-h-0 overflow-hidden" suppressHydrationWarning>
      {/* LEFT RAIL */}
      <aside className="w-68 border-r border-[color:var(--border)] bg-[color:var(--panel)] backdrop-blur flex flex-col min-h-0 overflow-hidden text-[11px]">
        <div className="px-3 pt-2 pb-1.5 border-b border-[color:var(--border)] flex items-center justify-between">
          <div className="font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Context</div>
          <button className="text-[10px] text-[var(--muted)] hover:text-[var(--text)]">Refresh</button>
        </div>

        <div className="px-3 pt-2">
          <div className="inline-flex rounded-full bg-[color:var(--panel-2)] p-1 font-medium text-[var(--muted)]">
            <button className="px-2 py-0.5 rounded-full bg-[color:var(--panel-3)] text-[11px]">Sessions</button>
            <button className="px-2 py-0.5 rounded-full text-[11px] text-[var(--muted)] hover:text-[var(--text)]">
              Saved
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
          <div className="mt-2.5 mb-1.5 text-[10px] font-semibold text-[var(--muted)]">Recent sessions</div>
          <div className="space-y-1.5">
            {sessionData.map((s, idx) => (
              <button
                key={s.id}
                className={cx(
                  "w-full rounded-lg border px-2.5 py-1.5 text-left transition flex flex-col gap-0.5",
                  idx === 0
                    ? "border-[color:var(--accent)]/35 bg-[color:var(--accent-weak)] shadow-sm"
                    : "border-[color:var(--border)] bg-[color:var(--panel-2)] hover:bg-[color:var(--panel-3)]/60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[var(--text)] truncate">{s.label}</span>
                  <span className="text-[10px] text-[var(--muted)] whitespace-nowrap">{s.timestamp}</span>
                </div>
                <div className="text-[10px] text-[var(--muted)]">
                  {s.files} files · {s.cases} cases
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[color:var(--border)] px-3 py-1.5 text-[10px] text-[var(--muted)] flex items-center justify-between">
          <div>
            <div className="font-semibold text-[var(--text)] text-[11px]">Current view</div>
            <div>All sessions · Org scope</div>
          </div>
          <div className="text-right">
            <div>Cases: 12.4k</div>
            <div>Signals: 932</div>
          </div>
        </div>
      </aside>

      {/* CENTER WORKBENCH */}
      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar border-x border-[color:var(--border)] bg-[color:var(--bg)] text-[13px]">
        {/* Top strip */}
        <section className="px-4 lg:px-6 pt-2 pb-1.5 border-b border-[color:var(--border)] flex items-center justify-between gap-3 sticky top-0 z-10 bg-[color:var(--panel)] backdrop-blur">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--panel-2)] px-2 py-1 text-[var(--text)]">
              Org: <span className="font-medium">Global Safety</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--panel-2)] px-2 py-1 text-[var(--text)]">
              Dataset: <span className="font-medium">FAERS + EudraVigilance</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--panel-2)] px-2 py-1 text-[var(--text)]">
              Scope: <span className="font-medium">Organization</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <label className="inline-flex items-center gap-1 cursor-pointer text-[var(--muted)]">
              <input type="checkbox" className="h-3 w-3 rounded border-[color:var(--border-strong)] bg-[color:var(--panel-2)]" />
              Serious only
            </label>
            <button className="text-[var(--muted)] hover:text-[var(--text)] underline decoration-dotted underline-offset-4">
              Clear filters
            </button>
          </div>
        </section>

        {/* KPI row */}
        <section className="px-4 lg:px-6 pt-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)] mb-1.5">
            Today's Safety Snapshot
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
            {kpiCards.map((kpi) => (
              <div
                key={kpi.label}
                className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 shadow-[var(--shadow)]"
              >
                <div className="text-[10px] font-medium text-[var(--muted)] mb-0.5">{kpi.label}</div>
                <div className="flex items-baseline justify-between">
                  <div className="text-[18px] font-semibold tracking-tight text-[var(--text)]">{kpi.value}</div>
                  <div className="text-[10px] rounded-full px-2 py-0.5 border border-[color:var(--border-strong)] bg-[color:var(--accent-weak)] text-[color:var(--text)]">
                    {kpi.delta}
                  </div>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[color:var(--panel-3)] overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-[color:var(--accent)] via-purple-500 to-fuchsia-500" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Priority Signals */}
        <section className="px-4 lg:px-6 mt-3">
          <div className="rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel)] shadow-[var(--shadow)] px-3.5 py-2">
            <div className="flex flex-wrap items-start justify-between gap-2.5">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--risk-critical-bg)] px-2.5 py-0.5 text-[10px] font-semibold text-[color:var(--risk-critical)] border border-[color:var(--risk-critical)]/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--risk-critical)] animate-pulse" />
                  AI Priority Signals
                </div>
                <p className="mt-1 text-[10px] text-[var(--muted)] max-w-xl">
                  Highest-risk drug–event combinations ranked by AI confidence, disproportionality, and temporal patterns.
                  Review these first.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="rounded-full bg-[color:var(--panel-2)] border border-[color:var(--border-strong)] px-2 py-0.5 text-[var(--text)]">
                  {severitySummary}
                </span>
                <button className="rounded-full border border-[color:var(--risk-critical)]/35 px-2.5 py-0.5 text-[10px] font-medium text-[color:var(--risk-critical)] hover:bg-[color:var(--risk-critical-bg)]">
                  View all critical
                </button>
                <button
                  onClick={() => setPriorityExpanded((v) => !v)}
                  className="rounded-full border border-[color:var(--risk-critical)]/30 bg-[color:var(--risk-critical-bg)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--risk-critical)] hover:opacity-90"
                  aria-label={priorityExpanded ? "Collapse AI Priority Signals" : "Expand AI Priority Signals"}
                >
                  {priorityExpanded ? "▾" : "▸"}
                </button>
              </div>
            </div>

            {priorityExpanded && (
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                {prioritySignals.map((sig) => (
                  <div
                    key={sig.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openCardModal(sig)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openCardModal(sig);
                      }
                    }}
                    className={cx(
                      "text-left rounded-2xl border bg-[color:var(--panel)] px-3 py-2 text-[10px] flex flex-col gap-1.5 transition-all cursor-pointer",
                      "border-[color:var(--border)] hover:border-[color:var(--border-strong)] hover:shadow-[var(--shadow)]",
                    )}
                  >
                    {/* header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--text)] truncate text-[11px]">{sig.drug}</div>
                        <div className="text-[10px] text-[var(--muted)] truncate">{sig.reaction}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="rounded-full bg-[color:var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                          {Math.round(parseFloat(sig.score) * 100)}% AI
                        </span>
                        <span className="rounded-full border border-[color:var(--border-strong)] bg-[color:var(--panel-2)] px-1.5 py-0.5 text-[9px] uppercase text-[var(--muted)]">
                          Rank #{sig.rank}
                        </span>
                      </div>
                    </div>

                    {/* meta */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--muted)]">
                      <span className="rounded-full border border-[color:var(--border-strong)] bg-[color:var(--panel-2)] px-2 py-0.5 text-[var(--text)]">
                        Velocity: <span className="font-semibold text-[var(--text)]">{sig.velocity}</span>
                      </span>
                      <span className={cx("rounded-full px-2 py-0.5", recommendationPill(sig.recommendation))}>
                        {sig.recommendation}
                      </span>
                    </div>

                    {/* metric actions */}
                    <div className="flex items-center justify-between text-[10px] text-[var(--muted)]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMetricModal("PRR", sig);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-[color:var(--panel-2)] px-1.5 py-0.5 text-[10px] text-[var(--text)] border border-[color:var(--border-strong)] hover:bg-[color:var(--panel-3)]"
                      >
                        <span className="text-[9px] uppercase text-[var(--muted)]">PRR</span>
                        <span className="font-semibold">{sig.prr}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMetricModal("Cases", sig);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-[color:var(--panel-2)] px-1.5 py-0.5 text-[10px] text-[var(--text)] border border-[color:var(--border-strong)] hover:bg-[color:var(--panel-3)]"
                      >
                        <span className="text-[9px] uppercase text-[var(--muted)]">Cases</span>
                        <span className="font-semibold">{sig.cases}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMetricModal("Trend", sig);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-[color:var(--panel-2)] px-1.5 py-0.5 text-[10px] text-[var(--text)] border border-[color:var(--border-strong)] hover:bg-[color:var(--panel-3)]"
                      >
                        <span className="text-[9px] uppercase text-[var(--muted)]">Trend</span>
                        <span className="font-semibold">
                          {sig.trend === "Increasing" ? "↗" : sig.trend === "Decreasing" ? "↘" : "•"}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Signals table */}
        <section className="px-4 lg:px-6 mt-4 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--text)]">All Signals</h2>
              <span className="text-[11px] text-[var(--muted)]">932 results</span>
              <div className="hidden md:flex items-center gap-1 ml-3 text-[11px]">
                <button className="rounded-full px-2 py-1 text-[11px] border border-[color:var(--risk-critical)]/30 bg-[color:var(--risk-critical-bg)] text-[color:var(--risk-critical)]">
                  Critical
                </button>
                <button className="rounded-full px-2 py-1 text-[11px] border border-[color:var(--risk-high)]/25 bg-[color:var(--risk-high-bg)] text-[color:var(--risk-high)]">
                  High
                </button>
                <button className="rounded-full px-2 py-1 text-[11px] border border-[color:var(--risk-medium)]/20 bg-[color:var(--risk-medium-bg)] text-[color:var(--risk-medium)]">
                  Medium
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  className="h-8 w-52 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--panel)] pl-7 pr-2 text-[11px] text-[var(--text)] placeholder:text-[var(--muted-2)] shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="Search drug or reaction..."
                />
                <span className="pointer-events-none absolute left-2 top-1.5 text-[11px] text-[var(--muted-2)]">🔍</span>
              </div>
              <button className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--panel)] px-3 py-1.5 text-[11px] text-[var(--text)] hover:bg-[color:var(--panel-2)]">
                Filters
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] shadow-[var(--shadow)] flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
              <table className="min-w-full text-[11px]">
                <thead className="bg-[color:var(--panel-2)] text-[var(--muted)] sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Drug</th>
                    <th className="px-3 py-2 text-left font-medium">Reaction</th>
                    <th className="px-3 py-2 text-right font-medium">PRR</th>
                    <th className="px-3 py-2 text-right font-medium">Cases</th>
                    <th className="px-3 py-2 text-center font-medium">Serious</th>
                    <th className="px-3 py-2 text-center font-medium">Priority</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>

                {/* FIX: remove divide-gray-900 (dark-only) */}
                <tbody className="divide-y divide-[color:var(--border)]">
                  {signalTableRows.map((row) => {
                    const ss = severityStyles(row.priority);
                    return (
                      <tr key={row.id} className={cx("relative", ss.row)}>
                        {/* Left accent bar */}
                        <td className="px-0 py-0">
                          <div className="flex">
                            <div className={cx("w-1.5 shrink-0 rounded-r-md", ss.bar)} aria-hidden="true" />
                            <div className="px-3 py-2 text-[var(--text)] font-medium">{row.drug}</div>
                          </div>
                        </td>

                        <td className="px-3 py-2 text-[var(--muted)]">{row.reaction}</td>
                        <td className="px-3 py-2 text-right text-[var(--text)] font-medium">{row.prr}</td>
                        <td className="px-3 py-2 text-right text-[var(--text)]">{row.cases}</td>

                        <td className="px-3 py-2 text-center">
                          {row.serious === "Yes" ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border border-[color:var(--risk-critical)]/25 bg-[color:var(--risk-critical-bg)] text-[color:var(--risk-critical)]">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border border-[color:var(--border-strong)] bg-[color:var(--panel-2)] text-[var(--text)]">
                              No
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2 text-center">
                          <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", ss.pill)}>
                            {row.priority}
                          </span>
                        </td>

                        <td className="px-3 py-2 text-right">
                          <button className="rounded-full border border-[color:var(--border-strong)] bg-[color:var(--panel)] px-2.5 py-0.5 text-[10px] text-[var(--text)] hover:bg-[color:var(--panel-2)]" suppressHydrationWarning>
                            View details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* RIGHT RAIL: AI Assistant */}
      <aside className="w-80 border-l border-[color:var(--border)] bg-[color:var(--bg)] flex flex-col min-h-0 overflow-hidden">
        <div className="px-3 pt-3 pb-2 border-b border-[color:var(--border)]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold text-[var(--text)]">AI Assistant</div>
              <div className="text-[10px] text-[var(--muted)]">Ask about your current view or serious cases.</div>
            </div>
            <label className="flex items-center gap-1 text-[10px] text-[var(--muted)] cursor-pointer">
              <input type="checkbox" className="h-3 w-3 rounded border-[color:var(--border-strong)] bg-[color:var(--panel-2)]" />
              Refinement
            </label>
          </div>

          <div className="mt-2 inline-flex rounded-full bg-[color:var(--panel-2)] p-1 text-[11px] font-medium text-[var(--muted)]">
            <button
              className={cx("px-2 py-0.5 rounded-full", chatTab === "assistant" ? "bg-[color:var(--panel-3)] text-[var(--text)]" : "text-[var(--muted)]")}
              onClick={() => setChatTab("assistant")}
            >
              AI Assistant
            </button>
            <button
              className={cx("px-2 py-0.5 rounded-full", chatTab === "analyses" ? "bg-[color:var(--panel-3)] text-[var(--text)]" : "text-[var(--muted)]")}
              onClick={() => setChatTab("analyses")}
            >
              Analyses
            </button>
          </div>
        </div>

        <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 py-2 text-[11px]">
          {chatTab === "assistant" ? (
            <div className="space-y-2">
              {messages.map((msg) =>
                msg.type === "user" ? (
                  <div
                    key={msg.id}
                    className="ml-6 max-w-xs rounded-2xl bg-[color:var(--accent-weak)] border border-[color:var(--border-strong)] px-3 py-2 text-[11px] text-[var(--text)] shadow-sm"
                  >
                    <div className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)] mb-0.5">You · natural language</div>
                    <div>{msg.text}</div>
                  </div>
                ) : (
                  <div
                    key={msg.id}
                    className="relative mr-6 max-w-xs rounded-2xl bg-[color:var(--panel)] border border-[color:var(--border)] px-3 py-2 text-[11px] text-[var(--text)] shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)] mb-0.5">Assistant · summary</div>
                        <div className="text-[var(--text)]">{msg.text}</div>
                      </div>

                      {msg.hasMenu && (
                        <div className="relative" ref={chatMenuRef}>
                          <button
                            className="h-6 w-6 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[color:var(--panel-2)]"
                            onClick={() => setChatMenuOpen((open) => !open)}
                            aria-label="Open message actions"
                          >
                            ⋮
                          </button>
                          {chatMenuOpen && (
                            <div className="absolute right-0 mt-1 w-52 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--panel)] shadow-[var(--shadow)] z-10 text-[11px] text-[var(--text)]">
                              <button className="w-full px-3 py-1.5 text-left hover:bg-[color:var(--panel-2)]" onClick={() => onChatMenuAction("view_filters")}>
                                View interpreted filters
                              </button>
                              <button className="w-full px-3 py-1.5 text-left hover:bg-[color:var(--panel-2)]" onClick={() => onChatMenuAction("evidence_sources")}>
                                Evidence &amp; sources
                              </button>
                              <button className="w-full px-3 py-1.5 text-left hover:bg-[color:var(--panel-2)]" onClick={() => onChatMenuAction("audit_trail")}>
                                Audit trail
                              </button>
                              <div className="border-t border-[color:var(--border)] my-1" />
                              <button className="w-full px-3 py-1.5 text-left hover:bg-[color:var(--panel-2)]" onClick={() => onChatMenuAction("confirm_report")}>
                                Confirm &amp; generate report
                              </button>
                              <button className="w-full px-3 py-1.5 text-left hover:bg-[color:var(--panel-2)]" onClick={() => onChatMenuAction("adjust_filters")}>
                                Adjust filters
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {msg.id === "msg-2" && showInterpretedFilters && (
                      <div className="mt-2 rounded-md border border-[color:var(--border-strong)] bg-[color:var(--panel-2)] px-2.5 py-1.5 text-[10px] text-[var(--text)]">
                        <div className="font-semibold mb-0.5">Interpreted query</div>
                        <div className="text-[var(--muted)]">
                          Filtering to: Drug A · SMQ: Hemorrhage · Serious = Yes · Period: last 12 months · Org scope.
                        </div>
                      </div>
                    )}

                    {msg.id === "msg-2" && showEvidencePanel && (
                      <div className="mt-2 rounded-md border border-[color:var(--border-strong)] bg-[color:var(--panel-2)] px-2.5 py-2 text-[10px] text-[var(--text)]">
                        <div className="font-semibold text-[10px] text-[var(--text)] mb-1">Evidence &amp; sources (mock)</div>
                        <ul className="list-disc list-inside space-y-0.5 text-[var(--muted)]">
                          <li>FAERS: 21 reports</li>
                          <li>EudraVigilance: 13 reports</li>
                          <li>Literature: 3 supporting abstracts</li>
                        </ul>
                      </div>
                    )}

                    {msg.id === "msg-2" && showAuditPanel && (
                      <div className="mt-2 rounded-md border border-[color:var(--border-strong)] bg-[color:var(--panel-2)] px-2.5 py-2 text-[10px] text-[var(--text)]">
                        <div className="font-semibold text-[10px] text-[var(--text)] mb-1">Audit trail (mock)</div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[var(--muted)]">Query interpreted</div>
                          <div className="text-[var(--muted-2)] whitespace-nowrap">11-Dec-2025 09:14:02 UTC</div>
                        </div>
                        <div className="flex items-start justify-between gap-2 mt-1">
                          <div className="text-[var(--muted)]">Summary generated</div>
                          <div className="text-[var(--muted-2)] whitespace-nowrap">11-Dec-2025 09:14:08 UTC</div>
                        </div>
                      </div>
                    )}

                    {msg.id === "msg-2" && lastAction === "generated" && (
                      <div className="mt-2 rounded-full bg-[color:var(--panel-2)] border border-[color:var(--border-strong)] px-2.5 py-1 text-[10px] text-[var(--text)]">
                        Mock: briefing generated (artifact created with timestamp + scope).
                      </div>
                    )}

                    {msg.id === "msg-2" && lastAction === "adjusted" && (
                      <div className="mt-2 rounded-full bg-[color:var(--panel-2)] border border-[color:var(--border-strong)] px-2.5 py-1 text-[10px] text-[var(--text)]">
                        Mock: filter builder would open so you can refine these criteria.
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-semibold text-[var(--text)]">This session's analyses</div>
                <button className="text-[10px] text-[color:var(--accent)] hover:underline">View all</button>
              </div>
              <div className="space-y-1.5">
                {sessionAnalyses.map((a) => (
                  <button
                    key={a.id}
                    className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-2.5 py-1.5 text-left hover:bg-[color:var(--panel-2)]"
                  >
                    <div className="text-[11px] text-[var(--text)] truncate">{a.title}</div>
                    <div className="text-[10px] text-[var(--muted)]">
                      {a.type} · {a.ts}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat input */}
        <div className="border-t border-[color:var(--border)] px-3 py-2 shrink-0 bg-[color:var(--panel)]">
          <div className="flex items-end gap-2">
            <textarea
              rows={3}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1 resize-none rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--panel)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--muted-2)] shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              placeholder="Ask about cases, drugs, reactions, time windows, or safety questions..."
            />
            <button
              onClick={sendMessage}
              className="h-10 w-10 rounded-full bg-[color:var(--accent)] flex items-center justify-center text-white text-sm hover:opacity-90"
              aria-label="Send"
              suppressHydrationWarning
            >
              ➤
            </button>
          </div>
        </div>
      </aside>

      <DeepAnalysisModal open={modalOpen} signal={modalSignal} initialTab={modalInitialTab} context={modalContext} onClose={closeModal} />
    </div>
  );
}
