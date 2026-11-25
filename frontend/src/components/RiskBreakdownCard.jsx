import React from "react";

export default function RiskBreakdownCard({ scanData }) {
  if (!scanData) return null;

  const {
    phishing_probability,
    is_phishing,
    threat_level,
    threat_indicators,
    homoglyph_analysis,
    free_host_analysis,
    lexical_analysis
  } = scanData;

  const percent = Math.round(phishing_probability * 100);

  return (
    <div className="bg-[#fcfdfd] rounded-[28px] border border-gray-100/90 p-6 shadow-sm space-y-6">
      {/* Header & Gauge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs">
              📊
            </span>
            <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Algorithmic Risk Breakdown</h3>
          </div>
          <p className="text-xs text-gray-400">
            Multi-dimensional cybersecurity heuristics beyond the base TrackPhish paper.
          </p>
        </div>

        {/* Threat Level Badge & Progress Bar */}
        <div className="w-full md:w-80 bg-white p-4 rounded-[22px] border border-gray-100 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400 font-semibold">Risk Confidence</span>
            <span
              className={`text-sm font-black font-mono ${
                is_phishing ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {percent}% Phish Prob
            </span>
          </div>

          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percent >= 75
                  ? "bg-red-600"
                  : percent >= 50
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.max(4, percent)}%` }}
            />
          </div>

          <div className="mt-2 text-[10px] text-gray-400 flex justify-between font-medium">
            <span>Benign</span>
            <span className="font-bold text-gray-900">{threat_level.replace(/_/g, " ")}</span>
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* Threat Indicators Alert Box */}
      {threat_indicators && threat_indicators.length > 0 && (
        <div className="bg-red-50/70 border border-red-200/80 rounded-[22px] p-4">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-red-700">
            <span>⚠️</span>
            <span>Detected Threat Indicators ({threat_indicators.length})</span>
          </div>
          <ul className="space-y-1.5 text-xs text-red-800/90 pl-5 list-disc">
            {threat_indicators.map((ind, i) => (
              <li key={i} className="leading-relaxed font-medium">
                {ind}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid of the 3 Major Enhancements matching reference cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Guard 1: Multilingual IDN & Homoglyph Normalizer */}
        <div className="bg-white border border-gray-100 rounded-[24px] p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Homoglyph & IDN Guard
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  homoglyph_analysis.is_homoglyph_attack
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {homoglyph_analysis.is_homoglyph_attack ? "ATTACK DETECTED" : "CLEAN"}
              </span>
            </div>

            <div className="mt-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Punycode (xn--):</span>
                <span className="font-mono font-semibold text-gray-800">
                  {homoglyph_analysis.has_punycode ? "Yes (Decoded)" : "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mixed Scripts:</span>
                <span className="font-mono font-semibold text-gray-800">
                  {homoglyph_analysis.has_mixed_script ? "Yes (High Risk)" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Scripts Present:</span>
                <span className="font-mono font-bold text-gray-900">
                  {homoglyph_analysis.detected_scripts.join(", ") || "Latin"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Confusables Replaced:</span>
                <span className="font-mono font-bold text-red-600">
                  {homoglyph_analysis.confusable_count} chars
                </span>
              </div>

              {homoglyph_analysis.substitutions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Lookalike Diffs:</span>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {homoglyph_analysis.substitutions.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between font-mono text-[11px] bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                        <span className="text-red-600 font-bold">'{sub.original}'</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-emerald-700 font-bold">'{sub.normalized}'</span>
                        <span className="text-[10px] text-gray-400">{sub.script}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between items-center">
            <span>Homoglyph Risk Score:</span>
            <span className="font-mono font-black text-gray-900">
              {homoglyph_analysis.homoglyph_risk_score !== undefined
                ? Number(homoglyph_analysis.homoglyph_risk_score).toFixed(3)
                : "0.000"}
            </span>
          </div>
        </div>

        {/* Guard 2: Path-Aware Free Hosting & Shortener */}
        <div className="bg-white border border-gray-100 rounded-[24px] p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Free-Host & Shortener
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  free_host_analysis.free_hosting_risk_score >= 0.6
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {free_host_analysis.free_hosting_risk_score >= 0.6 ? "SUSPICIOUS" : "STANDARD"}
              </span>
            </div>

            <div className="mt-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Free Hosting Platform:</span>
                <span className="font-mono font-semibold text-gray-800">
                  {free_host_analysis.is_free_hosting
                    ? free_host_analysis.matched_free_host
                    : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">URL Shortener:</span>
                <span className="font-mono font-semibold text-gray-800">
                  {free_host_analysis.is_url_shortener
                    ? free_host_analysis.matched_shortener
                    : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">User Subdomain/Path:</span>
                <span className="font-mono text-gray-800 font-bold truncate max-w-[140px]" title={free_host_analysis.user_controlled_subdomain}>
                  {free_host_analysis.user_controlled_subdomain || "Root"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Impersonated Brands:</span>
                <span className="font-mono font-bold text-red-600">
                  {free_host_analysis.abused_brands.join(", ") || "None"}
                </span>
              </div>
              {free_host_analysis.is_url_shortener && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Slug Entropy:</span>
                  <span className="font-mono font-bold text-amber-600">
                    {free_host_analysis.shortener_slug_entropy} bits
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
            Path-Aware Risk Score:{" "}
            <span className="font-mono font-black text-gray-900">
              {free_host_analysis.free_hosting_risk_score.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Guard 3: Adversarial Lexical & Shannon Entropy */}
        <div className="bg-white border border-gray-100 rounded-[24px] p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Lexical & Entropy Engine
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  lexical_analysis.lexical_risk_score >= 0.5
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {lexical_analysis.lexical_risk_score >= 0.5 ? "ANOMALY" : "NORMAL"}
              </span>
            </div>

            <div className="mt-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Domain Entropy:</span>
                <span className="font-mono font-bold text-gray-900">
                  {lexical_analysis.shannon_entropy.domain.toFixed(2)} bits
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Raw IP Host:</span>
                <span className="font-mono font-semibold text-gray-800">
                  {lexical_analysis.is_ip_host ? "Yes (Critical Flag)" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">'@' Redirection Trick:</span>
                <span className="font-mono font-semibold text-gray-800">
                  {lexical_analysis.has_at_symbol ? "Yes (Deceptive)" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Brand Spoofing Flag:</span>
                <span className="font-mono font-bold text-red-600">
                  {lexical_analysis.is_brand_spoof ? "YES" : "No"}
                </span>
              </div>
              {lexical_analysis.spoofed_brands.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Targeted Brands:</span>
                  <span className="font-mono text-red-600 font-bold">
                    {lexical_analysis.spoofed_brands.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between items-center">
            <span>Lexical Risk Score:</span>
            <span className="font-mono font-black text-gray-900">
              {lexical_analysis.lexical_risk_score !== undefined
                ? Number(lexical_analysis.lexical_risk_score).toFixed(3)
                : "0.000"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
