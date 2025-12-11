"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface SavedAnalysis {
  id: string;
  analysis_id: string;
  name: string;
  owner_user_id?: string | null;
  session_id?: string | null;
  created_at: string;
}

export default function SavedAnalysesPage() {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        // For now, we can pass session_id if available from URL or localStorage
        // Later this will use authenticated user_id
        const searchParams = new URLSearchParams(window.location.search);
        const sessionId = searchParams.get("session");
        const url = sessionId 
          ? `${API_BASE_URL}/api/v1/analysis/saved?session_id=${sessionId}`
          : `${API_BASE_URL}/api/v1/analysis/saved`;
        
        const res = await fetch(url, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("Failed to load saved analyses");
        }
        const data = await res.json();
        setItems(data);
      } catch (error) {
        console.error("Error loading saved analyses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, []);

  if (loading) {
    return <div className="p-4 text-sm">Loading saved analyses...</div>;
  }

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-lg font-semibold">Saved analyses</h1>
      <div className="text-xs text-gray-500">
        These analyses are stored in the database and persist across sessions.
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-gray-400">No saved analyses yet.</div>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((sa) => (
            <li key={sa.id} className="border rounded px-3 py-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{sa.name}</div>
                <div className="text-xs text-gray-500">
                  {new Date(sa.created_at).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => router.push(`/signals/analysis/${sa.analysis_id}`)}
                className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
              >
                Open
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

