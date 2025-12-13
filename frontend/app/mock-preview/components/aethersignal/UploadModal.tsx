"use client";

/**
 * UPLOAD MODAL
 * ------------
 * Interface for uploading safety data files for ingestion.
 *
 * Purpose:
 *  - Allow users to upload safety data files (FAERS, EudraVigilance, etc.)
 *  - Track upload progress and processing status
 *  - Provide visual feedback during ingestion pipeline
 *  - Support CFR Part 11-compliant audit trail attachment
 *
 * This modal:
 *  - Accepts multiple file types (CSV, Parquet, ZIP archives)
 *  - Shows progress tracking per file
 *  - Indicates processing pipeline steps (upload → process → complete)
 *  - Provides mock functionality for prototype
 *
 * File handling:
 *  - ZIP archives are treated as batch uploads
 *  - Inner files appear after server-side unpacking
 *  - Each file gets CFR-style timestamp and audit trail
 *
 * Phase context:
 *  - Phase 1: UI locked (visuals only, mock progress)
 *  - Phase 2: Intent annotation (this file) + theme consistency
 *  - Phase 3: UI → Data Contract
 *  - Phase 4: Backend wiring (Supabase storage, ingestion pipeline)
 *
 * Backend (future):
 *  - File storage (Supabase Storage or S3)
 *  - Ingestion pipeline orchestration
 *  - Progress tracking via webhooks or polling
 *  - Audit log creation per upload event
 *  - Session association (link upload to session_id)
 */

import React, { useState } from "react";

type UploadStatus = "queued" | "uploading" | "processing" | "completed" | "failed";

interface UploadItem {
  id: string;
  name: string;
  size: string;
  type: string;
  isZip: boolean;
  status: UploadStatus;
  progress: number; // 0–100
}

export function UploadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<UploadItem[]>(() => [
    {
      id: "u1",
      name: "faers_q3_2025.zip",
      size: "120 MB",
      type: "ZIP archive",
      isZip: true,
      status: "uploading",
      progress: 42,
    },
    {
      id: "u2",
      name: "eudravigilance_oct_2025.csv",
      size: "34 MB",
      type: "CSV",
      isZip: false,
      status: "processing",
      progress: 100,
    },
    {
      id: "u3",
      name: "japan_pmda_cases_2025-11.parquet",
      size: "18 MB",
      type: "Parquet",
      isZip: false,
      status: "completed",
      progress: 100,
    },
  ]);

  if (!open) return null;

  const formatSize = (bytes: number) => {
    if (!Number.isFinite(bytes)) return "";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const next: UploadItem[] = Array.from(files).map((file, idx) => {
      const isZip = file.name.toLowerCase().endsWith(".zip");
      return {
        id: `${Date.now()}-${idx}`,
        name: file.name,
        size: formatSize(file.size),
        type: isZip ? "ZIP archive" : file.type || "File",
        isZip,
        status: "queued",
        progress: 0,
      };
    });
    setItems((prev) => [...prev, ...next]);
    e.target.value = "";
  };

  const updateStatus = (status: UploadStatus) => {
    setItems((prev) =>
      prev.map((item) => {
        if (status === "uploading" && item.status === "queued") {
          return {
            ...item,
            status: "uploading",
            progress: item.isZip ? 20 : 55,
          };
        }
        if (status === "completed") {
          return { ...item, status: "completed", progress: 100 };
        }
        return item;
      }),
    );
  };

  // Status chip styling using theme tokens
  const statusChipClasses = (status: UploadStatus) => {
    switch (status) {
      case "queued":
        return "bg-[color:var(--panel-2)] text-[var(--text)] border-[color:var(--border)]";
      case "uploading":
        return "bg-[color:var(--accent-weak)] text-[color:var(--accent)] border-[color:var(--accent)]/40";
      case "processing":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-200 border-amber-500/60";
      case "completed":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-200 border-emerald-500/60";
      case "failed":
        return "bg-[color:var(--risk-critical-bg)] text-[color:var(--risk-critical)] border-[color:var(--risk-critical)]/40";
      default:
        return "bg-[color:var(--panel-2)] text-[var(--text)] border-[color:var(--border)]";
    }
  };

  const statusLabel = (status: UploadStatus) => {
    switch (status) {
      case "queued":
        return "Queued";
      case "uploading":
        return "Uploading";
      case "processing":
        return "Processing";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel)] px-5 py-4 shadow-[var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-[11px] font-semibold text-[var(--text)]">Upload safety data</div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5">
              Select one or more files. ZIP archives are treated as a single upload; inner files appear after
              server-side unpacking.
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

        {/* File Selection and Actions */}
        <div className="mb-3 flex items-center justify-between gap-2 text-[11px]">
          <label className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--panel-2)] px-3 py-1.5 cursor-pointer text-[var(--text)] hover:bg-[color:var(--panel-3)] transition-colors">
            <span>+ Add files</span>
            <input type="file" multiple className="hidden" onChange={handleFilesSelected} />
          </label>

          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-[color:var(--border)] px-3 py-1.5 text-[11px] text-[var(--text)] hover:bg-[color:var(--panel-2)] transition-colors"
              onClick={() => updateStatus("uploading")}
            >
              Start upload (mock)
            </button>
            <button
              className="rounded-full bg-[color:var(--accent)] px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 transition-opacity"
              onClick={() => updateStatus("completed")}
            >
              Mark all complete (mock)
            </button>
          </div>
        </div>

        {/* File List Table */}
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-2)] max-h-72 overflow-y-auto custom-scrollbar">
          <table className="w-full text-[11px]">
            <thead className="bg-[color:var(--panel-3)] text-[var(--muted)] sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-normal">File</th>
                <th className="text-left px-3 py-2 font-normal w-24">Type</th>
                <th className="text-right px-3 py-2 font-normal w-20">Size</th>
                <th className="text-left px-3 py-2 font-normal w-28">Status</th>
                <th className="text-left px-3 py-2 font-normal w-40">Progress</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-[11px] text-[var(--muted)]">
                    No files selected yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-[color:var(--border)]">
                    <td className="px-3 py-2 align-top">
                      <div className="text-[var(--text)] truncate">{item.name}</div>
                      {item.isZip && (
                        <div className="text-[10px] text-[var(--muted)] mt-0.5">
                          ZIP archive – overall progress shown here; inner files appear after unpacking.
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-[var(--text)]">{item.type}</td>
                    <td className="px-3 py-2 align-top text-right text-[var(--text)]">{item.size}</td>
                    <td className="px-3 py-2 align-top">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 ${statusChipClasses(
                          item.status,
                        )}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="h-2 rounded-full bg-[color:var(--panel-3)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[color:var(--accent)] via-purple-500 to-fuchsia-500"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer - Audit Trail Note */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--muted)]">
          <div>
            <div>CFR Part 11 timestamps + audit trail attach per ingestion event.</div>
            <div>ZIP contents are logged per inner file once unpacked.</div>
          </div>
          <button
            className="rounded-full border border-[color:var(--border)] px-3 py-1.5 text-[11px] text-[var(--text)] hover:bg-[color:var(--panel-2)] transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

