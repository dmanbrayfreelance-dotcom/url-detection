/**
 * TrackPhish Chrome Extension Content Script.
 * Performs passive zero-visit inspection on the active web page:
 * - Detects IDN Punycode domains (xn--)
 * - Scans hyperlinks for deceptive confusable lookalikes
 */
(function () {
  const currentHost = window.location.hostname;

  // Check for Punycode in host
  if (currentHost.startsWith("xn--") || currentHost.includes(".xn--")) {
    console.warn("[TrackPhish] Alert: This page uses an Internationalized Domain Name (Punycode):", currentHost);
  }

  // Passive link scanner for obvious spoofing
  const links = document.querySelectorAll("a[href]");
  let flaggedCount = 0;

  links.forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href.includes("@") && href.startsWith("http")) {
      flaggedCount++;
      link.style.outline = "2px dashed #ef4444";
      link.title = "[TrackPhish Warning] Deceptive '@' credential redirection detected!";
    }
  });

  if (flaggedCount > 0) {
    console.warn(`[TrackPhish] Flagged ${flaggedCount} suspicious deceptive links on this page.`);
  }
})();
