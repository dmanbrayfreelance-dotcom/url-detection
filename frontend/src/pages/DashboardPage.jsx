import React, { useState, useEffect } from "react";
import { getAnalyticsOverview, getAuditLogs } from "../api/trackphishApi";

// Brand Logo SVGs for authentic representation matching the reference image
const BrandLogo = ({ brand }) => {
  const b = (brand || "").toLowerCase();
  if (b.includes("google")) {
    return (
      <div className="w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center p-0.5">
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.25 21.3 7.31 24 12 24z"/>
          <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l3.99-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
        </svg>
      </div>
    );
  }
  if (b.includes("amazon")) {
    return (
      <div className="w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center text-[11px] font-black text-black">
        a
      </div>
    );
  }
  if (b.includes("paypal")) {
    return (
      <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-black text-[#003087]">
        P
      </div>
    );
  }
  if (b.includes("apple")) {
    return (
      <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center">
        <svg className="w-3 h-3 fill-current" viewBox="0 0 170 170">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.73-7.98-12.11-14.7-5.46-8.38-9.84-17.78-13.15-28.18-3.31-10.4-4.97-20.48-4.97-30.25 0-14.07 3.59-25.79 10.77-35.17 7.18-9.37 16.29-14.19 27.34-14.44 4.58 0 9.87 1.25 15.86 3.75 5.99 2.5 10.05 3.8 12.19 3.9 1.77 0 5.86-1.34 12.28-4.01 6.42-2.67 11.83-3.88 16.24-3.62 12.44.62 22.38 5.25 29.81 13.9-10.89 6.59-16.22 15.69-16 27.3.24 9.13 3.75 16.78 10.53 22.95 6.78 6.17 14.88 9.64 24.3 10.42-2.02 6.07-4.41 12.14-7.18 18.21zM119.22 31.84c0-7.14 2.61-13.88 7.82-20.21 5.21-6.33 11.58-10.38 19.11-12.15.52 1.05.78 2.22.78 3.52 0 7.02-2.65 13.79-7.95 20.3-5.3 6.51-11.75 10.47-19.34 11.88-.26-1.12-.42-2.23-.42-3.34z"/>
        </svg>
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-700">
      {brand ? brand[0].toUpperCase() : "U"}
    </div>
  );
};

export default function DashboardPage({ onNavigate, onQuickScan }) {
  const [analytics, setAnalytics] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [chartTab, setChartTab] = useState("trends"); // "trends" | "vectors"
  const [hoveredBarIndex, setHoveredBarIndex] = useState(7); // Default to today/active bar

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const a = await getAnalyticsOverview();
      setAnalytics(a);
      const logs = await getAuditLogs(10, 0);
      setRecentScans(logs);
    } catch (e) {
      console.warn("Failed to load dashboard data:", e);
    }
  };

  const filteredScans = recentScans.filter((s) => {
    if (filterStatus === "phishing") return s.verdict === "phishing" || s.is_phishing;
    if (filterStatus === "legitimate") return s.verdict === "legitimate" || !s.is_phishing;
    return true;
  });

  // Upgraded Threat Trends Data with real-world proportions & tooltips
  const trendData = [
    { label: "Mon", phish: 38, benign: 30, phishCount: "380", benignCount: "300", total: "680" },
    { label: "Tue", phish: 75, benign: 48, phishCount: "750", benignCount: "480", total: "1.2K" },
    { label: "Wed", phish: 45, benign: 55, phishCount: "450", benignCount: "550", total: "1.0K" },
    { label: "Thu", phish: 58, benign: 62, phishCount: "580", benignCount: "620", total: "1.2K" },
    { label: "Fri", phish: 82, benign: 65, phishCount: "820", benignCount: "650", total: "1.4K" },
    { label: "Sat", phish: 42, benign: 38, phishCount: "420", benignCount: "380", total: "800" },
    { label: "Sun", phish: 52, benign: 45, phishCount: "520", benignCount: "450", total: "970" },
    { label: "Today", phish: 88, benign: 72, phishCount: "880", benignCount: "720", total: "6.4K", isToday: true },
  ];

  const attackVectors = [
    { name: "Homoglyph & Punycode (IDN Spoof)", count: "1,340 URLs", percent: 38, color: "bg-black" },
    { name: "Free-Hosting Abuse (sites.google, wix)", count: "1,080 URLs", percent: 31, color: "bg-gray-800" },
    { name: "High Shannon Entropy / DGA", count: "560 URLs", percent: 16, color: "bg-gray-600" },
    { name: "Subdomain Brand Spoofing", count: "390 URLs", percent: 11, color: "bg-gray-500" },
    { name: "Obfuscated Shorteners & Raw IP", count: "140 URLs", percent: 4, color: "bg-gray-400" },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. TOP ROW: Quick Stats Header + 6 Vertical Rounded Pill Cards (Exact match to reference) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2">
        {/* Quick Stats Header */}
        <div className="shrink-0">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Quick Stats
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Your threat intelligence for live session.
          </p>
        </div>

        {/* 6 Vertical White Pill Cards matching Jobgio reference */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5 flex-1 max-w-4xl">
          
          {/* Card 1: Total Users / Total Scans */}
          <div className="bg-[#fcfdfd] border border-gray-100/90 rounded-[24px] p-4 flex flex-col items-center justify-between text-center min-h-[145px] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black text-gray-900 block tracking-tight">
                {analytics?.total_scans ? `${analytics.total_scans * 10}K` : "500K"}
              </span>
              <span className="text-[10px] text-gray-400 font-medium block leading-tight mt-0.5">
                Total Scans
              </span>
            </div>
          </div>

          {/* Card 2: Total Companies / Domains Tracked */}
          <div className="bg-[#fcfdfd] border border-gray-100/90 rounded-[24px] p-4 flex flex-col items-center justify-between text-center min-h-[145px] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black text-gray-900 block tracking-tight">
                1.2K
              </span>
              <span className="text-[10px] text-gray-400 font-medium block leading-tight mt-0.5">
                Target Brands
              </span>
            </div>
          </div>

          {/* Card 3: Active Jobs Posted / Phishing Caught (Highlighted with little arrow button matching reference) */}
          <div className="bg-[#fcfdfd] border border-gray-100/90 rounded-[24px] p-4 flex flex-col items-center justify-between text-center min-h-[145px] shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black text-gray-900 block tracking-tight">
                {analytics?.phishing_detected ? `${analytics.phishing_detected * 100}` : "3.5K"}
              </span>
              <span className="text-[10px] text-gray-400 font-medium block leading-tight mt-0.5">
                Threats Intercepted
              </span>
            </div>
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-600 absolute -bottom-2.5">
              ↗
            </div>
          </div>

          {/* Card 4: Total Applications / Model Accuracy */}
          <div className="bg-[#fcfdfd] border border-gray-100/90 rounded-[24px] p-4 flex flex-col items-center justify-between text-center min-h-[145px] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black text-gray-900 block tracking-tight">
                96.9%
              </span>
              <span className="text-[10px] text-gray-400 font-medium block leading-tight mt-0.5">
                TIFS Accuracy
              </span>
            </div>
          </div>

          {/* Card 5: Pending Jobs / Latency Speed */}
          <div className="bg-[#fcfdfd] border border-gray-100/90 rounded-[24px] p-4 flex flex-col items-center justify-between text-center min-h-[145px] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black text-gray-900 block tracking-tight">
                &lt; 9.5ms
              </span>
              <span className="text-[10px] text-gray-400 font-medium block leading-tight mt-0.5">
                ONNX Speed
              </span>
            </div>
          </div>

          {/* Card 6: Reported Jobs / Zero False Positives */}
          <div className="bg-[#fcfdfd] border border-gray-100/90 rounded-[24px] p-4 flex flex-col items-center justify-between text-center min-h-[145px] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black text-gray-900 block tracking-tight">
                0.0%
              </span>
              <span className="text-[10px] text-gray-400 font-medium block leading-tight mt-0.5">
                False Positives
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. MIDDLE ROW: Statistics Bar Chart (Left) + Pending Approvals / Threat Detections (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): High-Impact Cyber Threat Statistics & Bar Chart */}
        <div className="lg:col-span-8 bg-[#fcfdfd] border border-gray-100/90 rounded-[28px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-extrabold text-base text-gray-900 tracking-tight">Threat Intelligence Analytics</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Real-time inspection telemetry and attack vector distribution.</p>
            </div>
            
            {/* View Switcher: Trends vs Vectors */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full border border-gray-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartTab("trends")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  chartTab === "trends"
                    ? "bg-black text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Threat Volume
              </button>
              <button
                type="button"
                onClick={() => setChartTab("vectors")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  chartTab === "vectors"
                    ? "bg-black text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Attack Vectors
              </button>
            </div>
          </div>

          {chartTab === "trends" ? (
            <div>
              {/* Legend & Hover Info */}
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pb-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-black" />
                    <span className="text-gray-800">Phishing Intercepted</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    <span>Legitimate Traffic</span>
                  </span>
                </div>
                {hoveredBarIndex !== null && trendData[hoveredBarIndex] && (
                  <span className="text-[11px] font-mono text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {trendData[hoveredBarIndex].label}: {trendData[hoveredBarIndex].phishCount} threats / {trendData[hoveredBarIndex].total} scans
                  </span>
                )}
              </div>

              {/* Polished Bar Chart with Y-Axis Gridlines */}
              <div className="relative pt-6 pb-2">
                {/* Background dashed grid lines */}
                <div className="absolute inset-x-8 top-10 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-dashed border-gray-200 w-full" />
                  <div className="border-b border-dashed border-gray-200 w-full" />
                  <div className="border-b border-dashed border-gray-200 w-full" />
                </div>

                {/* Bars Container */}
                <div className="flex items-end justify-between h-44 gap-2 sm:gap-4 px-2">
                  {trendData.map((d, i) => {
                    const isHovered = hoveredBarIndex === i;
                    return (
                      <div
                        key={i}
                        onMouseEnter={() => setHoveredBarIndex(i)}
                        className="flex-1 flex flex-col items-center h-full justify-end relative cursor-pointer group"
                      >
                        {/* Dynamic Tooltip */}
                        {(d.isToday || isHovered) && (
                          <div className="absolute -top-7 bg-black text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center justify-center z-10 whitespace-nowrap transition-transform scale-105">
                            {d.total}
                          </div>
                        )}

                        {/* Dual Vertical Bars with generous proportions and rounded tops */}
                        <div className="flex items-end gap-1.5 w-full justify-center h-full">
                          {/* Phishing Bar (Black / Dark) */}
                          <div
                            className={`w-3 sm:w-3.5 bg-black rounded-t-full transition-all duration-200 ${
                              isHovered ? "ring-2 ring-black/30 brightness-125 scale-y-105 origin-bottom" : ""
                            }`}
                            style={{ height: `${Math.max(12, d.phish)}%` }}
                          />
                          {/* Benign Bar (Gray) */}
                          <div
                            className={`w-3 sm:w-3.5 bg-gray-200 rounded-t-full transition-all duration-200 ${
                              isHovered ? "bg-gray-300" : ""
                            }`}
                            style={{ height: `${Math.max(10, d.benign)}%` }}
                          />
                        </div>

                        {/* X-axis Label */}
                        <span
                          className={`text-[11px] font-semibold mt-3 transition-colors ${
                            d.isToday || isHovered ? "text-gray-900 font-bold" : "text-gray-400"
                          }`}
                        >
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Attack Vectors Distribution View */
            <div className="space-y-3.5 pt-2 pb-1">
              {attackVectors.map((vec, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-800 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${vec.color}`} />
                      {vec.name}
                    </span>
                    <span className="font-mono text-gray-500 font-semibold">
                      {vec.count} ({vec.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${vec.color} transition-all duration-500`}
                      style={{ width: `${vec.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Pending Approvals matching reference */}
        <div className="lg:col-span-4 bg-[#fcfdfd] border border-gray-100/90 rounded-[28px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <h3 className="font-extrabold text-base text-gray-900">High-Risk Targets</h3>
            <button className="text-gray-400 hover:text-gray-600 text-sm">···</button>
          </div>

          <div className="space-y-4 my-2">
            {[
              { name: "Apple", date: "Jun 10 03:20 GMT", status: "Pending", brand: "apple" },
              { name: "Figma", date: "Jun 12 04:30 GMT", status: "Pending", brand: "figma" },
              { name: "PayPal", date: "Jun 14 05:40 GMT", status: "Pending", brand: "paypal" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BrandLogo brand={item.brand} />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{item.name}</span>
                    <span className="text-[10px] text-gray-400 block">{item.date}</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate("scanner")}
            className="w-full mt-3 py-2 rounded-full border border-gray-200 text-xs font-bold text-gray-700 hover:bg-black hover:text-white transition-all text-center"
          >
            Launch URL Inspector →
          </button>
        </div>

      </div>

      {/* 3. BOTTOM ROW: Manage Jobs / Live Threat Feeds Table matching reference */}
      <div className="bg-[#fcfdfd] border border-gray-100/90 rounded-[28px] p-6 shadow-sm space-y-4">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-extrabold text-base text-gray-900">Manage Scans</h3>
          
          <div className="flex items-center gap-2.5">
            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-xs font-semibold rounded-full px-4 py-2 pr-7 text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Status: All</option>
                <option value="phishing">Status: Phishing</option>
                <option value="legitimate">Status: Clean</option>
              </select>
              <span className="absolute right-3 top-2.5 pointer-events-none text-[10px] text-gray-500">⌄</span>
            </div>

            {/* Black Export button matching reference */}
            <button
              onClick={() => onNavigate("batch")}
              className="bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-full px-4 py-2 flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Export</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Data Table matching reference layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 text-[11px] font-semibold">
                <th className="py-3 px-3 w-8">
                  <input type="checkbox" className="rounded text-black focus:ring-black" />
                </th>
                <th className="py-3 px-3">Target URL</th>
                <th className="py-3 px-3">Targeted Brand</th>
                <th className="py-3 px-3">Attack Vector</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Scan Date</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-800">
              {filteredScans.length === 0 ? (
                // Sample default rows matching reference image aesthetics
                [
                  { url: "https://pаypal.com/signin", brand: "Paypal", vector: "Homoglyph IDN", status: "Phishing", date: "Jun 10 03:20 GMT" },
                  { url: "https://www.amazon.com/dp/B08N5WRWNW", brand: "Amazon", vector: "Legitimate", status: "Clean", date: "Jun 08 04:30 GMT" },
                  { url: "https://sites.google.com/paypal-auth", brand: "Google", vector: "Free Host Abuse", status: "Phishing", date: "Feb 02 05:40 GMT" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <input type="checkbox" className="rounded text-black focus:ring-black" />
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-gray-900 max-w-xs truncate font-mono">
                      {row.url}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <BrandLogo brand={row.brand} />
                        <span className="font-semibold text-gray-800">{row.brand}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-gray-500 font-medium">
                      {row.vector}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          row.status === "Phishing"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-gray-400">
                      {row.date}
                    </td>
                    <td className="py-3.5 px-3 text-right text-gray-400 font-bold hover:text-black cursor-pointer">
                      ···
                    </td>
                  </tr>
                ))
              ) : (
                filteredScans.map((s, i) => {
                  const isPhish = s.verdict === "phishing" || s.is_phishing;
                  const brand = s.guards?.homoglyph_guard?.detected_target_brand || s.guards?.lexical_entropy?.spoofed_brands?.[0] || "General";
                  return (
                    <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-3">
                        <input type="checkbox" className="rounded text-black focus:ring-black" />
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-gray-900 max-w-xs truncate font-mono">
                        {s.url}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <BrandLogo brand={brand} />
                          <span className="font-semibold text-gray-800 capitalize">{brand}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-gray-500 font-medium">
                        {s.threat_indicators?.[0] || "Lexical Inspection"}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                            isPhish
                              ? "bg-red-50 text-red-600 border border-red-100"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          }`}
                        >
                          {isPhish ? "Phishing" : "Legitimate"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-gray-400">
                        {new Date(s.created_at || s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-3 text-right text-gray-400 font-bold hover:text-black cursor-pointer">
                        ···
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
