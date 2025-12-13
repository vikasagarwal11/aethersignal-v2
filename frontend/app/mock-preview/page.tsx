"use client";

import React, { useState } from "react";
import { NavPill, type PageKey } from "./components/aethersignal/NavPill";
import { SignalsPage } from "./components/aethersignal/SignalsPage";
import { UploadModal } from "./components/aethersignal/UploadModal";
import { ThemeProvider, useTheme } from "./components/aethersignal/ThemeProvider";

function PageContent() {
  const [activePage, setActivePage] = useState<PageKey>("signals");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="aether-shell h-screen overflow-hidden flex flex-col" suppressHydrationWarning>
      {/* TOP NAVBAR */}
      <header className="h-16 shrink-0 border-b border-[color:var(--border)] bg-[color:var(--panel)]/95 backdrop-blur flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-semibold">
            AS
          </div>
                      <div>
                        <div className="text-sm font-semibold tracking-tight text-[var(--text)]">AetherSignal</div>
                        <div className="text-[11px] text-[var(--muted)]">Safety intelligence prototype</div>
                      </div>

          <nav className="hidden md:flex items-center gap-2 ml-8">
            <NavPill label="Dashboard" page="dashboard" active={activePage === "dashboard"} onClick={setActivePage} />
            <NavPill label="Signals" page="signals" active={activePage === "signals"} onClick={setActivePage} />
            <NavPill label="Analyses" page="analyses" active={activePage === "analyses"} onClick={setActivePage} />
            <NavPill label="Settings" page="settings" active={activePage === "settings"} onClick={setActivePage} />
          </nav>
        </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleTheme}
                        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1.5 text-[12px] shadow-sm hover:shadow transition text-[var(--text)]"
                        title="Toggle theme"
                      >
                        <span className="text-[12px]">{theme === "dark" ? "Dark" : "Light"}</span>
                      </button>
                      <button className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1.5 text-[12px] shadow-sm hover:shadow transition text-[var(--text)]">
                        Export
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-3 sm:px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[color:var(--accent-hover-bright)] dark:hover:bg-blue-500 dark:hover:brightness-110 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                        onClick={() => setShowUploadModal(true)}
                      >
                        Upload data
                      </button>
                      <div className="h-8 w-8 rounded-full bg-[color:var(--panel-2)] flex items-center justify-center text-[11px] font-semibold text-[var(--text)]">
                        AR
                      </div>
                    </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activePage === "signals" && <SignalsPage />}
        {activePage === "dashboard" && <Placeholder title="Dashboard" />}
        {activePage === "analyses" && <Placeholder title="Analyses" />}
        {activePage === "settings" && <Placeholder title="Settings" />}
      </div>

      <UploadModal open={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </div>
  );
}

            function Placeholder({ title }: { title: string }) {
              return (
                <div className="h-full flex items-center justify-center text-[var(--muted)]">
                  <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-6 py-4 shadow-[var(--shadow)]">
                    <div className="text-sm font-semibold text-[var(--text)]">{title}</div>
                    <div className="mt-1 text-[11px] text-[var(--muted)]">Placeholder page for the prototype.</div>
                  </div>
                </div>
              );
            }

export default function Page() {
  return (
    <ThemeProvider>
      <PageContent />
    </ThemeProvider>
  );
}
