import React, { useState } from "react";
import DashboardPage from "./pages/DashboardPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import BatchScannerPanel from "./components/BatchScannerPanel";
import UrlScannerCard from "./components/UrlScannerCard";
import TokenHeatmapView from "./components/TokenHeatmapView";
import RiskBreakdownCard from "./components/RiskBreakdownCard";
import PhishingReasonCard from "./components/PhishingReasonCard";
import FeedbackModal from "./components/FeedbackModal";
import { scanUrl } from "./api/trackphishApi";

export default function App() {
  const [currentTab, setCurrentTab] = useState("dashboard"); // dashboard, scanner, batch, audit
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleScan = async (url, mode) => {
    setLoading(true);
    try {
      const data = await scanUrl(url, mode);
      setScanResult(data);
    } catch (err) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: "scanner",
      label: "URL Scanner",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      id: "batch",
      label: "Batch Threats",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      id: "audit",
      label: "Audit Logs",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen py-6 px-3 sm:px-6 lg:px-8 flex items-center justify-center">
      {/* Outer Rounded White Container matching the reference image */}
      <div className="w-full max-w-[1380px] bg-white rounded-[32px] sm:rounded-[38px] shadow-2xl p-5 sm:p-8 flex flex-col lg:flex-row gap-6 border border-gray-100 min-h-[92vh]">
        
        {/* Left Sidebar (Exact layout matching Jobgio reference) */}
        <aside className="w-full lg:w-56 flex flex-col justify-between shrink-0 pb-2 border-b lg:border-b-0 lg:border-r border-gray-100 pr-0 lg:pr-6">
          <div className="space-y-8">
            {/* Logo matching Jobgio header */}
            <div className="flex items-center gap-2.5 px-2 pt-1 cursor-pointer" onClick={() => setCurrentTab("dashboard")}>
              <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white font-black text-base shadow-sm">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">
                TrackPhish
              </span>
            </div>

            {/* Navigation list */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-black text-white shadow-md shadow-black/10"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80"
                    }`}
                  >
                    <span className={isActive ? "text-white" : "text-gray-400"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User profile widget at bottom of sidebar matching reference */}
          <div className="pt-6 border-t border-gray-100 flex items-center gap-3 px-2">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="George"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
              />
              <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                12
              </span>
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-xs text-gray-900 block truncate">George</span>
              <span className="text-[11px] text-gray-400 block truncate">hello.designer@gmail.com</span>
            </div>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 overflow-x-hidden space-y-6">
          {currentTab === "dashboard" && (
            <DashboardPage
              onNavigate={(tab) => setCurrentTab(tab)}
              onQuickScan={(url) => {
                setCurrentTab("scanner");
                handleScan(url, "teacher_attention");
              }}
            />
          )}

          {currentTab === "scanner" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <UrlScannerCard
                onScan={handleScan}
                loading={loading}
                scanResult={scanResult}
                onOpenFeedback={() => setFeedbackOpen(true)}
              />

              {scanResult && (
                <>
                  {/* Detailed Forensic Explanation of Phishing Reasons */}
                  <PhishingReasonCard scanData={scanResult} />
                  <TokenHeatmapView scanData={scanResult} />
                  <RiskBreakdownCard scanData={scanResult} />
                </>
              )}
            </div>
          )}

          {currentTab === "batch" && (
            <div className="animate-in fade-in duration-200">
              <BatchScannerPanel />
            </div>
          )}

          {currentTab === "audit" && (
            <div className="animate-in fade-in duration-200">
              <AuditLogsPage />
            </div>
          )}
        </main>
      </div>

      {/* Global Feedback Modal */}
      {feedbackOpen && scanResult && (
        <FeedbackModal
          isOpen={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          scanData={scanResult}
        />
      )}
    </div>
  );
}
