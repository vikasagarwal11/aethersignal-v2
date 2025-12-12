import React, { useState } from "react";
import { NavPill, type PageKey } from "./components/aethersignal/NavPill";
import { SignalsPage } from "./components/aethersignal/SignalsPage";
import { UploadModal } from "./components/aethersignal/UploadModal";

export default function Page() {
  const [activePage, setActivePage] = useState<PageKey>("signals");
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#0F1115] text-gray-100 flex flex-col">
      {/* TOP NAVBAR */}
      <header className="h-16 border-b border-gray-800 bg-[#10141C]/95 backdrop-blur flex items-center justify-between px-4 lg:px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-semibold">
            AS
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">AetherSignal</div>
            <div className="text-[11px] text-gray-400">Safety intelligence prototype</div>
          </div>

          <nav className="hidden md:flex items-center gap-2 ml-8">
            <NavPill label="Dashboard" page="dashboard" active={activePage === "dashboard"} onClick={setActivePage} />
            <NavPill label="Signals" page="signals" active={activePage === "signals"} onClick={setActivePage} />
            <NavPill label="Analyses" page="analyses" active={activePage === "analyses"} onClick={setActivePage} />
            <NavPill label="Settings" page="settings" active={activePage === "settings"} onClick={setActivePage} />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden sm:inline-flex items-center gap-1 rounded-full border border-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-800">
            Export
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 sm:px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_0_1px_rgba(59,130,246,0.6)] hover:bg-blue-400"
            onClick={() => setShowUploadModal(true)}
          >
            Upload data
          </button>
          <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-[11px] font-semibold">
            AR
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-hidden">
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
    <div className="h-full flex items-center justify-center text-gray-400">
      <div className="rounded-2xl border border-gray-800 bg-[#10141C] px-6 py-4">
        <div className="text-sm font-semibold text-gray-100">{title}</div>
        <div className="mt-1 text-[11px]">Placeholder page for the prototype.</div>
      </div>
    </div>
  );
}
