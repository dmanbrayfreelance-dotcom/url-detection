/**
 * TrackPhish Enhanced API Client.
 * Pre-configured for Vercel Frontend (https://url-detection-omega.vercel.app)
 * and Render Backend (https://url-detection-4faf.onrender.com).
 */
const isBrowser = typeof window !== "undefined";
const isProduction = import.meta.env?.PROD || (isBrowser && !window.location.hostname.includes("localhost"));

const DEFAULT_REMOTE_API = "https://url-detection-4faf.onrender.com/api/v1";
const DEFAULT_LOCAL_API = "http://localhost:8000/api/v1";

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || (isProduction ? DEFAULT_REMOTE_API : DEFAULT_LOCAL_API);

export async function scanUrl(url, inferenceMode = "teacher_attention") {
  const response = await fetch(`${API_BASE_URL}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, inference_mode: inferenceMode })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Scan request failed with HTTP ${response.status}`);
  }
  return await response.json();
}

export async function getScanById(scanId) {
  const response = await fetch(`${API_BASE_URL}/scan/${scanId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch scan ${scanId}`);
  }
  return await response.json();
}

export async function batchScan(urls, inferenceMode = "onnx_student") {
  const response = await fetch(`${API_BASE_URL}/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls, inference_mode: inferenceMode })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Batch scan failed");
  }
  return await response.json();
}

export async function uploadBatchCsv(file, inferenceMode = "onnx_student") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("inference_mode", inferenceMode);

  const response = await fetch(`${API_BASE_URL}/batch/upload-csv`, {
    method: "POST",
    body: formData
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "CSV upload failed");
  }
  return await response.json();
}

export async function getAnalyticsOverview() {
  const response = await fetch(`${API_BASE_URL}/analytics`);
  if (!response.ok) {
    throw new Error("Failed to load analytics");
  }
  return await response.json();
}

export async function getAuditLogs(limit = 50, skip = 0, search = "", verdict = "") {
  let url = `${API_BASE_URL}/logs?limit=${limit}&skip=${skip}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (verdict && verdict !== "all") url += `&verdict=${encodeURIComponent(verdict)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load audit logs");
  }
  return await response.json();
}

export async function submitFeedback(payload) {
  const response = await fetch(`${API_BASE_URL}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error("Feedback submission failed");
  }
  return await response.json();
}
