// frontend/components/signals/SessionAnalysesSidebar.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface AnalysisHandle {
  id: string;
  title: string;
  created_at: string;
}

interface Props {
  sessionId: string;
}

export const SessionAnalysesSidebar: React.FC<Props> = ({ sessionId }) => {
  const [analyses, setAnalyses] = useState<AnalysisHandle[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchAnalyses = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/analysis/session/${sessionId}`
        );
        if (!res.ok) {
          const errorText = await res.text();
          let errorMessage = "Failed to load analyses";
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
        const data = await res.json();
        setAnalyses(data);
      } catch (err: any) {
        setError(err.message || "Failed to load analyses");
      }
    };

    fetchAnalyses();
  }, [sessionId]);

  if (error) {
    return (
      <div className="p-2 text-[11px] text-gray-500 border rounded bg-slate-50">
        <div className="font-semibold text-xs mb-1 text-gray-700">Session Analyses</div>
        <div className="text-[10px] text-gray-500">
          {error.includes("Analysis not found") || error.includes("404")
            ? "No analyses found for this session. Create a new analysis from the chat interface."
            : `Unable to load analyses: ${error}`}
        </div>
      </div>
    );
  }

  if (!analyses.length) {
    return (
      <div className="p-2 text-[11px] text-gray-500 border rounded">
        No analyses yet for this session.
      </div>
    );
  }

  return (
    <div className="p-2 text-[11px] border rounded bg-slate-50 space-y-1">
      <div className="font-semibold text-xs mb-1">
        This session&apos;s analyses
      </div>
      <ul className="space-y-1">
        {analyses.map((a) => (
          <li key={a.id} className="truncate">
            <Link
              href={`/signals/analysis/${a.id}?session=${sessionId}`}
              className="text-blue-600 hover:underline"
            >
              {a.title || a.id}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
