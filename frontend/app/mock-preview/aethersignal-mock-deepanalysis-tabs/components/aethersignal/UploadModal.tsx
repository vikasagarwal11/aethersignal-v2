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

  const statusChipClasses = (status: UploadStatus) => {
    switch (status) {
      case "queued":
        return "bg-gray-800 text-gray-300 border-gray-600";
      case "uploading":
        return "bg-blue-500/10 text-blue-200 border-blue-500/60";
      case "processing":
        return "bg-amber-500/10 text-amber-200 border-amber-500/60";
      case "completed":
        return "bg-emerald-500/10 text-emerald-200 border-emerald-500/60";
      case "failed":
        return "bg-red-500/10 text-red-200 border-red-500/60";
      default:
        return "bg-gray-800 text-gray-300 border-gray-600";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-2xl rounded-2xl border border-[#262A33] bg-[#05060A] px-5 py-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-[11px] font-semibold text-gray-200">Upload safety data</div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Select one or more files. ZIP archives are treated as a single upload; inner files appear after
              server-side unpacking.
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

        <div className="mb-3 flex items-center justify-between gap-2 text-[11px]">
          <label className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 cursor-pointer text-gray-100 hover:bg-gray-800">
            <span>+ Add files</span>
            <input type="file" multiple className="hidden" onChange={handleFilesSelected} />
          </label>

          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-gray-700 px-3 py-1.5 text-[11px] text-gray-200 hover:bg-gray-800"
              onClick={() => updateStatus("uploading")}
            >
              Start upload (mock)
            </button>
            <button
              className="rounded-full bg-blue-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-400"
              onClick={() => updateStatus("completed")}
            >
              Mark all complete (mock)
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#262A33] bg-[#0B0F19] max-h-72 overflow-y-auto custom-scrollbar">
          <table className="w-full text-[11px]">
            <thead className="bg-[#0F1115] text-gray-400 sticky top-0">
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
                  <td colSpan={5} className="px-3 py-6 text-center text-[11px] text-gray-500">
                    No files selected yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-[#262A33]">
                    <td className="px-3 py-2 align-top">
                      <div className="text-gray-100 truncate">{item.name}</div>
                      {item.isZip && (
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          ZIP archive – overall progress shown here; inner files appear after unpacking.
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-gray-300">{item.type}</td>
                    <td className="px-3 py-2 align-top text-right text-gray-300">{item.size}</td>
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
                      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500"
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

        <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
          <div>
            <div>CFR Part 11 timestamps + audit trail attach per ingestion event.</div>
            <div>ZIP contents are logged per inner file once unpacked.</div>
          </div>
          <button
            className="rounded-full border border-gray-700 px-3 py-1.5 text-[11px] text-gray-200 hover:bg-gray-800"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
