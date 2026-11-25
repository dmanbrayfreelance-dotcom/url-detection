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
    if (filterVerdict === "phishing") return matchesSearch && (log.verdict === "phishing" || log.is_phishing);
    if (filterVerdict === "legitimate") return matchesSearch && (log.verdict === "legitimate" || !log.is_phishing);
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-[#fcfdfd] rounded-[28px] border border-gray-100/90 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs">
                📜
              </span>
              Security Audit Logs
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Historical timeline of scanned URLs, model verdicts, and attention logs from MongoDB Atlas.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2 rounded-full bg-black hover:bg-gray-800 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-colors shadow-xs"
          >
            <span>↻</span>
            <span>Refresh Logs</span>
          </button>
        </div>

        {/* Filter bar with rounded-full search and pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <input
            type="text"
            placeholder="Search URLs by domain or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 bg-white text-gray-900 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black text-xs font-medium"
          />

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full border border-gray-200">
            {["all", "phishing", "legitimate"].map((v) => (
              <button
                key={v}
                onClick={() => setFilterVerdict(v)}
                className={`px-3.5 py-1 rounded-full text-xs capitalize font-semibold transition-all ${
                  filterVerdict === v ? "bg-black text-white shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto rounded-[22px] border border-gray-100 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-bold tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Target URL</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Engine</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 font-sans">
                    {loading ? "Loading audit logs..." : "No scan logs found."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const isPhish = log.verdict === "phishing" || log.is_phishing;
                  return (
                    <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isPhish
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          }`}
                        >
                          {isPhish ? "PHISH" : "CLEAN"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 truncate max-w-sm font-medium" title={log.url}>
                        {log.url}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={isPhish ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                          {((log.confidence || log.phishing_probability) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-500 font-sans text-[11px]">
                        {log.model_mode === "onnx_student" ? "ONNX" : "Teacher"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                        {log.latency_ms || log.inference_latency_ms} ms
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-400 font-sans text-[11px]">
                        {new Date(log.created_at || log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setInspectedScan(log)}
                          className="px-3 py-1 rounded-full bg-gray-100 hover:bg-black hover:text-white text-gray-700 text-xs font-bold border border-gray-200 transition-colors"
                        >
                          Heatmap
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspected Scan Modal Details */}
      {inspectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-gray-100 rounded-[32px] w-full max-w-4xl p-6 sm:p-7 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <span>Detailed Audit Inspection:</span>
                <span className="font-mono text-xs text-black bg-gray-100 px-3 py-1 rounded-full border border-gray-200 truncate max-w-md">
                  {inspectedScan.url}
                </span>
              </h3>
              <button
                onClick={() => setInspectedScan(null)}
                className="text-gray-400 hover:text-black w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                ✕
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
