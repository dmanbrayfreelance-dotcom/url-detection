import React, { useState } from "react";
import { submitFeedback } from "../api/trackphishApi";

export default function FeedbackModal({ isOpen, onClose, scanData }) {
  const [feedbackType, setFeedbackType] = useState("false_positive");
  const [analystVerdict, setAnalystVerdict] = useState("legitimate");
  const [analystName, setAnalystName] = useState("Security Analyst");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(null);

  if (!isOpen || !scanData) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitFeedback({
        scan_id: scanData.id,
        url: scanData.url,
        predicted_probability: scanData.phishing_probability,
        predicted_verdict: scanData.verdict || (scanData.is_phishing ? "phishing" : "legitimate"),
        corrected_verdict: analystVerdict,
        feedback_type: feedbackType,
        notes: notes,
        analyst_name: analystName
      });
      setSubmittedStatus("Feedback recorded successfully. Added to continuous retraining pool.");
      setTimeout(() => {
        setSubmittedStatus(null);
        onClose();
      }, 1500);
    } catch (err) {
      setSubmittedStatus(`Error submitting feedback: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-gray-800 rounded-xl w-full max-w-lg p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            <h3 className="text-lg font-bold text-white">Analyst Threat Feedback</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Target URL Info */}
          <div className="bg-gray-900 p-3 rounded-lg border border-gray-800 font-mono space-y-1">
            <span className="text-[10px] uppercase text-gray-500 block">Inspected URL:</span>
            <span className="text-gray-200 break-all select-all font-semibold">{scanData.url}</span>
            <div className="pt-2 flex justify-between text-gray-400 text-[11px]">
              <span>Model Verdict: <strong className={scanData.is_phishing ? "text-red-400" : "text-emerald-400"}>{scanData.threat_level}</strong></span>
              <span>Prob: <strong className="font-mono text-sky-400">{(scanData.phishing_probability * 100).toFixed(1)}%</strong></span>
            </div>
          </div>

          {/* Feedback Type */}
          <div className="space-y-1.5">
            <label className="font-semibold text-gray-300">Feedback Category</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "false_positive", label: "False Positive (Benign marked Phish)" },
                { id: "false_negative", label: "False Negative (Phish marked Benign)" },
                { id: "confirmed_phishing", label: "Confirmed Phishing (True Positive)" },
                { id: "confirmed_legitimate", label: "Confirmed Legitimate (True Negative)" }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setFeedbackType(t.id);
                    setAnalystVerdict(t.id.includes("phishing") || t.id === "false_negative" ? "phishing" : "legitimate");
                  }}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    feedbackType === t.id
                      ? "bg-sky-500/20 text-sky-300 border-sky-500 font-bold"
                      : "bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-gray-300">Analyst Technical Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified internal portal, homoglyph was accidental typo, or stealth spear-phishing campaign target..."
              className="w-full bg-[#0b1120] text-gray-200 p-2.5 rounded-lg border border-gray-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {submittedStatus && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-emerald-300">
              {submittedStatus}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold transition-all shadow-md shadow-sky-500/20 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
