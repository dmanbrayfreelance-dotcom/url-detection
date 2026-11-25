import React, { useState } from "react";

export default function RiskBreakdownCard({ scanData }) {
  const [activeTab, setActiveTab] = useState("all");

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
    <div className="bg-[#111827] rounded-xl border border-gray-800 p-6 shadow-xl space-y-6">
      {/* Header & Gauge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <h3 className="text-lg font-bold text-white">Algorithmic Risk Breakdown</h3>
          </div>
          <p className="text-xs text-gray-400">
            Enhanced multi-dimensional heuristics beyond the base TrackPhish paper.
          </p>
        </div>

        {/* Threat Level Badge & Progress Bar */}
        <div className="w-full md:w-72 bg-gray-900/90 p-4 rounded-xl border border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400 font-medium">Confidence Score</span>
            <span
              className={`text-sm font-bold font-mono ${
                is_phishing ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {percent}% Phish Prob
            </span>
          </div>

          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-700/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percent >= 75
                  ? "bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  : percent >= 50
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                  : "bg-gradient-to-r from-teal-500 to-emerald-500"
              }`}
              style={{ width: `${Math.max(4, percent)}%` }}
            />
          </div>

          <div className="mt-2 text-[11px] text-gray-400 flex justify-between">
            <span>Benign</span>
            <span className="font-semibold text-gray-200">{threat_level.replace(/_/g, " ")}</span>
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* Threat Indicators Alert Box */}
      {threat_indicators && threat_indicators.length > 0 && (
        <div className="bg-red-950/25 border border-red-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-red-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Detected Threat Indicators ({threat_indicators.length})</span>
          </div>
          <ul className="space-y-1.5 text-xs text-red-200/90 pl-5 list-disc">
            {threat_indicators.map((ind, i) => (
              <li key={i} className="leading-relaxed">
                {ind}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid of the 3 Major Enhancements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Guard 1: Multilingual IDN & Homoglyph Normalizer */}
        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Homoglyph & IDN Guard
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  homoglyph_analysis.is_homoglyph_attack
                    ? "bg-red-900/40 text-red-400 border border-red-800"
                    : "bg-emerald-900/40 text-emerald-400 border border-emerald-800"
                }`}
              >
                {homoglyph_analysis.is_homoglyph_attack ? "ATTACK DETECTED" : "CLEAN"}
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Punycode (xn--):</span>
                <span className="font-mono text-gray-200">
                  {homoglyph_analysis.has_punycode ? "Yes (Decoded)" : "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mixed Scripts:</span>
                <span className="font-mono text-gray-200">
                  {homoglyph_analysis.has_mixed_script ? "Yes (High Risk)" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Scripts Present:</span>
                <span className="font-mono text-sky-400">
                  {homoglyph_analysis.detected_scripts.join(", ") || "Latin"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Confusables Replaced:</span>
                <span className="font-mono font-bold text-orange-400">
                  {homoglyph_analysis.confusable_count} chars
                </span>
              </div>

              {homoglyph_analysis.substitutions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-800">
                  <span className="text-[10px] text-gray-500 uppercase block mb-1">Lookalike Diffs:</span>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {homoglyph_analysis.substitutions.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between font-mono text-[11px] bg-gray-950 px-2 py-1 rounded border border-gray-800">
                        <span className="text-red-400">'{sub.original}' ({sub.unicode_hex})</span>
                        <span className="text-gray-500">→</span>
                        <span className="text-emerald-400 font-bold">'{sub.normalized}'</span>
                        <span className="text-[10px] text-gray-500">{sub.script}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-gray-400">
            Normalized ASCII:{" "}
            <span className="font-mono text-sky-300 select-all break-all">
              {homoglyph_analysis.normalized_ascii}
            </span>
          </div>
        </div>

        {/* Guard 2: Path-Aware Free Hosting & Shortener */}
        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Free-Host & Shortener Guard
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  free_host_analysis.free_hosting_risk_score >= 0.6
                    ? "bg-red-900/40 text-red-400 border border-red-800"
                    : "bg-emerald-900/40 text-emerald-400 border border-emerald-800"
                }`}
              >
                {free_host_analysis.free_hosting_risk_score >= 0.6 ? "SUSPICIOUS" : "STANDARD"}
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Free Hosting Platform:</span>
                <span className="font-mono text-gray-200">
                  {free_host_analysis.is_free_hosting
                    ? free_host_analysis.matched_free_host
                    : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">URL Shortener:</span>
                <span className="font-mono text-gray-200">
                  {free_host_analysis.is_url_shortener
                    ? free_host_analysis.matched_shortener
                    : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">User Subdomain/Path:</span>
                <span className="font-mono text-gray-300 truncate max-w-[140px]" title={free_host_analysis.user_controlled_subdomain}>
                  {free_host_analysis.user_controlled_subdomain || "Root"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Impersonated Brands:</span>
                <span className="font-mono font-bold text-red-400">
                  {free_host_analysis.abused_brands.join(", ") || "None"}
                </span>
              </div>
              {free_host_analysis.is_url_shortener && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Slug Entropy:</span>
                  <span className="font-mono text-yellow-400">
                    {free_host_analysis.shortener_slug_entropy} bits
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-gray-400">
            Path-Aware Risk Score:{" "}
            <span className="font-mono font-bold text-cyan-400">
              {free_host_analysis.free_hosting_risk_score.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Guard 3: Adversarial Lexical & Shannon Entropy */}
        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Lexical & Entropy Engine
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  lexical_analysis.lexical_risk_score >= 0.5
                    ? "bg-red-900/40 text-red-400 border border-red-800"
                    : "bg-emerald-900/40 text-emerald-400 border border-emerald-800"
                }`}
              >
                {lexical_analysis.lexical_risk_score >= 0.5 ? "ANOMALY" : "NORMAL"}
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Shannon Domain Entropy:</span>
                <span className="font-mono text-sky-400 font-bold">
                  {lexical_analysis.shannon_entropy.domain.toFixed(2)} bits
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Raw IP Host:</span>
                <span className="font-mono text-gray-200">
                  {lexical_analysis.is_ip_host ? "Yes (Critical Flag)" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">'@' Redirection Trick:</span>
                <span className="font-mono text-gray-200">
                  {lexical_analysis.has_at_symbol ? "Yes (Deceptive)" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Brand Spoofing Flag:</span>
                <span className="font-mono font-bold text-red-400">
                  {lexical_analysis.is_brand_spoof ? "YES" : "No"}
                </span>
              </div>
              {lexical_analysis.spoofed_brands.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Targeted Brands:</span>
                  <span className="font-mono text-red-400 font-bold">
                    {lexical_analysis.spoofed_brands.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-gray-400 flex justify-between">
            <span>TLD: <strong className="text-gray-200 font-mono">.{lexical_analysis.tld || "unknown"}</strong></span>
            <span>Subdomains: <strong className="text-gray-200 font-mono">{lexical_analysis.num_subdomains}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
