import React from "react";

export default function PhishingReasonCard({ scanData }) {
  if (!scanData) return null;

  const {
    url,
    normalized_url,
    is_phishing,
    phishing_probability,
    threat_level,
    threat_indicators = [],
    homoglyph_analysis = {},
    free_host_analysis = {},
    lexical_analysis = {},
    tokens = []
  } = scanData;

  const probPercent = (phishing_probability * 100).toFixed(1);

  // Extract high-attention tokens (critical or high)
  const highRiskTokens = tokens.filter(
    (t) => (t.weight >= 0.5 || t.risk_tag === "critical" || t.risk_tag === "high") && t.token.length > 1
  );

  // Determine primary attack category
  let primaryAttackType = "Suspicious Lexical Pattern";
  let executiveSummary = "";

  if (homoglyph_analysis?.is_homoglyph_attack) {
    primaryAttackType = "Homoglyph & Punycode Deception (IDN Spoofing)";
    executiveSummary = `This URL utilizes deceptive character substitutions from mixed scripts (e.g., Cyrillic/Greek lookalikes) to visually mimic a trusted domain while directing traffic to an unauthorized server.`;
  } else if (free_host_analysis?.is_free_hosting && free_host_analysis?.free_hosting_risk_score >= 0.6) {
    primaryAttackType = "Free-Hosting Platform Abuse (Credential Harvester)";
    executiveSummary = `The attacker deployed a phishing kit onto a legitimate cloud platform (${free_host_analysis.matched_free_host}) to evade reputation filters, burying sensitive credential keywords in user-controlled subpaths.`;
  } else if (lexical_analysis?.is_brand_spoof) {
    primaryAttackType = "Targeted Brand Impersonation";
    executiveSummary = `The URL impersonates trusted corporate brand assets (${lexical_analysis.spoofed_brands?.join(", ") || "Known Brands"}) within an unauthorized or deceptive domain structure.`;
  } else if (free_host_analysis?.is_url_shortener) {
    primaryAttackType = "Obfuscated URL Shortener Concealment";
    executiveSummary = `The URL disguises its true destination using an external URL shortener (${free_host_analysis.matched_shortener}) with anomalous slug entropy to bypass static scanners.`;
  } else if (lexical_analysis?.is_ip_host) {
    primaryAttackType = "Raw IP Address Host Obfuscation";
    executiveSummary = `The URL routes directly to a numerical IP address rather than a registered, reputational domain, typical of fast-flux infrastructure and malicious C2 nodes.`;
  } else if (lexical_analysis?.has_at_symbol) {
    primaryAttackType = "Userinfo Credential '@' Redirection Trick";
    executiveSummary = `The URL contains the '@' delimiter to mislead users into believing they are visiting the preceding domain, while web standards silently route to the post-'@' server.`;
  } else if (is_phishing) {
    primaryAttackType = "High-Risk Adversarial Lexical & Neural Attention Flag";
    executiveSummary = `The deep 1D CNN and scaled dot-product attention layers detected statistical anomalies, deceptive subdomains, and credential-harvesting token sequences matching known zero-day phishing signatures.`;
  } else {
    primaryAttackType = "Verified Clean Infrastructure";
    executiveSummary = `The URL adheres to verified legitimate domain patterns, normal lexical entropy, standard token attention distribution, and zero adversarial homoglyph or hosting deviations.`;
  }

  // Target brand detection
  const detectedBrand =
    homoglyph_analysis?.detected_target_brand ||
    (lexical_analysis?.spoofed_brands && lexical_analysis.spoofed_brands[0]) ||
    (free_host_analysis?.abused_brands && free_host_analysis.abused_brands[0]) ||
    null;

  return (
    <div
      className={`rounded-[28px] border p-6 shadow-sm space-y-6 transition-all ${
        is_phishing
          ? "bg-[#fffafa] border-red-200/90"
          : "bg-[#f8fdfa] border-emerald-200/90"
      }`}
    >
      {/* 1. Header with Diagnosis Badge & Severity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              is_phishing ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
            }`}
          >
            {is_phishing ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                {is_phishing ? "Phishing Threat Forensic Diagnosis" : "Legitimate URL Verification Report"}
              </h3>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                  is_phishing
                    ? "bg-red-600 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {threat_level.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Primary Threat Category: <strong className="text-gray-900 font-semibold">{primaryAttackType}</strong>
            </p>
          </div>
        </div>

        {/* Probability Gauge Pill */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-xs self-start md:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
              Neural Risk Score
            </span>
            <span
              className={`text-base font-black font-mono leading-none ${
                is_phishing ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {probPercent}%
            </span>
          </div>
          <div
            className={`w-3 h-3 rounded-full animate-ping ${
              is_phishing ? "bg-red-500" : "bg-emerald-500"
            }`}
          />
        </div>
      </div>

      {/* 2. Executive Forensic Summary */}
      <div
        className={`p-4 rounded-[20px] text-xs leading-relaxed ${
          is_phishing
            ? "bg-red-50/80 text-red-900 border border-red-100"
            : "bg-emerald-50/80 text-emerald-900 border border-emerald-100"
        }`}
      >
        <span className="font-bold uppercase tracking-wider text-[11px] block mb-1">
          Forensic Summary & Verdict Rationale:
        </span>
        <p className="font-medium text-gray-800">{executiveSummary}</p>
      </div>

      {/* 3. Detailed Forensic Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Card A: Target Impersonation & Identity */}
        <div className="bg-white rounded-[22px] p-4 border border-gray-100 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
            <span className="text-sm">🎯</span>
            <span>Target Impersonation</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Targeted Entity:</span>
              <span className="font-bold text-gray-900 capitalize">
                {detectedBrand || "None Detected (Generic)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Normalized Target:</span>
              <span className="font-mono text-gray-700 truncate max-w-[150px]" title={normalized_url}>
                {normalized_url}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Brand Spoofing Flag:</span>
              <span
                className={`font-semibold ${
                  lexical_analysis?.is_brand_spoof ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {lexical_analysis?.is_brand_spoof ? "DETECTED" : "Clear"}
              </span>
            </div>
          </div>
        </div>

        {/* Card B: Deceptive Mechanism & Infrastructure */}
        <div className="bg-white rounded-[22px] p-4 border border-gray-100 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
            <span className="text-sm">🛡️</span>
            <span>Deceptive Technique</span>
          </div>
          <div className="space-y-1.5 text-xs">
            {homoglyph_analysis?.is_homoglyph_attack ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">IDN Homoglyph:</span>
                  <span className="font-bold text-red-600">CONFUSABLE DETECTED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Replaced Chars:</span>
                  <span className="font-mono text-red-600 font-bold">
                    {homoglyph_analysis.confusable_count} substitution(s)
                  </span>
                </div>
              </>
            ) : free_host_analysis?.is_free_hosting ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hosting Abuse:</span>
                  <span className="font-bold text-amber-600">Free Site Builder</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Provider:</span>
                  <span className="font-mono text-gray-900 font-semibold truncate max-w-[140px]">
                    {free_host_analysis.matched_free_host}
                  </span>
                </div>
              </>
            ) : lexical_analysis?.is_ip_host ? (
              <div className="flex justify-between">
                <span className="text-gray-400">IP Host Direct:</span>
                <span className="font-bold text-red-600">Raw IP Address</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-400">Infrastructure:</span>
                <span className="font-semibold text-emerald-600">Standard Registered FQDN</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Domain Entropy:</span>
              <span className="font-mono text-gray-800 font-semibold">
                {lexical_analysis?.shannon_entropy?.domain?.toFixed(2) || "0.00"} bits
              </span>
            </div>
          </div>
        </div>

        {/* Card C: Neural Attention Triggers */}
        <div className="bg-white rounded-[22px] p-4 border border-gray-100 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
            <span className="text-sm">🔥</span>
            <span>Neural Attention Triggers</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">High Risk Tokens:</span>
              <span className="font-bold text-gray-900 font-mono">
                {highRiskTokens.length} token(s)
              </span>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {highRiskTokens.length > 0 ? (
                highRiskTokens.slice(0, 4).map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-200"
                  >
                    {t.token} ({Math.round(t.weight * 100)}%)
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-gray-400 italic">No abnormal token weights</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 4. Concrete Forensic Evidence Points */}
      {threat_indicators && threat_indicators.length > 0 && (
        <div className="space-y-2 bg-white rounded-[22px] p-4 border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <span>🔍</span>
            <span>Forensic Evidence Findings ({threat_indicators.length})</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
            {threat_indicators.map((ind, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100"
              >
                <span className="text-red-500 font-bold shrink-0 mt-0.5">●</span>
                <span className="text-gray-700 font-medium leading-relaxed">{ind}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Recommended Analyst Mitigation & Actions */}
      <div className="bg-white rounded-[22px] p-4 border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-gray-900 block text-xs">
            {is_phishing ? "🚨 Recommended Security Mitigation:" : "✅ Security Posture:"}
          </span>
          <span className="text-gray-500 text-[11px] mt-0.5 block">
            {is_phishing
              ? "Immediately sinkhole domain in DNS resolver, add to gateway egress blocklist, and invalidate any credentials submitted during the active window."
              : "URL meets all verification standards. No defensive remediation or endpoint isolation required."}
          </span>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {is_phishing ? (
            <span className="px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
              <span>⛔ Block Domain</span>
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
              <span>✓ Allow Access</span>
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
