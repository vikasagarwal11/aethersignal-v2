"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { SignalAnalysisCharts, AnalysisStats } from "@/components/signals/SignalAnalysisCharts";
import { SessionAnalysesSidebar } from "@/components/signals/SessionAnalysesSidebar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type DimensionFilter = {
  values: string[];
  operator: "OR" | "AND";
  merge_strategy?: string;
};

type SignalQueryFilters = {
  drugs: DimensionFilter;
  events: DimensionFilter;
  seriousness_or_outcome: DimensionFilter;
  age_min?: number | null;
  age_max?: number | null;
  sex?: string | null;
  region_codes: string[];
  time_window?: string | null;
};

function renderFilterChips(filters: SignalQueryFilters | undefined) {
  if (!filters) return null;

  const chips: string[] = [];

  if (filters.drugs?.values?.length) {
    chips.push(`Drugs: ${filters.drugs.values.join(` ${filters.drugs.operator} `)}`);
  }

  if (filters.events?.values?.length) {
    chips.push(`Events: ${filters.events.values.join(` ${filters.events.operator} `)}`);
  }

  if (filters.seriousness_or_outcome?.values?.length) {
    chips.push(
      `Seriousness/outcome: ${filters.seriousness_or_outcome.values.join(
        ` ${filters.seriousness_or_outcome.operator || "OR"} `
      )}`
    );
  }

  if (filters.age_min != null || filters.age_max != null) {
    if (filters.age_min != null && filters.age_max != null) {
      chips.push(`Age: ${filters.age_min}-${filters.age_max}`);
    } else if (filters.age_min != null) {
      chips.push(`Age >= ${filters.age_min}`);
    } else if (filters.age_max != null) {
      chips.push(`Age <= ${filters.age_max}`);
    }
  }

  if (filters.sex) {
    chips.push(`Sex: ${filters.sex}`);
  }

  if (filters.region_codes?.length) {
    chips.push(`Regions: ${filters.region_codes.join(", ")}`);
  }

  if (filters.time_window) {
    // Format time window for display
    const timeWindowMap: Record<string, string> = {
      LAST_6_MONTHS: "Last 6 months",
      LAST_12_MONTHS: "Last 12 months",
      LAST_24_MONTHS: "Last 24 months",
    };
    const displayText = timeWindowMap[filters.time_window] || filters.time_window;
    chips.push(`Time window: ${displayText}`);
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-2 text-xs mt-2">
      {chips.map((chip, idx) => (
        <span
          key={idx}
          className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700 border border-slate-200"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

interface AnalysisRow {
  case_id: string;
  drug: string;
  event: string;
  serious: boolean;
  outcome?: string | null;
  onset_date?: string | null;
  age?: number | null;
  sex?: string | null;
  region?: string | null;
}

interface AnalysisHandle {
  id: string;
  title: string;
  created_at: string;
  summary_text: string;
  filters?: SignalQueryFilters;
}

interface AnalysisDetailResponse {
  handle: AnalysisHandle;
  rows: AnalysisRow[];
  total_count: number;
  page: number;
  page_size: number;
}

interface FusionResultSummary {
  drug: string;
  event: string;
  fusion_score: number;
  alert_level?: string;
  quantum_score_layer1?: number;
  quantum_score_layer2?: number;
  classical_score?: number;
  explanation?: string;
  components?: Record<string, any>;
}

export default function AnalysisDetailPage() {
  const params = useParams<{ analysisId: string }>();
  const searchParams = useSearchParams();
  const analysisId = params.analysisId;
  const sessionId = searchParams.get("session");

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AnalysisDetailResponse | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fusion ranking state
  const [loadingFusion, setLoadingFusion] = useState(false);
  const [fusionResults, setFusionResults] = useState<FusionResultSummary[] | null>(null);
  const [fusionError, setFusionError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) return;

    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [detailRes, statsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/analysis/${analysisId}`, { signal: abortController.signal }),
          fetch(`${API_BASE_URL}/api/v1/analysis/${analysisId}/stats`, { signal: abortController.signal }),
        ]);

        if (!detailRes.ok) {
          const errorText = await detailRes.text();
          let errorMessage = "Failed to load analysis";
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.detail || errorMessage;
          } catch {
            if (errorText && errorText.length < 200) {
              errorMessage = errorText;
            }
          }
          throw new Error(errorMessage);
        }
        if (!statsRes.ok) {
          const errorText = await statsRes.text();
          let errorMessage = "Failed to load analysis stats";
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.detail || errorMessage;
          } catch {
            if (errorText && errorText.length < 200) {
              errorMessage = errorText;
            }
          }
          throw new Error(errorMessage);
        }

        const detailJson = await detailRes.json();
        const statsJson = await statsRes.json();

        setDetail(detailJson);
        setStats(statsJson);
      } catch (err: any) {
        setError(err.message || "Failed to load analysis");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [analysisId]);

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/analysis/${analysisId}/export`);
      if (!res.ok) {
        throw new Error("Failed to export analysis");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analysis-${analysisId}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || "Failed to export analysis");
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/analysis/${analysisId}/save`,
        { method: "POST" }
      );
      if (!res.ok) {
        throw new Error(await res.text());
      }
      // Show success message
      setError(null);
      // Could add toast here if available
    } catch (err: any) {
      setError(`Failed to save analysis: ${err.message || err}`);
    }
  };

  const runFusionRanking = async () => {
    if (!analysisId) return;
    setLoadingFusion(true);
    setFusionError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/analysis/${analysisId}/fusion`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setFusionResults(data.results || []);
    } catch (err: any) {
      setFusionError(err.message || "Failed to run fusion ranking");
    } finally {
      setLoadingFusion(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-sm">Loading analysis...</div>;
  }

      if (error) {
        return (
          <div className="p-4 text-sm text-red-600 space-y-2">
            <div className="font-semibold">Error loading analysis</div>
            <div>{error}</div>
            <div className="text-xs text-gray-500 mt-2">
              This analysis may have expired (analyses expire after 60 minutes) or the server was restarted.
              Please create a new analysis from the chat interface.
            </div>
          </div>
        );
      }

  if (!detail) {
    return <div className="p-4 text-sm">No analysis found.</div>;
  }

  const { handle, rows, total_count, page, page_size } = detail;

  return (
    <div className="flex h-full">
      <div className="flex-1 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{handle.title}</h1>
            <p className="text-xs text-gray-600">
              Total rows: {total_count} | Page {page} of {Math.ceil(total_count / page_size)}
            </p>
            {renderFilterChips(handle.filters)}
            <div className="text-xs text-gray-500">
              ID: {handle.id} | Created: {new Date(handle.created_at).toLocaleString()}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="text-xs px-3 py-1 rounded border bg-white hover:bg-gray-50"
              onClick={handleSave}
            >
              Save analysis
            </button>
            <button
              className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
              onClick={handleExport}
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Charts */}
        {stats && <SignalAnalysisCharts stats={stats} />}

        <div className="border rounded overflow-hidden">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-2 py-1 text-left">Case ID</th>
              <th className="px-2 py-1 text-left">Drug</th>
              <th className="px-2 py-1 text-left">Event</th>
              <th className="px-2 py-1 text-left">Serious</th>
              <th className="px-2 py-1 text-left">Outcome</th>
              <th className="px-2 py-1 text-left">Onset</th>
              <th className="px-2 py-1 text-left">Age</th>
              <th className="px-2 py-1 text-left">Sex</th>
              <th className="px-2 py-1 text-left">Region</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-2 py-3 text-center text-gray-400">
                  No rows (run_cases_query is not wired yet, or filters returned zero rows).
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.case_id} className="border-b hover:bg-gray-50">
                  <td className="px-2 py-1">{r.case_id}</td>
                  <td className="px-2 py-1">{r.drug}</td>
                  <td className="px-2 py-1">{r.event}</td>
                  <td className="px-2 py-1">{r.serious ? "Yes" : "No"}</td>
                  <td className="px-2 py-1">{r.outcome ?? ""}</td>
                  <td className="px-2 py-1">{r.onset_date ?? ""}</td>
                  <td className="px-2 py-1">{r.age ?? ""}</td>
                  <td className="px-2 py-1">{r.sex ?? ""}</td>
                  <td className="px-2 py-1">{r.region ?? ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Fusion Signal Ranking Section */}
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Fusion-ranked signals in this cohort</h2>
            <button
              onClick={runFusionRanking}
              disabled={loadingFusion}
              className="px-3 py-1 text-xs rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {loadingFusion ? "Running..." : "Run fusion signal ranking"}
            </button>
          </div>

          {fusionError && (
            <div className="text-xs text-red-600 mb-2">{fusionError}</div>
          )}

          {fusionResults && fusionResults.length > 0 && (
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left">Drug</th>
                    <th className="px-2 py-1 text-left">Event</th>
                    <th className="px-2 py-1 text-right">Fusion score</th>
                    <th className="px-2 py-1 text-left">Alert level</th>
                  </tr>
                </thead>
                <tbody>
                  {fusionResults.map((r, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-2 py-1">{r.drug}</td>
                      <td className="px-2 py-1">{r.event}</td>
                      <td className="px-2 py-1 text-right">
                        {r.fusion_score.toFixed(3)}
                      </td>
                      <td className="px-2 py-1">
                        {r.alert_level || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {fusionResults && fusionResults.length === 0 && !loadingFusion && !fusionError && (
            <div className="text-xs text-gray-500">
              No signals found for this cohort using current fusion thresholds.
            </div>
          )}
        </div>

        {/* PHASE 2/3: Comparison mode, save analysis, alerts UI can hook here */}
      </div>
      {sessionId && <SessionAnalysesSidebar sessionId={sessionId} />}
    </div>
  );
}
