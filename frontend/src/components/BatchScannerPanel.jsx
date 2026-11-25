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
  const [filter, setFilter] = useState("all");
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
      "Verdict",
      "Probability",
      "Latency_ms",
      "Threat_Indicators"
    ];
    const rows = batchResults.results.map((r) => [
      `"${r.id}"`,
      `"${r.url}"`,
      `"${r.verdict || (r.is_phishing ? 'phishing' : 'legitimate')}"`,
      r.phishing_probability,
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
    <div className="bg-[#fcfdfd] rounded-[28px] border border-gray-100/90 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs">
              ⚡
            </span>
            Batch URL Threat Scanner
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Bulk threat inspection using distilled ONNX student model (&lt;10ms/URL) or teacher model.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 px-3.5 py-1.5 rounded-full border border-gray-200">
          <label className="text-[11px] font-semibold text-gray-500">Engine:</label>
          <select
            value={inferenceMode}
            onChange={(e) => setInferenceMode(e.target.value)}
            className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
          >
            <option value="onnx_student">ONNX Student (&lt;10ms)</option>
            <option value="teacher_attention">Teacher Attention</option>
          </select>
        </div>
      </div>

      {/* Input Textarea & File Upload */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 space-y-2">
          <label className="text-xs font-bold text-gray-700 block">
            Target URL List (one URL per line)
          </label>
          <textarea
            rows={6}
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            placeholder="https://example.com&#10;https://suspicious-login.com"
            className="w-full bg-white text-gray-800 font-mono text-xs p-4 rounded-[20px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black shadow-xs"
          />
        </div>

        <div className="space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              Upload CSV / TXT
            </label>
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 hover:border-black rounded-[20px] cursor-pointer bg-white transition-colors">
              <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-[11px] text-gray-500 font-semibold">Click to upload CSV</span>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <button
            type="button"
            onClick={handleRunBatch}
            disabled={loading}
            className="w-full py-3 rounded-full bg-black hover:bg-gray-800 text-white font-bold text-xs shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Scanning Batch...</span>
              </>
            ) : (
              <>
                <span>Execute Batch Inspection</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-full text-xs text-red-700 px-5">
          {errorMsg}
        </div>
      )}

      {/* Batch Stats Summary Cards matching reference */}
      {batchResults && (
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-xs text-center">
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Total Scanned</span>
              <span className="text-xl font-black text-gray-900 mt-1 block">{batchResults.total_urls}</span>
            </div>
            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-xs text-center">
              <span className="text-[10px] text-red-500 font-semibold block uppercase">Phishing Detected</span>
              <span className="text-xl font-black text-red-600 mt-1 block">{batchResults.phishing_count}</span>
            </div>
            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-xs text-center">
              <span className="text-[10px] text-emerald-600 font-semibold block uppercase">Legitimate Clean</span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">{batchResults.legitimate_count}</span>
            </div>
            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-xs text-center">
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Avg Latency / URL</span>
              <span className="text-xl font-black text-gray-900 mt-1 block">{batchResults.avg_latency_ms} ms</span>
            </div>
          </div>

          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-full border border-gray-200">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-xs rounded-full font-bold transition-all ${
                  filter === "all" ? "bg-black text-white shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                All ({batchResults.total_urls})
              </button>
              <button
                onClick={() => setFilter("phishing")}
                className={`px-3 py-1 text-xs rounded-full font-bold transition-all ${
                  filter === "phishing" ? "bg-black text-white shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Phishing ({batchResults.phishing_count})
              </button>
              <button
                onClick={() => setFilter("legitimate")}
                className={`px-3 py-1 text-xs rounded-full font-bold transition-all ${
                  filter === "legitimate" ? "bg-black text-white shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Clean ({batchResults.legitimate_count})
              </button>
            </div>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black hover:bg-gray-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <span>Download CSV Report</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto max-h-96 rounded-[22px] border border-gray-100 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4">URL</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Key Threat Signals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-mono">
                {filteredItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.is_phishing
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}
                      >
                        {item.is_phishing ? "PHISHING" : "LEGITIMATE"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 truncate max-w-xs font-medium" title={item.url}>
                      {item.url}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={item.is_phishing ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                        {(item.phishing_probability * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                      {item.inference_latency_ms} ms
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-sans truncate max-w-sm" title={(item.threat_indicators || []).join(", ")}>
                      {(item.threat_indicators && item.threat_indicators.length > 0)
                        ? item.threat_indicators[0]
                        : "Verified standard lexical pattern"}
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
