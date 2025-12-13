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
          ? "bg-[var(--accent-weak)] text-[var(--accent)] border border-[var(--accent)]/40"
          : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[color:var(--panel-2)] border border-transparent",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

