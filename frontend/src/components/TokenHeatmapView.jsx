import React, { useState } from "react";

export default function TokenHeatmapView({ scanData }) {
  const [selectedToken, setSelectedToken] = useState(null);
  const [threshold, setThreshold] = useState(0.2);
  const [viewMode, setViewMode] = useState("badges"); // "badges" or "continuous"
  const [showArchModal, setShowArchModal] = useState(false);

  if (!scanData || !scanData.tokens || scanData.tokens.length === 0) {
    return (
      <div className="p-8 text-center bg-[#fcfdfd] rounded-[28px] border border-gray-100 text-gray-400">
        No token attention data available. Run an inspection to inspect the token heatmap.
      </div>
    );
  }

  const { tokens, phishing_probability, is_phishing, threat_level, url, inference_mode, inference_latency_ms } = scanData;
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

      {/* Side-by-Side Model Mode Comparison (Teacher Attention vs ONNX Student) */}
      <div className="bg-white rounded-[22px] p-4 border border-gray-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-900 uppercase tracking-wide">
              ⚡ Multi-Embedding Architecture & Mode Comparison
            </span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-200">
              IEEE TIFS 2025
            </span>
          </div>
          <button
            onClick={() => setShowArchModal(!showArchModal)}
            className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>{showArchModal ? "Hide Layer Specs ▲" : "View Full Layer Specs ▼"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Mode 1: Teacher Model */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            inference_mode === "teacher_attention"
              ? "bg-black text-white border-black shadow-sm"
              : "bg-gray-50 text-gray-800 border-gray-200"
          }`}>
            <div className="flex items-center justify-between pb-1.5 border-b border-white/20">
              <span className="font-extrabold flex items-center gap-1.5">
                <span>🧠</span>
                <span>Teacher Model (Full Attention)</span>
              </span>
              {inference_mode === "teacher_attention" && (
                <span className="text-[9px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full">
                  CURRENT SCAN
                </span>
              )}
            </div>
            <div className="mt-2 space-y-1 text-[11px] opacity-90">
              <p>• <strong>Multi-Embedding:</strong> Word2Vec + FastText + GloVe (300d) + BERT/RoBERTa/GPT-2/XLM-R (128d) = 428-dim</p>
              <p>• <strong>Attention:</strong> Scaled Dot-Product Fusion Attention Q, K, V</p>
              <p>• <strong>Classifier:</strong> Dual Conv1D (128 filters, k=3, ReLU) ➔ GlobalMaxPool ➔ Dense 256/128 ➔ Sigmoid</p>
              <p>• <strong>Explainability:</strong> Full Token Weight Vector \(\alpha_t\)</p>
            </div>
          </div>

          {/* Mode 2: Student ONNX Model */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            inference_mode === "onnx_student"
              ? "bg-black text-white border-black shadow-sm"
              : "bg-gray-50 text-gray-800 border-gray-200"
          }`}>
            <div className="flex items-center justify-between pb-1.5 border-b border-white/20">
              <span className="font-extrabold flex items-center gap-1.5">
                <span>⚡</span>
                <span>Student Model (ONNX Quantized)</span>
              </span>
              {inference_mode === "onnx_student" && (
                <span className="text-[9px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full">
                  CURRENT SCAN
                </span>
              )}
            </div>
            <div className="mt-2 space-y-1 text-[11px] opacity-90">
              <p>• <strong>Knowledge Distillation:</strong> L_KD = T² · KL(Teacher || Student) + (1-α) · BCE</p>
              <p>• <strong>Execution Engine:</strong> ONNX Runtime edge inference</p>
              <p>• <strong>Latency Speed:</strong> &lt; 9.5 ms per URL (50x faster than raw Transformer)</p>
              <p>• <strong>Target Client:</strong> Chrome Browser Extension & High-Throughput Gateways</p>
            </div>
          </div>
        </div>

        {/* Expandable Layer-by-Layer Architectural Pipeline Specs */}
        {showArchModal && (
          <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-2">
            <span className="font-bold text-gray-900 block">🔬 Neural Pipeline Flow (IEEE Paper Exact Implementation):</span>
            <div className="font-mono text-[11px] bg-white p-3 rounded-lg border border-gray-200 space-y-1 overflow-x-auto">
              <div>[Input URL] ➔ Preprocessing, Delimiter Segmentation & Stopword Removal</div>
              <div>[Static Space] ➔ Word2Vec (100d) + FastText n-grams (100d) + GloVe (100d)</div>
              <div>[Transformer Space] ➔ BERT (128d) + RoBERTa + GPT-2 + Multilingual XLM-RoBERTa</div>
              <div>[Concatenation] ➔ Fused Tensor E [Sequence_Length × 428-dim]</div>
              <div>[Fusion Attention] ➔ Softmax((Q · K^T) / √d_k) · V (Dynamic Token Weights α_t)</div>
              <div>[Convolutional Head] ➔ Conv1D(128, k=3, ReLU) ➔ Conv1D(128, k=3, ReLU) ➔ GlobalMaxPooling1D</div>
              <div>[Dense Classifier] ➔ Dense(256) ➔ Dropout(0.2) ➔ Dense(128) ➔ Sigmoid Probability (0.0 to 1.0)</div>
              <div>[Edge Distillation] ➔ Quantized to ONNX Student (&lt;9.5ms, ~12MB) for browser extension</div>
            </div>
          </div>
        )}
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
