import React, { useState } from "react";
import { submitFeedback } from "../api/trackphishApi";

export default function FeedbackModal({ isOpen, onClose, scanData }) {
  const [feedbackType, setFeedbackType] = useState("false_positive");
  const [analystVerdict, setAnalystVerdict] = useState("legitimate");
  const [analystName, setAnalystName] = useState("George (SecOps)");
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
      setSubmittedStatus("Feedback recorded successfully. Added to continuous active learning pool.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-gray-100 rounded-[32px] w-full max-w-lg p-6 sm:p-7 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs">
              ✏️
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Analyst Threat Feedback</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Target URL Info */}
          <div className="bg-gray-50 p-3.5 rounded-[18px] border border-gray-100 font-mono space-y-1">
            <span className="text-[10px] uppercase text-gray-400 font-bold block">Inspected URL:</span>
            <span className="text-gray-900 break-all select-all font-semibold block">{scanData.url}</span>
            <div className="pt-2 flex justify-between text-gray-500 text-[11px] font-sans">
              <span>Model Verdict: <strong className={scanData.is_phishing ? "text-red-600" : "text-emerald-600"}>{scanData.threat_level}</strong></span>
              <span>Prob: <strong className="font-mono text-gray-900">{(scanData.phishing_probability * 100).toFixed(1)}%</strong></span>
            </div>
          </div>

          {/* Feedback Type Buttons */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-700 block">Feedback Category</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "false_positive", label: "False Positive (Mark Clean)" },
                { id: "false_negative", label: "False Negative (Mark Phish)" },
                { id: "confirmed_phishing", label: "Confirm Phishing Threat" },
                { id: "confirmed_legitimate", label: "Confirm Legitimate Clean" }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setFeedbackType(t.id);
                    setAnalystVerdict(t.id.includes("phishing") || t.id === "false_negative" ? "phishing" : "legitimate");
                  }}
                  className={`p-2.5 rounded-full border text-center font-semibold transition-all ${
                    feedbackType === t.id
                      ? "bg-black text-white shadow-xs border-black"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-700 block">Analyst Technical Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified internal portal, homoglyph was accidental typo, or stealth spear-phishing campaign target..."
              className="w-full bg-white text-gray-900 p-3 rounded-[16px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black text-xs"
            />
          </div>

          {submittedStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-800 text-center font-semibold">
              {submittedStatus}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-full bg-black hover:bg-gray-800 text-white font-bold transition-all shadow-xs disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
