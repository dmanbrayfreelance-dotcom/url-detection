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
    <div className="bg-[#fcfdfd] border border-gray-100/90 rounded-[28px] p-6 shadow-sm space-y-5">
      {/* Top Banner & Mode Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs">
              🔍
            </span>
            Zero-Live-Visit URL Inspector
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Lexical multi-embedding attention analysis without visiting suspicious live sites or querying external DNS.
          </p>
        </div>

        {/* Dual Mode Switcher matching reference pill design */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-full border border-gray-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setInferenceMode("teacher_attention")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              inferenceMode === "teacher_attention"
                ? "bg-black text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>Teacher Attention</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
              inferenceMode === "teacher_attention" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
            }`}>
              Explainable
            </span>
          </button>
          <button
            type="button"
            onClick={() => setInferenceMode("onnx_student")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              inferenceMode === "onnx_student"
                ? "bg-black text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>ONNX Student</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
              inferenceMode === "onnx_student" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
            }`}>
              &lt;10ms
            </span>
          </button>
        </div>
      </div>

      {/* URL Input Form with modern rounded-full pill input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative flex items-center">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter URL to inspect (e.g. https://pаypal.com/signin)..."
            className="w-full bg-white text-gray-900 placeholder-gray-400 text-xs font-mono px-5 py-3.5 pr-32 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={loading || !urlInput.trim()}
            className="absolute right-1.5 px-6 py-2 rounded-full bg-black hover:bg-gray-800 text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-all flex items-center gap-2"
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

        {/* Quick Presets Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-gray-400 font-semibold mr-1">Presets:</span>
          {SAMPLE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(p.url)}
              className="text-[11px] px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </form>

      {/* Scan Summary Bar (if scan result available) */}
      {scanResult && (
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span
                className={`px-3.5 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 ${
                  scanResult.is_phishing
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${scanResult.is_phishing ? "bg-red-500" : "bg-emerald-500"}`} />
                {scanResult.threat_level.replace(/_/g, " ")}
              </span>

              <span className="text-gray-500">
                Probability:{" "}
                <strong className={scanResult.is_phishing ? "text-red-600 font-mono" : "text-emerald-600 font-mono"}>
                  {(scanResult.phishing_probability * 100).toFixed(1)}%
                </strong>
              </span>

              <span className="text-gray-500">
                Latency:{" "}
                <strong className="text-gray-900 font-mono">{scanResult.inference_latency_ms} ms</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenFeedback}
              className="text-gray-600 hover:text-black flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-xs font-semibold transition-colors"
            >
              <span>Feedback & Retrain</span>
              <span>↗</span>
            </button>
          </div>

          {/* Detailed Immediate Reason Banner */}
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
              scanResult.is_phishing
                ? "bg-red-50 border border-red-200 text-red-900"
                : "bg-emerald-50 border border-emerald-200 text-emerald-900"
            }`}
          >
            <span className="text-sm shrink-0 mt-0.5">
              {scanResult.is_phishing ? "🚨" : "🛡️"}
            </span>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold uppercase tracking-wide text-[11px]">
                  {scanResult.is_phishing ? "Why is this Phishing?" : "Verification Status:"}
                </span>
                <span className="text-[10px] font-mono text-gray-500 font-semibold">
                  Zero-Live-Visit Proof
                </span>
              </div>
              <p className="font-medium text-[11px] leading-relaxed">
                {scanResult.is_phishing
                  ? (scanResult.threat_indicators?.[0] ||
                    (scanResult.homoglyph_analysis?.is_homoglyph_attack
                      ? "Detected confusable homoglyph characters impersonating a legitimate brand."
                      : scanResult.free_host_analysis?.is_free_hosting
                      ? `Abuse of free site hosting (${scanResult.free_host_analysis.matched_free_host}) with credential harvesting subpaths.`
                      : scanResult.lexical_analysis?.is_brand_spoof
                      ? `Unauthorized brand impersonation targeting ${scanResult.lexical_analysis.spoofed_brands?.join(", ")}.`
                      : "Multi-embedding attention layers flagged adversarial keyword patterns and entropy anomalies."))
                  : "URL matches verified benign infrastructure. Zero homoglyphs, standard entropy, and safe attention weights."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
