import React, { useState } from "react";

export default function PhishingReasonCard({ scanData }) {
  if (!scanData) return null;

  const [activeTab, setActiveTab] = useState("simple"); // "simple" (user-friendly) vs "forensic" (technical)

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

  // High-risk tokens
  const highRiskTokens = tokens.filter(
    (t) => (t.weight >= 0.5 || t.risk_tag === "critical" || t.risk_tag === "high") && t.token.length > 1
  );

  // Target brand
  const detectedBrand =
    homoglyph_analysis?.detected_target_brand ||
    (lexical_analysis?.spoofed_brands && lexical_analysis.spoofed_brands[0]) ||
    (free_host_analysis?.abused_brands && free_host_analysis.abused_brands[0]) ||
    (url.toLowerCase().includes("paypal") ? "PayPal" : null) ||
    (url.toLowerCase().includes("google") ? "Google" : null) ||
    (url.toLowerCase().includes("apple") ? "Apple" : null) ||
    (url.toLowerCase().includes("amazon") ? "Amazon" : null) ||
    (url.toLowerCase().includes("chase") ? "Chase Bank" : null);

  // Elaborated plain-language narrative generation
  let attackTitle = "Suspicious Phishing Pattern";
  let plainEnglishStory = "";
  let howTheTrapWorks = "";
  let whatHappensIfClicked = "";
  let safeAdvice = "";

  if (homoglyph_analysis?.is_homoglyph_attack) {
    attackTitle = "Visual Character Impersonation (Homoglyph Attack)";
    plainEnglishStory = `The attacker created a deceptive fake website designed to look 100% identical to ${
      detectedBrand ? `official ${detectedBrand}` : "a legitimate company"
    }. To trick your eyes, they replaced regular English letters with identical-looking letters from foreign alphabets (such as Russian Cyrillic or Greek).`;
    howTheTrapWorks = `To human eyes, the address looks like '${url}', but your browser secretly translates the foreign letter into Punycode ('${homoglyph_analysis.normalized_ascii}'). It directs you to a foreign server controlled by scammers instead of the real company.`;
    whatHappensIfClicked = `If you type your login password or credit card on this fake page, the scammers capture your credentials immediately in plain text.`;
    safeAdvice = `Never click links with suspicious lookalike letters. Always type the official website address directly into your browser bookmark bar.`;
  } else if (free_host_analysis?.is_free_hosting && free_host_analysis?.free_hosting_risk_score >= 0.6) {
    attackTitle = "Free Cloud Hosting Abuse (Trojan Page)";
    plainEnglishStory = `The attacker built a fake login or payment portal hosted on a legitimate public cloud service (${free_host_analysis.matched_free_host}). Because the root platform belongs to a trusted company, many basic antivirus filters mistakenly consider it safe.`;
    howTheTrapWorks = `The attacker created their own private sub-page (like '/${free_host_analysis.user_controlled_subdomain || "login"}') and styled it to look like ${
      detectedBrand || "a bank or payment service"
    }. They hide behind the legitimate company's SSL security certificate.`;
    whatHappensIfClicked = `Any personal information or security codes (OTPs) you type into this page are sent straight to the scammer's database.`;
    safeAdvice = `${detectedBrand || "Reputable companies"} will NEVER ask you to log in or verify billing on a free site builder like ${free_host_analysis.matched_free_host}.`;
  } else if (lexical_analysis?.is_brand_spoof) {
    attackTitle = "Subdomain & Brand Spoofing Trap";
    plainEnglishStory = `The attacker created a website with an unfamiliar domain, but stuffed legitimate brand names (${
      lexical_analysis.spoofed_brands?.join(", ") || "trusted companies"
    }) into the subdomains or path to trick you into a false sense of security.`;
    howTheTrapWorks = `Web browsers read website addresses from right to left (TLD first). While you might see '${detectedBrand || "Brand"}' near the beginning, the actual destination host is an unauthorized server.`;
    whatHappensIfClicked = `The site is designed to harvest your username, password, or financial credentials by cloning the real website's look and feel.`;
    safeAdvice = `Check the domain right before the '.com' or '.org'. If it is not the verified official domain, do not enter any credentials.`;
  } else if (lexical_analysis?.is_ip_host) {
    attackTitle = "Direct Numerical IP Address (No Registered Domain)";
    plainEnglishStory = `Real companies always use official domain names (like google.com or paypal.com). This link directs you straight to a raw computer IP address.`;
    howTheTrapWorks = `Scammers frequently use direct IP addresses so they don't have to register a formal domain name with verifiable contact info, allowing them to take down and move their phishing kit in seconds.`;
    whatHappensIfClicked = `Entering personal information on an unbranded IP address almost guarantees credential theft or direct malware injection.`;
    safeAdvice = `Never enter passwords or banking details on a website that displays numbers instead of a real company domain name.`;
  } else if (lexical_analysis?.has_at_symbol) {
    attackTitle = "Userinfo '@' Redirection Trick";
    plainEnglishStory = `The attacker is exploiting an obscure browser feature using the '@' symbol to deceive you.`;
    howTheTrapWorks = `When a link has an '@' symbol, your browser treats everything BEFORE the '@' as login credentials, completely ignores it, and secretly loads the website AFTER the '@' symbol.`;
    whatHappensIfClicked = `You think you are visiting the trusted brand before the '@', but your browser takes you straight to the hacker's trap.`;
    safeAdvice = `Legitimate websites never send links containing '@' in their web address. Treat this as an immediate red flag.`;
  } else if (is_phishing) {
    attackTitle = "High-Risk Deceptive Keywords & Entropy Anomaly";
    plainEnglishStory = `Our TrackPhish multi-embedding AI model inspected the exact structure of this URL and detected combinations of deceptive keywords (like 'signin', 'verify', 'update') paired with irregular character randomness.`;
    howTheTrapWorks = `The link uses urgent, high-pressure authentication keywords placed in suspicious combinations that match thousands of confirmed active phishing campaigns.`;
    whatHappensIfClicked = `The page likely presents an urgent fake alert (e.g. 'Account Suspended', 'Verify Your Identity Now') to trick you into surrendering your account.`;
    safeAdvice = `Do not panic or click through. Open your regular mobile app or go directly to the official homepage to check your account status.`;
  } else {
    attackTitle = "Verified Clean & Legitimate Infrastructure";
    plainEnglishStory = `This URL belongs to verified legitimate infrastructure. All security heuristics confirmed normal lexical entropy, zero lookalike characters, and safe routing.`;
    howTheTrapWorks = `The domain is registered to the verified organization, uses standard syntax patterns, and matches authentic web traffic without deceptive redirects.`;
    whatHappensIfClicked = `The destination is safe for standard browsing according to our zero-live-visit security inspection.`;
    safeAdvice = `Always verify you see the secure padlock in your browser address bar and the exact official spelling.`;
  }

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
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              is_phishing ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
            }`}
          >
            {is_phishing ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
                {is_phishing ? "Phishing Threat Forensic Diagnosis" : "Legitimate URL Verification Report"}
              </h3>
              <span
                className={`text-[10px] font-black uppercase px-3 py-0.5 rounded-full tracking-wider ${
                  is_phishing ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                }`}
              >
                {threat_level.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Primary Threat Mechanism:{" "}
              <strong className={is_phishing ? "text-red-700 font-bold" : "text-emerald-700 font-bold"}>
                {attackTitle}
              </strong>
            </p>
          </div>
        </div>

        {/* View Switcher: Simple Plain English vs Technical Forensic */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-full border border-gray-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("simple")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === "simple"
                ? "bg-black text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            🧑‍💼 Plain English Explanation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("forensic")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === "forensic"
                ? "bg-black text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            🕵️‍♂️ Technical Forensics
          </button>
        </div>
      </div>

      {/* 2. PLAIN ENGLISH TAB (Specially built so everyday users easily understand what happened) */}
      {activeTab === "simple" ? (
        <div className="space-y-4">
          
          {/* Main Story Narrative Card */}
          <div
            className={`p-5 rounded-[24px] space-y-3 ${
              is_phishing
                ? "bg-white border-2 border-red-200 shadow-sm"
                : "bg-white border-2 border-emerald-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <span className="text-base">{is_phishing ? "🚨" : "✅"}</span>
                <span>{is_phishing ? "What Is Happening In This Link?" : "Safety Summary"}</span>
              </span>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  is_phishing ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                Risk Confidence: {probPercent}%
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
              {plainEnglishStory}
            </p>

            {detectedBrand && is_phishing && (
              <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-red-900 flex items-center gap-2.5">
                <span className="text-lg">🎯</span>
                <div>
                  <span className="font-extrabold block">Targeted Brand Being Spoofed: {detectedBrand}</span>
                  <span className="text-[11px] text-red-700">
                    The scammers are impersonating {detectedBrand} to steal account credentials from unsuspecting users.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3 Steps: The Trap, The Risk, What To Do */}
          {is_phishing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Step 1: The Trap */}
              <div className="bg-white rounded-[22px] p-4 border border-gray-100 shadow-xs flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-extrabold text-gray-900">How The Trick Works</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2.5 leading-relaxed font-medium">
                    {howTheTrapWorks}
                  </p>
                </div>
                <div className="pt-2 text-[10px] text-amber-700 font-bold flex items-center gap-1">
                  <span>⚠️ Deceptive visual trick</span>
                </div>
              </div>

              {/* Step 2: The Danger */}
              <div className="bg-white rounded-[22px] p-4 border border-gray-100 shadow-xs flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <span className="w-6 h-6 rounded-full bg-red-100 text-red-800 font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-extrabold text-gray-900">What Happens If You Click</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2.5 leading-relaxed font-medium">
                    {whatHappensIfClicked}
                  </p>
                </div>
                <div className="pt-2 text-[10px] text-red-700 font-bold flex items-center gap-1">
                  <span>⛔ Severe credential risk</span>
                </div>
              </div>

              {/* Step 3: What To Do */}
              <div className="bg-white rounded-[22px] p-4 border border-gray-100 shadow-xs flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                      3
                    </span>
                    <span className="text-xs font-extrabold text-gray-900">What You Must Do</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2.5 leading-relaxed font-medium">
                    {safeAdvice}
                  </p>
                </div>
                <div className="pt-2 text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <span>🛡️ Immediate safe practice</span>
                </div>
              </div>

            </div>
          )}

          {/* User Warning Banner */}
          <div className="bg-black text-white p-4 rounded-[22px] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-extrabold text-white text-xs block flex items-center gap-2">
                <span>🛡️</span>
                <span>TrackPhish Zero-Live-Visit Guarantee:</span>
              </span>
              <span className="text-gray-300 text-[11px]">
                This analysis was performed safely by inspecting the link’s text. Your computer was NEVER connected to the hacker's server.
              </span>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-red-600 text-white font-bold text-xs shadow-xs">
                {is_phishing ? "DO NOT OPEN LINK" : "SAFE TO VISIT"}
              </span>
            </div>
          </div>

        </div>
      ) : (
        /* 3. TECHNICAL FORENSIC TAB (For Security Analysts / Code Review) */
        <div className="space-y-4">
          
          {/* Detailed Forensic Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Card A: Target Impersonation & Identity */}
            <div className="bg-white rounded-[22px] p-4 border border-gray-100 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                <span className="text-sm">🎯</span>
                <span>Target Impersonation Forensic</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Targeted Entity:</span>
                  <span className="font-bold text-gray-900 capitalize">
                    {detectedBrand || "None Detected (Generic)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Normalized ASCII Target:</span>
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
                <span>Deceptive Infrastructure</span>
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

          {/* Concrete Forensic Evidence Findings */}
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

          {/* Recommended Analyst Mitigation */}
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
      )}

    </div>
  );
}
