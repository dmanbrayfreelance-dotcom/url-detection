import React, { useState, useEffect } from "react";
import { getAuditLogs } from "../api/trackphishApi";
import TokenHeatmapView from "../components/TokenHeatmapView";
import RiskBreakdownCard from "../components/RiskBreakdownCard";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVerdict, setFilterVerdict] = useState("all");
  const [inspectedScan, setInspectedScan] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(100, 0);
      setLogs(data);
    } catch (e) {
      console.warn("Failed to load audit logs:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.url.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterVerdict === "phishing") return matchesSearch && log.is_phishing;
    if (filterVerdict === "legitimate") return matchesSearch && !log.is_phishing;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] rounded-xl border border-gray-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Security Audit Logs
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Historical timeline of scanned URLs, model verdicts, and attention logs.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <span>↻</span>
            <span>Refresh Logs</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <input
            type="text"
            placeholder="Search URLs by domain or token keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 bg-[#0b1120] text-gray-200 px-3 py-2 rounded-lg border border-gray-700/80 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />

          <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800">
            {["all", "phishing", "legitimate"].map((v) => (
              <button
                key={v}
                onClick={() => setFilterVerdict(v)}
                className={`px-3 py-1 rounded text-xs capitalize ${
                  filterVerdict === v ? "bg-gray-700 text-white font-bold" : "text-gray-400"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-800 bg-[#0b1120]">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Target URL</th>
                <th className="py-3 px-4">Prob</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 font-sans">
                    {loading ? "Loading audit logs..." : "No scan logs found."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-900/60 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.is_phishing
                            ? "bg-red-950 text-red-400 border border-red-800/60"
                            : "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                        }`}
                      >
                        {log.is_phishing ? "PHISH" : "CLEAN"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-200 truncate max-w-sm" title={log.url}>
                      {log.url}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={log.is_phishing ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                        {(log.phishing_probability * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-400 text-[11px]">
                      {log.inference_mode === "onnx_student" ? "ONNX" : "Teacher"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sky-400">
                      {log.inference_latency_ms} ms
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-500 font-sans text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setInspectedScan(log)}
                        className="px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-semibold border border-sky-500/30 transition-colors"
                      >
                        Heatmap Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspected Scan Modal Details */}
      {inspectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111827] border border-gray-800 rounded-xl w-full max-w-4xl p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Detailed Audit Inspection:</span>
                <span className="font-mono text-sm text-sky-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-800 truncate max-w-md">
                  {inspectedScan.url}
                </span>
              </h3>
              <button
                onClick={() => setInspectedScan(null)}
                className="text-gray-400 hover:text-white px-2 py-1 bg-gray-800 rounded"
              >
                ✕ Close
              </button>
            </div>

            <TokenHeatmapView scanData={inspectedScan} />
            <RiskBreakdownCard scanData={inspectedScan} />
          </div>
        </div>
      )}
    </div>
  );
}
