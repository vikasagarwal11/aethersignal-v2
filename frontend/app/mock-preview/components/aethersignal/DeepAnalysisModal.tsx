"use client";

/**
 * DEEP ANALYSIS MODAL — INSPECTION-READY EVIDENCE PACK
 * ----------------------------------------------------
 * Investigative, inspection-ready view of a single safety signal.
 *
 * Purpose:
 *  - Provides comprehensive drill-down analysis for priority signals
 *  - Supports decision-making through predictive trajectories and evidence review
 *  - Ensures regulatory compliance through comprehensive audit trails
 *  - Makes all AI reasoning explicit, traceable, and defensible
 *
 * This modal is NOT:
 *  - A case editing interface
 *  - A regulatory submission tool
 *  - An automated action execution system
 *
 * This modal IS:
 *  - An inspection-ready evidence pack
 *  - A decision support visualization layer
 *  - A transparency and explainability tool
 *
 * Design Principles:
 *  - AI recommends; humans decide
 *  - All reasoning is explicit, traceable, and inspection-ready
 *  - Read-only investigation (no data modification)
 *  - Bounded recommendations (advisory only)
 *
 * Phase context:
 *  - Phase 1: UI locked (visuals only, all tabs complete)
 *  - Phase 2: Intent annotation (this file)
 *  - Phase 3: UI → Data Contract
 *  - Phase 4: Backend wiring
 *
 * Scope (Prototype):
 *  - Visual completeness only
 *  - All data is mocked
 *  - No backend or regulatory execution
 */

import React, { useMemo, useState, useEffect } from "react";
import type { PrioritySignal } from "./mockData";
import {
  trajectoryDataBySignal,
  evidenceDataBySignal,
  casesDataBySignal,
  auditDataBySignal,
} from "./mockData";

/**
 * Tab navigation for deep analysis views
 */
export type DeepTab = "Trajectory" | "Cases" | "Evidence" | "Audit";

/**
 * Context for how the modal was launched (card click vs metric button)
 */
export type LaunchContext =
  | { kind: "metric"; metric: "PRR" | "Cases" | "Trend" }
  | { kind: "card" };

/**
 * Forecast time horizon options
 */
type Horizon = "30d" | "90d" | "6m" | "12m";

/**
 * Scenario selection for trajectory projection
 */
type Scenario = "noAction" | "intervention";

/**
 * DeepAnalysisModal Component
 *
 * Renders a modal dialog providing comprehensive analysis of a single safety signal.
 *
 * Features:
 *  - Tabbed interface (Trajectory / Cases / Evidence / Audit)
 *  - Interactive trajectory visualization with scenario comparison
 *  - Evidence source breakdown with freshness indicators
 *  - Individual case listing for human verification
 *  - Complete audit trail for regulatory compliance
 */
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

  // Reset state when modal opens (ensures clean state on each open)
  React.useEffect(() => {
    if (open) {
      setTab(initialTab ?? "Trajectory");
      // Reset to defaults when modal opens
      setHorizon("6m");
      setScenario("noAction");
    }
  }, [open, initialTab]);

  // ESC key to close modal (standard accessibility pattern)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Dynamic header text based on launch context
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
          {/* ================= TRAJECTORY TAB =================
           *
           * TRAJECTORY TAB
           * --------------
           * Visualizes how a signal evolves over time and into the future.
           *
           * Purpose:
           *  - Shift analysis from detection to foresight
           *  - Enable early intervention decision-making
           *  - Compare scenarios (no action vs intervention)
           *  - Communicate uncertainty explicitly
           *
           * What it shows:
           *  - Historical case counts (observed data)
           *  - Forecast projections (modeled predictions)
           *  - Velocity and acceleration indicators
           *  - Scenario comparison (no action vs early intervention)
           *  - 95% confidence intervals (uncertainty quantification)
           *
           * Key features:
           *  - Horizon selector (30d / 90d / 6m / 12m)
           *    Controls the time window for projected risk trajectory visualization
           *  - Scenario toggle (No action / Early intervention)
           *    Allows analysts to compare projected outcomes under different decision scenarios
           *  - Forecast boundary marker
           *    Clearly separates observed data from modeled projections (critical for regulatory clarity)
           *  - Confidence bands
           *    Communicates uncertainty explicitly to support audit-safe decision making
           *  - Projection insight callout
           *    Converts analytics into decision-relevant insight with human stakes (hospitalizations)
           *
           * Regulatory posture:
           *  - Clear separation between fact (historical) and prediction (forecast)
           *  - Uncertainty explicitly quantified and visualized
           *  - Scenario modeling supports "what if" analysis without commitment
           *
           * Backend (future):
           *  - Time-series case aggregation
           *  - Forecasting model outputs
           *  - Confidence interval calculations
           *  - Scenario simulation results
           */}
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
                {/* Header Controls
                 * Horizon selector: Controls the time window for projected risk trajectory visualization
                 * Scenario toggle: Allows analysts to compare projected outcomes under different decision scenarios
                 */}
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

                {/* Chart Container
                 * Bar chart showing historical and forecast case counts over time.
                 * Visual separation between observed (historical) and predicted (forecast) data.
                 */}
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
                        <div className="h-2 w-2 rounded-full bg-[color:var(--accent)] opacity-50 border border-dashed border-[color:var(--accent)]/60" />
                        <span>Forecast</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-[color:var(--accent-weak)]" />
                        <span>95% Confidence Interval (mock)</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart Area */}
                  <div className="relative h-64 bg-gradient-to-b from-transparent to-[color:var(--panel-3)]/30 rounded-lg overflow-hidden">
                    {/* Confidence Bands
                     * Shaded area around forecast bars representing 95% confidence intervals.
                     * Communicates uncertainty explicitly to support audit-safe decision making.
                     */}
                    {forecastData.map((point, i) => {
                      const lowerPercent = (point.lower / maxCases) * 100;
                      const upperPercent = (point.upper / maxCases) * 100;
                      const barWidth = 100 / (trajectoryData.historical.length + forecastData.length);
                      const xOffset = 50 + (i * barWidth); // Start from midpoint (historical/forecast divider)
                      return (
                        <div
                          key={`band-${i}`}
                          className="absolute"
                          style={{
                            left: `${xOffset}%`,
                            width: `${barWidth}%`,
                            height: `${upperPercent - lowerPercent}%`,
                            bottom: `${8 + lowerPercent}%`,
                            background: "rgba(96, 165, 250, 0.15)",
                            pointerEvents: "none",
                          }}
                        />
                      );
                    })}

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

                      {/* Forecast Boundary Marker
                       * Vertical dashed line clearly separating observed data from modeled projections.
                       * Critical for regulatory clarity: what is fact vs what is prediction.
                       */}
                      <div className="absolute left-1/2 top-0 bottom-8 w-px border-l-2 border-dashed border-[color:var(--border-strong)]" />
                      <div className="absolute left-1/2 top-2 -translate-x-1/2 text-[9px] font-medium text-[var(--text)] bg-[color:var(--panel-2)] px-2 py-0.5 rounded border border-[color:var(--border)]">
                        Forecast begins →
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

                    {/* Y-axis scale */}
                    <div className="absolute left-2 top-2 bottom-8 flex flex-col justify-between text-[9px] text-[var(--muted)]">
                      <span>{Math.round(maxCases)}</span>
                      <span>{Math.round(maxCases / 2)}</span>
                      <span>0</span>
                    </div>
                  </div>
                </div>

                {/* Key Insight Callout
                 * Converts analytics into decision-relevant insight.
                 * Shows projected impact and human stakes (hospitalizations avoided/prevented).
                 * Dynamic messaging based on selected scenario.
                 */}
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

          {/* ================= CASES TAB =================
           *
           * Allows drill-down into individual safety cases.
           *
           * Purpose:
           *  - Enable human verification of signal evidence
           *  - Preserve analyst trust through transparency
           *  - Support detailed investigation when needed
           *
           * Note:
           *  - Cases are read-only (investigative view only)
           *  - No editing or modification capabilities
           *  - Filters inherit from current org/dataset scope
           */}
          {tab === "Cases" && (() => {
            const cases = casesDataBySignal[signal.id] || casesDataBySignal.aspirin_gi_bleeding;
            const displayedCases = cases.slice(0, 10); // Show first 10 cases (pagination mock)

            return (
              <div className="space-y-4">
                {/* Filters
                 * Non-functional in prototype (visual only).
                 * In production, these would filter the case listing.
                 * Filters show analysts they can drill down to raw evidence when needed.
                 */}
                <div className="flex flex-wrap items-center gap-3">
                  <button className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--panel-2)] px-3 py-1.5 text-[11px] text-[var(--text)] hover:bg-[color:var(--panel-3)] transition-colors">
                    <input type="checkbox" className="h-3 w-3 rounded border-[color:var(--border)]" defaultChecked readOnly />
                    Serious only
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--panel-2)] px-3 py-1.5 text-[11px] text-[var(--text)] hover:bg-[color:var(--panel-3)] transition-colors">
                    Date range
                  </button>
                  <div className="text-[10px] text-[var(--muted)] ml-auto">
                    Showing {displayedCases.length} of {cases.length} cases
                  </div>
                </div>

                {/* Case Table */}
                <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-2)] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead className="bg-[color:var(--panel-3)] border-b border-[color:var(--border)]">
                        <tr>
                          <th className="px-3 py-2.5 text-left font-semibold text-[var(--text)]">Case ID</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-[var(--text)]">Age</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-[var(--text)]">Sex</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-[var(--text)]">Serious</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-[var(--text)]">Outcome</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-[var(--text)]">Onset Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[color:var(--border)]">
                        {displayedCases.map((c, idx) => (
                          <tr key={c.caseId} className="hover:bg-[color:var(--panel-3)]/50 transition-colors">
                            <td className="px-3 py-2.5 text-[var(--text)] font-mono text-[10px]">{c.caseId}</td>
                            <td className="px-3 py-2.5 text-[var(--text)]">{c.age}</td>
                            <td className="px-3 py-2.5 text-[var(--text)]">{c.sex}</td>
                            <td className="px-3 py-2.5">
                              {c.serious ? (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border border-[color:var(--risk-critical)]/25 bg-[color:var(--risk-critical-bg)] text-[color:var(--risk-critical)]">
                                  Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border border-[color:var(--border)] bg-[color:var(--panel-2)] text-[var(--muted)]">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-[var(--text)]">{c.outcome}</td>
                            <td className="px-3 py-2.5 text-[var(--muted)] font-mono text-[10px]">{c.onsetDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination mock */}
                  {cases.length > 10 && (
                    <div className="border-t border-[color:var(--border)] bg-[color:var(--panel-3)] px-4 py-2 flex items-center justify-between text-[10px] text-[var(--muted)]">
                      <span>Page 1 of {Math.ceil(cases.length / 10)}</span>
                      <div className="flex items-center gap-2">
                        <button className="px-2 py-1 rounded border border-[color:var(--border)] hover:bg-[color:var(--panel-2)] transition-colors" disabled>
                          ← Previous
                        </button>
                        <button className="px-2 py-1 rounded border border-[color:var(--border)] hover:bg-[color:var(--panel-2)] transition-colors">
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-[var(--muted)] italic">
                  Note: Filters inherit from current org/dataset scope. Cases are read-only for verification purposes.
                </div>
              </div>
            );
          })()}

          {/* ================= EVIDENCE TAB =================
           *
           * EVIDENCE TAB
           * ------------
           * Displays supporting evidence for the signal.
           *
           * Purpose:
           *  - Demonstrate methodological rigor
           *  - Support inspection-proof intelligence claims
           *  - Enable analysts to assess evidence quality
           *  - Provide source attribution for regulatory defensibility
           *
           * Evidence sources:
           *  - FAERS (primary structured data)
           *    Main source of structured adverse event reports
           *  - Literature (secondary corroboration)
           *    Published studies and abstracts supporting the signal
           *  - Early signal sources (emerging indicators)
           *    Pre-regulatory data sources (social, early warnings, etc.)
           *
           * All evidence is:
           *  - Deduplicated across sources
           *    Cross-source duplicates resolved to ensure accurate counts
           *  - Timestamped with freshness indicators
           *    Shows when data was last updated and new additions this week
           *  - Source-attributed for traceability
           *    Every piece of evidence can be traced to its origin
           *
           * Key features:
           *  - Source breakdown cards
           *    Visual cards showing evidence counts and freshness per source type
           *  - Freshness indicators
           *    Badges showing "Last update: X days ago" and "New this week: +X"
           *  - Deduplication notice
           *    Signals methodological rigor without technical overload
           *  - Logic summary
           *    Explains how composite scoring was derived
           *
           * Regulatory posture:
           *  - Every claim is defensible
           *  - Source attribution enables audit trails
           *  - Freshness indicators support data quality assessment
           *
           * Backend (future):
           *  - Cross-source deduplication results
           *  - Source-specific case counts
           *  - Timestamp tracking per source
           *  - Evidence quality scoring
           */}
          {tab === "Evidence" && (() => {
            const evidence = evidenceDataBySignal[signal.id] || evidenceDataBySignal.aspirin_gi_bleeding;
            return (
              <div className="space-y-4">
                <div className="text-[11px] text-[var(--muted)]">
                  Provenance and traceability (inspection‑proof intelligence). Every claim should be defensible.
                </div>

                {/* Source Breakdown Cards
                 * Visual cards showing evidence counts and freshness per source type.
                 * Includes icons, counts, last update timestamps, and "new this week" indicators.
                 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {evidence.map((source) => (
                    <div
                      key={source.source}
                      className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-2)] p-4 hover:border-[color:var(--border-strong)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{source.icon || "📊"}</span>
                          <div className="text-[12px] font-semibold text-[var(--text)]">{source.source}</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-[var(--text)] mt-1">{source.count}</div>
                      <div className="mt-2 space-y-1">
                        <div className="text-[10px] text-[var(--muted)]">
                          Last update: <span className="font-medium text-[var(--text)]">{source.lastUpdate}</span>
                        </div>
                        {source.newThisWeek !== undefined && (
                          <div className="inline-flex items-center gap-1 rounded-full bg-[color:var(--accent-weak)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--accent)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)] animate-pulse" />
                            New this week: +{source.newThisWeek}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Deduplication Notice
                 * Signals methodological rigor without technical overload.
                 * Assures analysts that case counts are accurate and not inflated by duplicates.
                 */}
                <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel-2)] px-4 py-2.5">
                  <div className="flex items-start gap-2">
                    <span className="text-[12px]">✓</span>
                    <div>
                      <div className="text-[11px] font-medium text-[var(--text)]">Cross-source duplicates resolved</div>
                      <div className="text-[10px] text-[var(--muted)] mt-0.5">
                        Evidence sources are deduplicated across FAERS, Literature, and Early Signals to ensure accurate case counts.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logic Summary (additional context) */}
                <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-2)] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)] mb-2">
                    Signal Logic Summary
                  </div>
                  <div className="text-[11px] text-[var(--text)]">
                    Composite score is derived from disproportionality, temporal pattern strength, novelty, and cross‑source corroboration.
                  </div>
                  <div className="mt-2 text-[10px] text-[var(--muted-2)] italic">
                    In production, this would link to the exact query, model version, and feature weights used.
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ================= AUDIT TAB =================
           *
           * Provides an inspection-ready timeline of analysis activity.
           *
           * Tracks:
           *  - Query execution (AI actions)
           *  - Model runs and trajectory generation
           *  - Recommendations issued
           *  - User interactions and filter applications
           *  - Report generation and exports
           *
           * Purpose:
           *  - Support regulatory and internal audits (CFR Part 11-friendly)
           *  - Demonstrate inspection-proof traceability
           *  - Enable accountability: who did what, when, and what changed
           *
           * Design:
           *  - All events are immutable and timestamped in UTC
           *  - Clear actor attribution (AI vs User)
           *  - Detailed context for each action
           */}
          {tab === "Audit" && (() => {
            const auditEvents = auditDataBySignal[signal.id] || auditDataBySignal.aspirin_gi_bleeding;

            return (
              <div className="space-y-4">
                <div className="text-[11px] text-[var(--muted)]">
                  CFR Part 11‑friendly auditability: who did what, when, and what changed. All actions are timestamped and attributed.
                </div>

                {/* Timeline View
                 * Vertical timeline showing chronological sequence of events.
                 * Demonstrates inspection-ready traceability with clear visual hierarchy.
                 */}
                <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-2)] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)] mb-4">
                    Audit Timeline
                  </div>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[color:var(--border)]" />

                    {/* Timeline Events */}
                    <div className="space-y-4">
                      {auditEvents.map((event, idx) => (
                        <div key={event.id} className="relative flex items-start gap-4 pl-8">
                          {/* Timeline dot */}
                          <div className="absolute left-2 top-1.5 h-2 w-2 rounded-full bg-[color:var(--accent)] border-2 border-[color:var(--panel-2)]" />

                          {/* Event content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[11px] font-semibold text-[var(--text)]">{event.action}</span>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium ${
                                      event.actor === "AI"
                                        ? "bg-[color:var(--accent-weak)] text-[color:var(--accent)]"
                                        : "bg-[color:var(--panel-3)] text-[var(--muted)]"
                                    }`}
                                  >
                                    {event.actor}
                                  </span>
                                  {event.actorName && (
                                    <span className="text-[10px] text-[var(--muted)]">· {event.actorName}</span>
                                  )}
                                </div>
                                {event.details && (
                                  <div className="text-[10px] text-[var(--muted)] mt-0.5">{event.details}</div>
                                )}
                              </div>
                              <div className="text-[10px] text-[var(--muted)] font-mono whitespace-nowrap">{event.timestamp}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer note */}
                <div className="text-[10px] text-[var(--muted)] italic">
                  All audit events are immutable and preserved for regulatory compliance. Timestamps are in UTC.
                </div>
              </div>
            );
          })()}

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

