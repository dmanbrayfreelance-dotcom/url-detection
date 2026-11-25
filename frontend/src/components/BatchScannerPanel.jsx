import React, { useState } from "react";
import { batchScan, uploadBatchCsv } from "../api/trackphishApi";

const DEFAULT_BATCH_URLS = `https://pаypal.com/signin-security-auth
https://www.google.com/
https://paypal-verification.sites.google.com/view/secure-auth-login
https://github.com/torvalds/linux
https://chase-online.banking-secure-auth.xyz/signin?flow=92841
https://www.amazon.com/dp/B08N5WRWNW
https://www.xn--pple-43d.com/login
http://192.168.1.105:8080/paypal-login-portal/index.html
https://en.wikipedia.org/wiki/Machine_learning
https://bit.ly/3xXyZ1_chase_urgent_login`;

export default function BatchScannerPanel() {
  const [urlsText, setUrlsText] = useState(DEFAULT_BATCH_URLS);
  const [inferenceMode, setInferenceMode] = useState("onnx_student");
  const [loading, setLoading] = useState(false);
  const [batchResults, setBatchResults] = useState(null);
  const [filter, setFilter] = useState("all"); // "all", "phishing", "legitimate"
  const [errorMsg, setErrorMsg] = useState(null);

  const handleRunBatch = async () => {
    const lines = urlsText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setErrorMsg("Please provide at least one URL to scan.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await batchScan(lines, inferenceMode);
      setBatchResults(data);
    } catch (err) {
      setErrorMsg(err.message || "Batch scan failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await uploadBatchCsv(file, inferenceMode);
      setBatchResults(data);
    } catch (err) {
      setErrorMsg(err.message || "CSV upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!batchResults || !batchResults.results) return;

    const headers = [
      "ID",
      "URL",
      "Is_Phishing",
      "Probability",
      "Threat_Level",
      "Inference_Mode",
      "Latency_ms",
      "Threat_Indicators"
    ];
    const rows = batchResults.results.map((r) => [
      `"${r.id}"`,
      `"${r.url}"`,
      r.is_phishing ? 1 : 0,
      r.phishing_probability,
      `"${r.threat_level}"`,
      `"${r.inference_mode}"`,
      r.inference_latency_ms,
      `"${(r.threat_indicators || []).join(" | ")}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trackphish_batch_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredItems = (batchResults?.results || []).filter((r) => {
    if (filter === "phishing") return r.is_phishing;
    if (filter === "legitimate") return !r.is_phishing;
    return true;
  });

  return (
    <div className="bg-[#111827] rounded-xl border border-gray-800 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </span>
            Batch URL Threat Scanner
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Process bulk feeds (up to 500 URLs) using high-throughput ONNX distilled student model or teacher model.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Engine Mode:</label>
          <select
            value={inferenceMode}
            onChange={(e) => setInferenceMode(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-xs rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="onnx_student">ONNX Student (Fastest &lt;10ms)</option>
            <option value="teacher_attention">Teacher Attention (Explainability)</option>
          </select>
        </div>
      </div>

      {/* Input Textarea & File Upload */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 space-y-2">
          <label className="text-xs font-semibold text-gray-300 block">
            Target URL List (one URL per line)
          </label>
          <textarea
            rows={6}
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            placeholder="https://example.com&#10;https://suspicious-login.com"
            className="w-full bg-[#0b1120] text-gray-200 font-mono text-xs p-3 rounded-lg border border-gray-700/80 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>

        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 block">
              Upload CSV or Text File
            </label>
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-700 hover:border-sky-500 rounded-lg cursor-pointer bg-gray-900/50 transition-colors">
              <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-[11px] text-gray-400">Click to upload CSV</span>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <button
            type="button"
            onClick={handleRunBatch}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Scanning Batch...</span>
              </>
            ) : (
              <>
                <span>Execute Batch Inspection</span>
                <span>⚡</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Batch Stats Summary */}
      {batchResults && (
        <div className="pt-4 border-t border-gray-800 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-gray-900/90 p-3 rounded-lg border border-gray-800">
              <span className="text-[11px] text-gray-500 block">Total Scanned</span>
              <span className="text-xl font-bold font-mono text-white">{batchResults.total_urls}</span>
            </div>
            <div className="bg-red-950/20 p-3 rounded-lg border border-red-900/40">
              <span className="text-[11px] text-red-400 block">Phishing Detected</span>
              <span className="text-xl font-bold font-mono text-red-400">{batchResults.phishing_count}</span>
            </div>
            <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/40">
              <span className="text-[11px] text-emerald-400 block">Legitimate URLs</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{batchResults.legitimate_count}</span>
            </div>
            <div className="bg-gray-900/90 p-3 rounded-lg border border-gray-800">
              <span className="text-[11px] text-gray-500 block">Total Elapsed</span>
              <span className="text-xl font-bold font-mono text-sky-400">{batchResults.total_time_ms} ms</span>
            </div>
            <div className="bg-gray-900/90 p-3 rounded-lg border border-gray-800">
              <span className="text-[11px] text-gray-500 block">Avg Latency / URL</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{batchResults.avg_latency_ms} ms</span>
            </div>
          </div>

          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-lg border border-gray-800">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-xs rounded font-medium ${
                  filter === "all" ? "bg-gray-700 text-white" : "text-gray-400"
                }`}
              >
                All ({batchResults.total_urls})
              </button>
              <button
                onClick={() => setFilter("phishing")}
                className={`px-3 py-1 text-xs rounded font-medium ${
                  filter === "phishing" ? "bg-red-600 text-white" : "text-red-400"
                }`}
              >
                Phishing ({batchResults.phishing_count})
              </button>
              <button
                onClick={() => setFilter("legitimate")}
                className={`px-3 py-1 text-xs rounded font-medium ${
                  filter === "legitimate" ? "bg-emerald-600 text-white" : "text-emerald-400"
                }`}
              >
                Clean ({batchResults.legitimate_count})
              </button>
            </div>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download CSV Report</span>
            </button>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto max-h-96 rounded-lg border border-gray-800 bg-[#0b1120]">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-gray-800">
                <tr>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3">URL</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Key Threat Signals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {filteredItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-900/50">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.is_phishing
                            ? "bg-red-950 text-red-400 border border-red-800/60"
                            : "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                        }`}
                      >
                        {item.is_phishing ? "PHISHING" : "LEGITIMATE"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-200 truncate max-w-xs" title={item.url}>
                      {item.url}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={item.is_phishing ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                        {(item.phishing_probability * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-sky-400">
                      {item.inference_latency_ms} ms
                    </td>
                    <td className="py-2.5 px-3 text-gray-400 font-sans truncate max-w-sm" title={(item.threat_indicators || []).join(", ")}>
                      {(item.threat_indicators && item.threat_indicators.length > 0)
                        ? item.threat_indicators[0]
                        : "Clean URL patterns"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
