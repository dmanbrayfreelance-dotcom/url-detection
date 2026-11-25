import React, { useState } from "react";

const SAMPLE_PRESETS = [
  { label: "Homoglyph Attack (Cyrillic a)", url: "https://pаypal.com/signin-security-auth" },
  { label: "Free Hosting Brand Abuse", url: "https://paypal-verification.sites.google.com/view/secure-auth-login" },
  { label: "Brand Spoofing (Subdomain)", url: "https://chase-online.banking-secure-auth.xyz/signin?flow=92841" },
  { label: "IDN Punycode Attack", url: "https://www.xn--pple-43d.com/login" },
  { label: "Raw IP Host Obfuscation", url: "http://192.168.1.105:8080/paypal-login-portal/index.html" },
  { label: "Userinfo @ Redirection", url: "http://google.com@phishing-harvest-server.org/auth/login" },
  { label: "Legitimate Google", url: "https://www.google.com/" },
  { label: "Legitimate Amazon", url: "https://www.amazon.com/dp/B08N5WRWNW" },
  { label: "Legitimate GitHub", url: "https://github.com/torvalds/linux" }
];

export default function UrlScannerCard({ onScan, loading, scanResult, onOpenFeedback }) {
  const [urlInput, setUrlInput] = useState("https://pаypal.com/signin-security-auth");
  const [inferenceMode, setInferenceMode] = useState("teacher_attention");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onScan(urlInput.trim(), inferenceMode);
    }
  };

  const handlePresetSelect = (presetUrl) => {
    setUrlInput(presetUrl);
    onScan(presetUrl, inferenceMode);
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-gray-800 p-6 shadow-xl relative overflow-hidden">
      {/* Top Banner & Mode Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            Zero-Live-Visit URL Inspector
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Pure lexical, multi-embedding, and attention analysis without querying suspicious live sites or external DNS.
          </p>
        </div>

        {/* Dual Mode Switcher */}
        <div className="flex items-center gap-2 bg-gray-900/90 p-1.5 rounded-lg border border-gray-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setInferenceMode("teacher_attention")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              inferenceMode === "teacher_attention"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>Teacher Attention</span>
            <span className="text-[10px] bg-sky-950/60 text-sky-200 px-1.5 py-0.2 rounded border border-sky-700/40">
              Explainable
            </span>
          </button>
          <button
            type="button"
            onClick={() => setInferenceMode("onnx_student")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              inferenceMode === "onnx_student"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>ONNX Student</span>
            <span className="text-[10px] bg-emerald-950/60 text-emerald-200 px-1.5 py-0.2 rounded border border-emerald-700/40">
              &lt;10ms
            </span>
          </button>
        </div>
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="relative flex items-center">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter suspicious or legitimate URL to scan (e.g. https://pаypal.com/signin)..."
            className="w-full bg-[#0b1120] text-gray-100 placeholder-gray-500 text-sm font-mono px-4 py-3.5 pr-28 rounded-lg border border-gray-700/80 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !urlInput.trim()}
            className="absolute right-1.5 px-5 py-2.5 rounded-md bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <span>Inspect URL</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-gray-500 font-medium mr-1">Presets:</span>
          {SAMPLE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(p.url)}
              className="text-[11px] px-2.5 py-1 rounded bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border border-gray-700/50 hover:border-sky-500/50 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </form>

      {/* Scan Summary Bar (if scan result available) */}
      {scanResult && (
        <div className="mt-5 pt-4 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 ${
                scanResult.is_phishing
                  ? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.25)]"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${scanResult.is_phishing ? "bg-red-500" : "bg-emerald-500"}`} />
              {scanResult.threat_level.replace(/_/g, " ")}
            </span>

            <span className="text-gray-400">
              Probability:{" "}
              <strong className={scanResult.is_phishing ? "text-red-400 font-mono" : "text-emerald-400 font-mono"}>
                {(scanResult.phishing_probability * 100).toFixed(1)}%
              </strong>
            </span>

            <span className="text-gray-400">
              Latency:{" "}
              <strong className="text-sky-400 font-mono">{scanResult.inference_latency_ms} ms</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenFeedback}
            className="text-gray-400 hover:text-sky-300 flex items-center gap-1.5 px-3 py-1 rounded bg-gray-800 border border-gray-700 hover:border-sky-500/40 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Analyst Feedback</span>
          </button>
        </div>
      )}
    </div>
  );
}
