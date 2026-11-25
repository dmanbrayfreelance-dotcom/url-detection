import React, { useState } from "react";

export default function TokenHeatmapView({ scanData }) {
  const [selectedToken, setSelectedToken] = useState(null);
  const [threshold, setThreshold] = useState(0.2);
  const [viewMode, setViewMode] = useState("badges"); // "badges" or "continuous"

  if (!scanData || !scanData.tokens || scanData.tokens.length === 0) {
    return (
      <div className="p-8 text-center bg-[#fcfdfd] rounded-[28px] border border-gray-100 text-gray-400">
        No token attention data available. Run an inspection to inspect the token heatmap.
      </div>
    );
  }

  const { tokens, phishing_probability, is_phishing, threat_level, url } = scanData;
  const maxWeightToken = tokens.reduce((max, t) => (t.attention_weight > max.attention_weight ? t : max), tokens[0]);

  // Color helper based on weight matching clean light design
  const getBadgeStyle = (weight) => {
    if (weight >= 0.75) {
      return "bg-red-50 text-red-700 border-red-200 shadow-xs";
    } else if (weight >= 0.5) {
      return "bg-orange-50 text-orange-700 border-orange-200";
    } else if (weight >= 0.25) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    } else {
      return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getHeatColor = (weight) => {
    if (weight >= 0.75) return "rgba(239, 68, 68, 0.25)";
    if (weight >= 0.5) return "rgba(249, 115, 22, 0.2)";
    if (weight >= 0.25) return "rgba(234, 179, 8, 0.15)";
    return "rgba(243, 244, 246, 0.8)";
  };

  return (
    <div className="bg-[#fcfdfd] rounded-[28px] border border-gray-100/90 p-6 shadow-sm space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-black animate-pulse" />
            <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
              Token-Level Attention Heatmap
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            IEEE TIFS 2025 Scaled Dot-Product Fusion Attention Weights (\(\alpha_t \in [0, 1]\))
          </p>
        </div>

        {/* View Switcher & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-gray-100 px-3.5 py-1.5 rounded-full border border-gray-200">
            <span className="text-[11px] font-semibold text-gray-500">Filter ≥</span>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-16 accent-black cursor-pointer h-1.5 bg-gray-300 rounded-lg"
            />
            <span className="text-[11px] font-mono font-bold text-gray-900 w-7">{Math.round(threshold * 100)}%</span>
          </div>

          <div className="inline-flex rounded-full bg-gray-100 p-1 border border-gray-200">
            <button
              onClick={() => setViewMode("badges")}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                viewMode === "badges"
                  ? "bg-black text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Token Badges
            </button>
            <button
              onClick={() => setViewMode("continuous")}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                viewMode === "continuous"
                  ? "bg-black text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Inline Raw URL
            </button>
          </div>
        </div>
      </div>

      {/* Main Heatmap Canvas */}
      {viewMode === "badges" ? (
        <div className="bg-white p-5 rounded-[22px] border border-gray-100 min-h-[140px] flex flex-wrap items-center gap-2 shadow-xs">
          {tokens.map((t, idx) => {
            const isFaded = t.attention_weight < threshold;
            const isSelected = selectedToken && selectedToken.index === t.index;
            return (
              <button
                key={idx}
                onClick={() => setSelectedToken(t)}
                className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs border transition-all duration-150 ${getBadgeStyle(
                  t.attention_weight
                )} ${
                  isFaded ? "opacity-35 hover:opacity-80 scale-95" : "scale-100 hover:scale-105"
                } ${isSelected ? "ring-2 ring-black ring-offset-2 ring-offset-white" : ""}`}
              >
                <span className="font-semibold">{t.token}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  {Math.round(t.attention_weight * 100)}%
                </span>
                {t.heat_tier === "critical" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-0.5" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-5 rounded-[22px] border border-gray-100 min-h-[140px] font-mono text-sm leading-relaxed break-all select-all shadow-xs text-gray-800">
          {tokens.map((t, idx) => {
            const isSelected = selectedToken && selectedToken.index === t.index;
            return (
              <span
                key={idx}
                onClick={() => setSelectedToken(t)}
                style={{ backgroundColor: getHeatColor(t.attention_weight) }}
                className={`cursor-pointer px-1 py-0.5 rounded transition-colors ${
                  isSelected ? "ring-2 ring-black" : "hover:brightness-95"
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
      <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-gray-400 font-semibold">Attention Severity:</span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-red-700">Critical (&gt;75%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-orange-700">High (50-75%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-amber-700">Moderate (25-50%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="text-gray-600">Low / Benign</span>
          </span>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Peak token:{" "}
          <span className="font-mono text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            {maxWeightToken?.token} ({Math.round((maxWeightToken?.attention_weight || 0) * 100)}%)
          </span>
        </div>
      </div>

      {/* Selected Token Inspector Card */}
      {selectedToken && (
        <div className="p-5 rounded-[22px] bg-white border border-gray-200 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-extrabold">
                Inspected Token
              </span>
              <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                "{selectedToken.token}"
              </span>
            </div>
            <button
              onClick={() => setSelectedToken(null)}
              className="text-gray-400 hover:text-gray-800 text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-full font-semibold transition-colors"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
            <div>
              <span className="text-gray-400 block text-[11px]">Category</span>
              <span className="font-bold text-gray-800 capitalize">{selectedToken.category}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Attention Weight</span>
              <span className="font-mono font-bold text-gray-900">
                {selectedToken.attention_weight.toFixed(4)} ({Math.round(selectedToken.attention_weight * 100)}%)
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Char Span</span>
              <span className="font-mono text-gray-700">
                [{selectedToken.start} : {selectedToken.end}]
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Heat Tier</span>
              <span
                className={`font-bold capitalize ${
                  selectedToken.heat_tier === "critical"
                    ? "text-red-600"
                    : selectedToken.heat_tier === "high"
                    ? "text-orange-600"
                    : selectedToken.heat_tier === "moderate"
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {selectedToken.heat_tier}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 block mb-1 font-semibold uppercase">Model Rationale:</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedToken.rationales.map((r, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200 text-xs font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
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
