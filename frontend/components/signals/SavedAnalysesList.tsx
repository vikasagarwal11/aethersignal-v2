// frontend/components/signals/SavedAnalysesList.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface SavedAnalysis {
  id: string;
  analysis_id: string;
  name: string;
  created_at: string;
}

interface Props {
  sessionId?: string; // optional filter
}

export const SavedAnalysesList: React.FC<Props> = ({ sessionId }) => {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (sessionId) params.set("session_id", sessionId);

    const fetchSaved = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/analysis/saved?${params.toString()}`
        );
        if (!res.ok) {
          const errorText = await res.text();
          let errorMessage = "Failed to load saved analyses";
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
        setItems(data);
      } catch (err: any) {
        setError(err.message || "Failed to load saved analyses");
      }
    };

    fetchSaved();
  }, [sessionId]);

  if (error) {
    return (
      <div className="p-2 text-[11px] text-gray-500 border rounded bg-slate-50">
        <div className="font-semibold text-xs mb-1 text-gray-700">Saved Analyses</div>
        <div className="text-[10px] text-gray-500">
          {error.includes("404") || error.includes("not found")
            ? "No saved analyses found. Save analyses from the analysis detail page."
            : `Unable to load: ${error}`}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="p-2 text-[11px] text-gray-500 border rounded">
        No saved analyses yet.
      </div>
    );
  }

  return (
    <div className="p-2 text-[11px] border rounded bg-slate-50 space-y-1">
      <div className="font-semibold text-xs mb-1">Saved analyses</div>
      <ul className="space-y-1">
        {items.map((a) => (
          <li key={a.id} className="truncate">
            <Link
              href={`/signals/analysis/${a.analysis_id}`}
              className="text-blue-600 hover:underline"
            >
              {a.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

