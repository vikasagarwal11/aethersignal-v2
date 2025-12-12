"use client";

import React, { useMemo, useState, useEffect } from "react";
import type { PrioritySignal } from "./mockData";

export type DeepTab = "Trajectory" | "Cases" | "Evidence" | "Audit";
export type LaunchContext =
  | { kind: "metric"; metric: "PRR" | "Cases" | "Trend" }
  | { kind: "card" };

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

  // Keep tab in sync when a new modal open happens (common in prototyping)
  React.useEffect(() => {
    if (open) setTab(initialTab ?? "Trajectory");
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[min(920px,92vw)] rounded-2xl border border-blue-500/40 bg-[#060910] shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1E2430] flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-blue-200 mb-1">{headerKicker}</div>
            <div className="text-sm font-semibold text-gray-50">
              {signal.drug} · {signal.reaction}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-gray-300">
              <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5">
                Signal ID: <span className="text-gray-100">{signal.id}</span>
              </span>
              <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5">
                PRR: <span className="text-gray-100 font-semibold">{signal.prr}</span>
              </span>
              <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5">
                Cases: <span className="text-gray-100 font-semibold">{signal.cases}</span>
              </span>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
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
            className="rounded-full px-2 py-1 text-[11px] text-gray-400 hover:text-gray-100 hover:bg-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3">
          <div className="inline-flex rounded-full bg-gray-900 p-1 text-[11px] font-medium text-gray-300">
            {(["Trajectory", "Cases", "Evidence", "Audit"] as DeepTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  "px-3 py-1 rounded-full transition-colors",
                  tab === t ? "bg-gray-800 text-gray-100" : "text-gray-400 hover:text-gray-100",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 pt-4">
          {tab === "Trajectory" && (
            <div className="space-y-3">
              <div className="text-[11px] text-gray-300">
                This tab represents the "score → trajectory" shift: direction, velocity, and confidence.
              </div>

              {/* Horizon and Scenario Selectors */}
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Horizon:</span>
                  <div className="inline-flex rounded-full bg-gray-900 border border-gray-700 p-0.5">
                    {["30d", "90d", "6m", "12m"].map((horizon) => (
                      <button
                        key={horizon}
                        onClick={() => {}}
                        className={[
                          "px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors",
                          horizon === "30d"
                            ? "bg-gray-800 text-gray-100"
                            : "text-gray-400 hover:text-gray-100",
                        ].join(" ")}
                      >
                        {horizon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Scenario:</span>
                  <div className="inline-flex rounded-full bg-gray-900 border border-gray-700 p-0.5">
                    {["No action", "Intervention"].map((scenario) => (
                      <button
                        key={scenario}
                        onClick={() => {}}
                        className={[
                          "px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors",
                          scenario === "No action"
                            ? "bg-gray-800 text-gray-100"
                            : "text-gray-400 hover:text-gray-100",
                        ].join(" ")}
                      >
                        {scenario}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#1E2430] bg-[#0B0F19] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                      Trajectory strip (placeholder)
                    </div>
                    <div className="mt-1 text-[11px] text-gray-200">
                      Baseline → Now → Projected (30d)
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-gray-200">
                      Velocity: <span className="font-semibold text-gray-100">{signal.velocity}</span>
                    </span>
                    <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-gray-200">
                      Confidence: <span className="font-semibold text-gray-100">{signal.confidence}</span>
                    </span>
                    <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-blue-200">
                      Recommendation: <span className="font-semibold text-blue-100">{signal.recommendation}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-3 h-2 rounded-full bg-[#1A2030] overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500" />
                </div>

                <div className="mt-3 text-[10px] text-gray-400">
                  In production, this area would include PRR/EBGM time-series, slope/velocity, and confidence bands.
                </div>
              </div>
            </div>
          )}

          {tab === "Cases" && (
            <div className="space-y-3">
              <div className="text-[11px] text-gray-300">
                Case listing view for this drug–event pair (placeholder). This is where "decision support" starts.
              </div>

              <div className="rounded-xl border border-[#1E2430] bg-[#0B0F19] p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Case list (mock)
                  </div>
                  <button className="rounded-full border border-gray-700 bg-gray-900 px-3 py-1 text-[11px] text-gray-200 hover:bg-gray-800">
                    Open full case listing
                  </button>
                </div>
                <div className="mt-3 text-[11px] text-gray-400">
                  Filters would inherit from current org/dataset scope. Additional toggles:
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                  <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-gray-200">
                    Serious only
                  </span>
                  <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-gray-200">
                    Last 12 months
                  </span>
                  <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-gray-200">
                    Deduped cases
                  </span>
                </div>
              </div>
            </div>
          )}

          {tab === "Evidence" && (
            <div className="space-y-3">
              <div className="text-[11px] text-gray-300">
                Provenance and traceability (inspection‑proof intelligence). Every claim should be defensible.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#1E2430] bg-[#0B0F19] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Evidence sources (mock)
                  </div>
                  <ul className="mt-2 text-[11px] text-gray-300 list-disc list-inside space-y-1">
                    <li>FAERS: 21 matching reports</li>
                    <li>EudraVigilance: 13 matching reports</li>
                    <li>Literature: 3 supporting abstracts</li>
                    <li>Social: 0 (excluded for this query)</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-[#1E2430] bg-[#0B0F19] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Logic summary (mock)
                  </div>
                  <div className="mt-2 text-[11px] text-gray-300">
                    Composite score is derived from disproportionality, temporal pattern strength, novelty, and
                    cross‑source corroboration.
                  </div>
                  <div className="mt-2 text-[10px] text-gray-500">
                    In production, link to the exact query + model version + feature weights used.
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "Audit" && (
            <div className="space-y-3">
              <div className="text-[11px] text-gray-300">
                CFR Part 11‑friendly auditability: who did what, when, and what changed.
              </div>

              <div className="rounded-xl border border-[#1E2430] bg-[#0B0F19] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Audit trail (mock)
                </div>
                <div className="mt-3 text-[11px] text-gray-300 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-gray-100">Analysis opened</div>
                      <div className="text-[10px] text-gray-400">User: AR · Action: view</div>
                    </div>
                    <div className="text-[10px] text-gray-400 whitespace-nowrap">11-Dec-2025 09:15:02 UTC</div>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-gray-100">Filters applied</div>
                      <div className="text-[10px] text-gray-400">Serious only · Last 12 months · Org scope</div>
                    </div>
                    <div className="text-[10px] text-gray-400 whitespace-nowrap">11-Dec-2025 09:15:11 UTC</div>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-gray-100">Report generated</div>
                      <div className="text-[10px] text-gray-400">Artifact: Briefing PDF (mock)</div>
                    </div>
                    <div className="text-[10px] text-gray-400 whitespace-nowrap">11-Dec-2025 09:15:44 UTC</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-5 flex flex-wrap items-center justify-end gap-2 text-[11px]">
            <button
              className="rounded-full border border-gray-700 px-3 py-1.5 text-gray-200 hover:bg-gray-800"
              onClick={onClose}
            >
              Close
            </button>
            <button className="rounded-full bg-blue-500 px-3 py-1.5 font-semibold text-white hover:bg-blue-400">
              Open full analysis (mock)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

