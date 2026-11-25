/**
 * TrackPhish Chrome Extension Background Service Worker (Manifest V3).
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log("TrackPhish Enhanced Extension installed.");
});

// Message listener from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "UPDATE_BADGE") {
    if (message.isPhishing) {
      chrome.action.setBadgeText({ text: "WARN" });
      chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
    } else {
      chrome.action.setBadgeText({ text: "OK" });
      chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
    }
    sendResponse({ status: "badge_updated" });
  }
  return true;
});
