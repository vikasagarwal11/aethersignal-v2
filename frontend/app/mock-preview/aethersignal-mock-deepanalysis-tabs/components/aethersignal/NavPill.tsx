import React from "react";

export type PageKey = "dashboard" | "signals" | "analyses" | "settings";

export function NavPill({
  label,
  page,
  active,
  onClick,
}: {
  label: string;
  page: PageKey;
  active: boolean;
  onClick: (page: PageKey) => void;
}) {
  return (
    <button
      onClick={() => onClick(page)}
      className={[
        "px-2 py-1 rounded-full text-xs font-medium transition-colors",
        active
          ? "bg-blue-500/10 text-blue-400 border border-blue-500/40"
          : "text-gray-400 hover:text-gray-100 hover:bg-gray-800 border border-transparent",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
