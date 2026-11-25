import React, { useState } from "react";

export default function TokenHeatmapView({ scanData }) {
  const [selectedToken, setSelectedToken] = useState(null);
  const [threshold, setThreshold] = useState(0.2);
  const [viewMode, setViewMode] = useState("badges"); // "badges" or "continuous"

  if (!scanData || !scanData.tokens || scanData.tokens.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-900/60 rounded-xl border border-gray-800 text-gray-400">
        No token attention data available. Run an inspection to inspect the token heatmap.
      </div>
    );
  }

  const { tokens, phishing_probability, is_phishing, threat_level, url } = scanData;

  // Filter tokens exceeding current threshold
  const highlightedTokens = tokens.filter((t) => t.attention_weight >= threshold);
  const maxWeightToken = tokens.reduce((max, t) => (t.attention_weight > max.attention_weight ? t : max), tokens[0]);

  // Color helper based on weight
  const getBadgeStyle = (weight) => {
    if (weight >= 0.75) {
      return "bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.35)]";
    } else if (weight >= 0.5) {
      return "bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.25)]";
    } else if (weight >= 0.25) {
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
    } else {
      return "bg-gray-800/80 text-gray-300 border-gray-700/60";
    }
  };

  const getHeatColor = (weight) => {
    if (weight >= 0.75) return "rgba(239, 68, 68, 0.4)";
    if (weight >= 0.5) return "rgba(249, 115, 22, 0.35)";
    if (weight >= 0.25) return "rgba(234, 179, 8, 0.25)";
    return "rgba(55, 65, 81, 0.2)";
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-gray-800 p-6 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse" />
            <h3 className="text-lg font-bold text-white tracking-wide">
              Token-Level Attention Heatmap
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            IEEE TIFS 2025 Scaled Dot-Product Fusion Attention Weights (\(\alpha_t \in [0, 1]\))
          </p>
        </div>

        {/* View Switcher & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="text-xs text-gray-400">Filter ≥</span>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-20 accent-sky-400 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
            />
            <span className="text-xs font-mono text-sky-400 w-8">{Math.round(threshold * 100)}%</span>
          </div>

          <div className="inline-flex rounded-lg bg-gray-900 p-1 border border-gray-800">
            <button
              onClick={() => setViewMode("badges")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === "badges"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Token Badges
            </button>
            <button
              onClick={() => setViewMode("continuous")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === "continuous"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Inline Raw URL
            </button>
          </div>
        </div>
      </div>

      {/* Main Heatmap Canvas */}
      {viewMode === "badges" ? (
        <div className="bg-[#0b1120] p-5 rounded-lg border border-gray-800/80 min-h-[140px] flex flex-wrap items-center gap-2">
          {tokens.map((t, idx) => {
            const isFaded = t.attention_weight < threshold;
            const isSelected = selectedToken && selectedToken.index === t.index;
            return (
              <button
                key={idx}
                onClick={() => setSelectedToken(t)}
                className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs border transition-all duration-150 ${getBadgeStyle(
                  t.attention_weight
                )} ${
                  isFaded ? "opacity-35 hover:opacity-80 scale-95" : "scale-100 hover:scale-105"
                } ${isSelected ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-gray-900" : ""}`}
              >
                <span className="font-semibold">{t.token}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  {Math.round(t.attention_weight * 100)}%
                </span>
                {t.heat_tier === "critical" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping absolute -top-0.5 -right-0.5" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#0b1120] p-5 rounded-lg border border-gray-800/80 min-h-[140px] font-mono text-sm leading-relaxed break-all select-all">
          {tokens.map((t, idx) => {
            const isSelected = selectedToken && selectedToken.index === t.index;
            return (
              <span
                key={idx}
                onClick={() => setSelectedToken(t)}
                style={{ backgroundColor: getHeatColor(t.attention_weight) }}
                className={`cursor-pointer px-0.5 py-1 rounded transition-colors ${
                  isSelected ? "ring-2 ring-sky-400" : "hover:brightness-125"
                }`}
                title={`Token: ${t.token} | Weight: ${t.attention_weight}`}
              >
                {t.token}
              </span>
            );
          })}
        </div>
      )}

      {/* Heatmap Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-800/60">
        <div className="flex items-center gap-4">
          <span className="text-gray-500 font-medium">Attention Severity:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
            <span className="text-red-400">Critical (&gt;75%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-orange-400">High (50-75%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-yellow-400">Moderate (25-50%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
            <span className="text-gray-400">Low / Benign</span>
          </span>
        </div>

        <div className="text-xs text-gray-400">
          Peak token:{" "}
          <span className="font-mono text-red-400 font-bold bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/50">
            {maxWeightToken?.token} ({Math.round((maxWeightToken?.attention_weight || 0) * 100)}%)
          </span>
        </div>
      </div>

      {/* Selected Token Inspector Card */}
      {selectedToken && (
        <div className="mt-4 p-4 rounded-lg bg-gray-900/90 border border-sky-500/40 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-sky-400 font-bold">
                Inspected Token
              </span>
              <span className="font-mono text-sm font-bold text-white bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                "{selectedToken.token}"
              </span>
            </div>
            <button
              onClick={() => setSelectedToken(null)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-gray-800 rounded"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
            <div>
              <span className="text-gray-500 block">Category</span>
              <span className="font-semibold text-gray-200 capitalize">{selectedToken.category}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Attention Weight</span>
              <span className="font-mono font-bold text-sky-400">
                {selectedToken.attention_weight.toFixed(4)} ({Math.round(selectedToken.attention_weight * 100)}%)
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Char Span</span>
              <span className="font-mono text-gray-300">
                [{selectedToken.start} : {selectedToken.end}] ({selectedToken.end - selectedToken.start} chars)
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Heat Tier</span>
              <span
                className={`font-bold capitalize ${
                  selectedToken.heat_tier === "critical"
                    ? "text-red-400"
                    : selectedToken.heat_tier === "high"
                    ? "text-orange-400"
                    : selectedToken.heat_tier === "moderate"
                    ? "text-yellow-400"
                    : "text-emerald-400"
                }`}
              >
                {selectedToken.heat_tier}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-800/80">
            <span className="text-[11px] text-gray-400 block mb-1 font-medium">Model Rationale:</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedToken.rationales.map((r, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-950/40 text-sky-300 border border-sky-800/50 text-xs"
                >
                  <span className="w-1 h-1 rounded-full bg-sky-400" />
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
