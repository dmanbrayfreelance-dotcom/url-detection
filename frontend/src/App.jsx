import React, { useState } from "react";
import DashboardPage from "./pages/DashboardPage";
import AuditLogsPage from "./pages/AuditLogsPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard"); // "dashboard" or "audit"

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top Cyber Navigation Bar */}
      <header className="border-b border-gray-800/80 bg-[#0d1424]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  TrackPhish <span className="text-sky-400 font-normal">Enhanced</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                  IEEE TIFS 2025
                </span>
              </div>
              <span className="text-[10px] text-gray-400 block -mt-0.5">
                Multi-Embedding Attention 1D CNN URL Shield
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage("dashboard")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentPage === "dashboard"
                  ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Dashboard & Scanner</span>
            </button>

            <button
              onClick={() => setCurrentPage("audit")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentPage === "audit"
                  ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Audit Logs</span>
            </button>

            <div className="h-5 w-[1px] bg-gray-800 mx-2 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2 bg-gray-900/80 px-2.5 py-1 rounded-full border border-gray-800 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-300 font-mono">Zero-Live-Visit Mode</span>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === "dashboard" ? <DashboardPage /> : <AuditLogsPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 bg-[#0b101d] py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-400">TrackPhish Enhanced</span>
            <span>•</span>
            <span>Based on IEEE TIFS 2025 (Kondaiah, Pais, and Rao)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-500">
            <span>FastAPI Backend :8000</span>
            <span>•</span>
            <span>React Frontend :5173</span>
            <span>•</span>
            <span>ONNX Student Distillation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
