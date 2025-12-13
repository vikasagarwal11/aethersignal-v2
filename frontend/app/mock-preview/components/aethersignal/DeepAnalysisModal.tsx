"use client";

import React, { useMemo, useState, useEffect } from "react";
import type { PrioritySignal } from "./mockData";
import { trajectoryDataBySignal } from "./mockData";

export type DeepTab = "Trajectory" | "Cases" | "Evidence" | "Audit";
export type LaunchContext =
  | { kind: "metric"; metric: "PRR" | "Cases" | "Trend" }
  | { kind: "card" };

type Horizon = "30d" | "90d" | "6m" | "12m";
type Scenario = "noAction" | "intervention";

export function DeepAnalysisModal({
  open,
  signal,
  initialTab,
  context,
  onClose,
}: {
  open: boolean;
  signal: PrioritySignal | null;
  initialTab?: DeepTab;
  context?: LaunchContext;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<DeepTab>(initialTab ?? "Trajectory");
  const [horizon, setHorizon] = useState<Horizon>("6m");
  const [scenario, setScenario] = useState<Scenario>("noAction");

  // Keep tab in sync when a new modal open happens (common in prototyping)
  React.useEffect(() => {
    if (open) {
      setTab(initialTab ?? "Trajectory");
      // Reset to defaults when modal opens
      setHorizon("6m");
      setScenario("noAction");
    }
  }, [open, initialTab]);

  // ESC key to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const headerKicker = useMemo(() => {
    if (!context || context.kind === "card") return "Deep analysis";
    return `${context.metric} drill‑down`;
  }, [context]);

  if (!open || !signal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/65"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[min(920px,92vw)] rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel)] shadow-[var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[color:var(--border)] bg-[color:var(--panel-2)] flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-[color:var(--accent)] mb-1">{headerKicker}</div>
            <div className="text-sm font-semibold text-[var(--text)]">
              {signal.drug} · {signal.reaction}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[var(--muted)]">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel-2)] px-2 py-0.5">
                Signal ID: <span className="text-[var(--text)]">{signal.id}</span>
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel-2)] px-2 py-0.5">
                PRR: <span className="text-[var(--text)] font-semibold">{signal.prr}</span>
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel-2)] px-2 py-0.5">
                Cases: <span className="text-[var(--text)] font-semibold">{signal.cases}</span>
              </span>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-200 dark:text-emerald-200">
                Trend:{" "}
                <span className="font-semibold">
                  {signal.trend === "Increasing"
                    ? "↗ Increasing"
                    : signal.trend === "Decreasing"
                      ? "↘ Decreasing"
                      : "• Stable"}
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[color:var(--panel-2)] transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 bg-[color:var(--panel)]">
          <div className="inline-flex rounded-full bg-[color:var(--panel-2)] border border-[color:var(--border)] p-1 text-[11px] font-medium">
            {(["Trajectory", "Cases", "Evidence", "Audit"] as DeepTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  "px-3 py-1 rounded-full transition-colors",
                  tab === t
                    ? "bg-[color:var(--accent)] text-white"
                    : "text-[var(--muted)] hover:text-[var(--text)]",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 pt-4 bg-[color:var(--panel)]">
          {tab === "Trajectory" && (() => {
            const trajectoryData = trajectoryDataBySignal[signal.id] || trajectoryDataBySignal.aspirin_gi_bleeding;
            const allData = [...trajectoryData.historical, ...trajectoryData.forecast[scenario]];
            const maxCases = Math.max(...allData.map((d) => d.upper));
            const forecastData = trajectoryData.forecast[scenario];
            const finalProjected = forecastData[forecastData.length - 1]?.cases || 0;
            const finalIntervention = trajectoryData.forecast.intervention[trajectoryData.forecast.intervention.length - 1]?.cases || 0;
            const currentCases = trajectoryData.historical[trajectoryData.historical.length - 1]?.cases || 0;
            const casesAvoided = finalProjected - finalIntervention;
            const seriousRate = 0.35; // ~35% of cases are serious (mock assumption)
            const hospitalizationsAvoided = Math.round(casesAvoided * seriousRate);

            return (
              <div className="space-y-4">
                {/* Header Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--muted)]">Forecast horizon:</span>
                      <div className="inline-flex rounded-full bg-[color:var(--panel-2)] border border-[color:var(--border-strong)] p-0.5">
                        {(["30d", "90d", "6m", "12m"] as Horizon[]).map((h) => (
                          <button
                            key={h}
                            onClick={() => setHorizon(h)}
                            className={[
                              "px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors",
                              horizon === h
                                ? "bg-[color:var(--accent)] text-white"
                                : "text-[var(--muted)] hover:text-[var(--text)]",
                            ].join(" ")}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--muted)]">Scenario:</span>
                      <div className="inline-flex rounded-full bg-[color:var(--panel-2)] border border-[color:var(--border-strong)] p-0.5">
                        <button
                          onClick={() => setScenario("noAction")}
                          className={[
                            "px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors",
                            scenario === "noAction"
                              ? "bg-[color:var(--panel-3)] text-[var(--text)]"
                              : "text-[var(--muted)] hover:text-[var(--text)]",
                          ].join(" ")}
                        >
                          No action
                        </button>
                        <button
                          onClick={() => setScenario("intervention")}
                          className={[
                            "px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors",
                            scenario === "intervention"
                              ? "bg-[color:var(--accent)] text-white"
                              : "text-[var(--muted)] hover:text-[var(--text)]",
                          ].join(" ")}
                        >
                          Early intervention
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[color:var(--risk-critical)]">
                        {signal.velocity}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">Velocity: {signal.trend === "Increasing" ? "Rapidly increasing ↑" : signal.trend === "Decreasing" ? "Decreasing ↓" : "Stable •"}</div>
                    </div>
                  </div>
                </div>

                {/* Chart Container */}
                <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-2)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-[var(--text)]">
                      {signal.drug} · {signal.reaction} cases over time
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--muted)]">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                        <span>Historical</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-[color:var(--accent)] opacity-50" />
                        <span>Forecast</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-[color:var(--accent-weak)]" />
                        <span>Confidence band</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart Area */}
                  <div className="relative h-64 bg-gradient-to-b from-transparent to-[color:var(--panel-3)]/30 rounded-lg overflow-hidden">
                    {/* Confidence Band (Forecast) */}
                    {scenario === "noAction" && (
                      <div className="absolute inset-x-0 bottom-0 top-1/2 bg-[color:var(--accent-weak)]/20" />
                    )}

                    {/* Chart Bars */}
                    <div className="absolute inset-0 flex items-end justify-around gap-1 px-4 pb-8">
                      {/* Historical bars */}
                      {trajectoryData.historical.map((point, i) => {
                        const heightPercent = (point.cases / maxCases) * 100;
                        return (
                          <div key={`hist-${i}`} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full rounded-t bg-[color:var(--accent)] transition-all"
                              style={{ height: `${heightPercent}%`, minHeight: "4px" }}
                            />
                            <div className="text-[9px] text-[var(--muted)] whitespace-nowrap">
                              {point.date.split("-")[1]}
                            </div>
                          </div>
                        );
                      })}

                      {/* Divider */}
                      <div className="absolute left-1/2 top-0 bottom-8 w-px bg-[color:var(--border-strong)]" />
                      <div className="absolute left-1/2 top-2 -translate-x-1/2 text-[9px] text-[var(--muted)] bg-[color:var(--panel-2)] px-2">
                        Forecast →
                      </div>

                      {/* Forecast bars */}
                      {forecastData.map((point, i) => {
                        const heightPercent = (point.cases / maxCases) * 100;
                        return (
                          <div key={`forecast-${i}`} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full rounded-t bg-[color:var(--accent)]/60 border-2 border-dashed border-[color:var(--accent)]/80 transition-all"
                              style={{ height: `${heightPercent}%`, minHeight: "4px" }}
                            />
                            <div className="text-[9px] text-[var(--muted)] whitespace-nowrap">
                              {point.date.split("-")[1]}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Y-axis scale (mock) */}
                    <div className="absolute left-2 top-2 bottom-8 flex flex-col justify-between text-[9px] text-[var(--muted)]">
                      <span>{Math.round(maxCases)}</span>
                      <span>{Math.round(maxCases / 2)}</span>
                      <span>0</span>
                    </div>
                  </div>
                </div>

                {/* Key Insight Callout */}
                <div className="rounded-lg border border-[color:var(--risk-critical)]/30 bg-[color:var(--risk-critical-bg)] p-4">
                  <div className="font-semibold text-[color:var(--risk-critical)] text-[12px] mb-1">
                    Projected: {finalProjected} cases by Dec 2025
                    {scenario === "noAction" && (
                      <span className="ml-2 text-[var(--muted)]">
                        (+{Math.round(((finalProjected - currentCases) / currentCases) * 100)}% vs today)
                      </span>
                    )}
                  </div>
                  {scenario === "noAction" && (
                    <div className="text-[11px] text-[var(--text)] mt-1">
                      Early intervention could reduce to ~{finalIntervention} cases ({Math.round((casesAvoided / finalProjected) * 100)}% fewer) →{" "}
                      <span className="font-semibold text-[color:var(--risk-critical)]">
                        ~{hospitalizationsAvoided} serious hospitalizations avoided
                      </span>
                    </div>
                  )}
                  {scenario === "intervention" && (
                    <div className="text-[11px] text-[var(--text)] mt-1">
                      With early intervention: {finalIntervention} cases projected (vs {finalProjected} without action) →{" "}
                      <span className="font-semibold text-[color:var(--risk-critical)]">
                        ~{hospitalizationsAvoided} serious hospitalizations prevented
                      </span>
                    </div>
                  )}
                </div>

                {/* Metadata badges */}
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="rounded-full border border-[color:var(--border-strong)] bg-[color:var(--panel-2)] px-2 py-0.5 text-[var(--text)]">
                    Confidence: <span className="font-semibold">{signal.confidence}</span>
                  </span>
                  <span className="rounded-full border border-[color:var(--accent)]/40 bg-[color:var(--accent-weak)] px-2 py-0.5 text-[color:var(--accent)]">
                    Recommendation: <span className="font-semibold">{signal.recommendation}</span>
                  </span>
                </div>
              </div>
            );
          })()}

          {tab === "Cases" && (
            <div className="space-y-3">
              <div className="text-[11px] text-[var(--muted)]">
                Case listing view for this drug–event pair (placeholder). This is where "decision support" starts.
              </div>

              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-2)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Case list (mock)
                  </div>
                  <button className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel-2)] px-3 py-1 text-[11px] text-[var(--text)] hover:bg-[color:var(--panel-3)] transition-colors">
                    Open full case listing
                  </button>
                </div>
                <div className="mt-3 text-[11px] text-[var(--muted)]">
                  Filters would inherit from current org/dataset scope. Additional toggles:
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                  <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel-2)] px-2 py-0.5 text-[var(--text)]">
                    Serious only
                  </span>
                  <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel-2)] px-2 py-0.5 text-[var(--text)]">
                    Last 12 months
                  </span>
                  <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel-2)] px-2 py-0.5 text-[var(--text)]">
                    Deduped cases
                  </span>
                </div>
              </div>
            </div>
          )}

          {tab === "Evidence" && (
            <div className="space-y-3">
              <div className="text-[11px] text-[var(--muted)]">
                Provenance and traceability (inspection‑proof intelligence). Every claim should be defensible.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-2)] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Evidence sources (mock)
                  </div>
                  <ul className="mt-2 text-[11px] text-[var(--text)] list-disc list-inside space-y-1">
                    <li>FAERS: 21 matching reports</li>
                    <li>EudraVigilance: 13 matching reports</li>
                    <li>Literature: 3 supporting abstracts</li>
                    <li>Social: 0 (excluded for this query)</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-2)] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Logic summary (mock)
                  </div>
                  <div className="mt-2 text-[11px] text-[var(--text)]">
                    Composite score is derived from disproportionality, temporal pattern strength, novelty, and
                    cross‑source corroboration.
                  </div>
                  <div className="mt-2 text-[10px] text-[var(--muted-2)]">
                    In production, link to the exact query + model version + feature weights used.
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "Audit" && (
            <div className="space-y-3">
              <div className="text-[11px] text-[var(--muted)]">
                CFR Part 11‑friendly auditability: who did what, when, and what changed.
              </div>

              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-2)] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Audit trail (mock)
                </div>
                <div className="mt-3 text-[11px] text-[var(--text)] space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[var(--text)] font-medium">Analysis opened</div>
                      <div className="text-[10px] text-[var(--muted)]">User: AR · Action: view</div>
                    </div>
                    <div className="text-[10px] text-[var(--muted)] whitespace-nowrap">11-Dec-2025 09:15:02 UTC</div>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[var(--text)] font-medium">Filters applied</div>
                      <div className="text-[10px] text-[var(--muted)]">Serious only · Last 12 months · Org scope</div>
                    </div>
                    <div className="text-[10px] text-[var(--muted)] whitespace-nowrap">11-Dec-2025 09:15:11 UTC</div>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[var(--text)] font-medium">Report generated</div>
                      <div className="text-[10px] text-[var(--muted)]">Artifact: Briefing PDF (mock)</div>
                    </div>
                    <div className="text-[10px] text-[var(--muted)] whitespace-nowrap">11-Dec-2025 09:15:44 UTC</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-5 flex flex-wrap items-center justify-end gap-2 text-[11px]">
            <button
              className="rounded-full border border-[color:var(--border)] px-3 py-1.5 text-[var(--text)] hover:bg-[color:var(--panel-2)] transition-colors"
              onClick={onClose}
            >
              Close
            </button>
            <button className="rounded-full bg-[color:var(--accent)] px-3 py-1.5 font-semibold text-white hover:opacity-90 transition-opacity">
              Open full analysis (mock)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

