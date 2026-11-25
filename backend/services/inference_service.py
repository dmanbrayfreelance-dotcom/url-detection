"""
Inference Service for TrackPhish Enhanced.
Coordinates Teacher (Attention + Explainability Heatmap) and ONNX Student (Ultra-low latency)
inference modes, integrates algorithmic risk guards, and records scan events into MongoDB Atlas.
"""
import time
import uuid
import numpy as np
from datetime import datetime
from typing import Dict, Any, Optional

from ml_pipeline.training.explainability import TokenExplainabilityEngine
from ml_pipeline.models.student_distiller import DistillationManager
from ..core.db import get_db

class InferenceService:
    def __init__(self):
        self.explainability_engine = TokenExplainabilityEngine()
        self.distillation_manager = DistillationManager()
        self.db = get_db()

    def scan_url(self, raw_url: str, mode: str = "teacher_attention") -> Dict[str, Any]:
        """
        Scans a raw URL using the selected inference mode without live page fetching.
        Persists results into MongoDB Atlas `scan_logs` collection.
        """
        scan_id = str(uuid.uuid4())
        start_time = time.perf_counter()

        # Step 1: Base explanation and feature extraction
        explanation = self.explainability_engine.explain_url(raw_url)

        if mode == "onnx_student":
            # Execute low-latency student inference
            tokens = self.explainability_engine.sanitizer.get_token_strings(raw_url)
            static_seq = self.explainability_engine.static_embedder.extract_static_sequence(tokens)
            trans_seq = self.explainability_engine.trans_embedder.extract_contextual_sequence(tokens)
            comb = np.concatenate([static_seq, trans_seq], axis=-1)

            parsed = explanation["parsed_structure"]
            lex = explanation["lexical_analysis"]
            hg = explanation["homoglyph_analysis"]
            fh = explanation["free_host_analysis"]

            aux = np.array([
                lex["lexical_risk_score"],
                hg["homoglyph_risk_score"],
                fh["free_hosting_risk_score"],
                1.0 if lex["is_brand_spoof"] else 0.0,
                1.0 if lex["is_ip_host"] else 0.0,
                float(lex["shannon_entropy"]["domain"]) / 8.0
            ], dtype=np.float32)

            student_prob, _ = self.distillation_manager.run_student_inference(comb, aux)

            # Apply domain legitimacy and high confidence guardrails
            clean_host = parsed.get("hostname", "").lower()
            from ml_pipeline.config import TARGET_BRANDS
            is_known_legit = False
            for _, legit_list in TARGET_BRANDS.items():
                if any(clean_host == l or clean_host.endswith("." + l) for l in legit_list):
                    if not hg["is_homoglyph_attack"] and not lex["is_brand_spoof"] and not fh["is_free_hosting"]:
                        is_known_legit = True
                        break

            if is_known_legit:
                final_prob = min(0.12, student_prob * 0.25)
            else:
                if hg["is_homoglyph_attack"] or (lex["is_brand_spoof"] and fh["is_free_hosting"]) or lex["is_brand_spoof"]:
                    final_prob = max(student_prob, 0.92)
                elif fh["is_free_hosting"] and fh["free_hosting_risk_score"] >= 0.7:
                    final_prob = max(student_prob, 0.88)
                elif lex["is_ip_host"] or lex["has_at_symbol"]:
                    final_prob = max(student_prob, 0.85)
                else:
                    final_prob = student_prob

            explanation["phishing_probability"] = round(float(final_prob), 4)
            explanation["is_phishing"] = final_prob >= 0.5
            explanation["threat_level"] = (
                "CRITICAL_PHISHING" if final_prob >= 0.85
                else "SUSPICIOUS_PHISHING" if final_prob >= 0.50
                else "LOW_RISK_BENIGN" if final_prob >= 0.20
                else "SAFE_LEGITIMATE"
            )
            explanation["model_mode"] = "onnx_student"

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        created_timestamp = datetime.utcnow().isoformat()

        # Format tokens array of {token, weight, risk_tag}
        formatted_tokens = []
        for t in explanation["tokens"]:
            formatted_tokens.append({
                "token": t["token"],
                "weight": t["attention_weight"],
                "risk_tag": t["heat_tier"],
                "start": t.get("start"),
                "end": t.get("end"),
                "category": t.get("category"),
                "color": t.get("color"),
                "rationales": t.get("rationales", [])
            })

        # Normalized URL (lowercase hostname, normalized confusables)
        normalized_url = explanation.get("homoglyph_analysis", {}).get("normalized_ascii", raw_url)
        verdict = "phishing" if explanation["is_phishing"] else "legitimate"
        confidence = explanation["phishing_probability"] if verdict == "phishing" else round(1.0 - explanation["phishing_probability"], 4)

        guards_payload = {
            "free_host_guard": explanation["free_host_analysis"],
            "homoglyph_guard": explanation["homoglyph_analysis"],
            "lexical_entropy": explanation["lexical_analysis"]
        }

        # Full MongoDB Atlas `scan_logs` document
        scan_doc = {
            "id": scan_id,
            "scan_id": scan_id,
            "url": raw_url,
            "normalized_url": normalized_url,
            "verdict": verdict,
            "confidence": confidence,
            "risk_score": explanation["phishing_probability"],
            "model_mode": mode,
            "latency_ms": elapsed_ms,
            "tokens": formatted_tokens,
            "guards": guards_payload,
            "threat_indicators": explanation["threat_indicators"],
            "created_at": created_timestamp,

            # Backward-compatible convenience fields for frontend / extension
            "is_phishing": explanation["is_phishing"],
            "phishing_probability": explanation["phishing_probability"],
            "threat_level": explanation["threat_level"],
            "inference_mode": mode,
            "inference_latency_ms": elapsed_ms,
            "homoglyph_analysis": explanation["homoglyph_analysis"],
            "free_host_analysis": explanation["free_host_analysis"],
            "lexical_analysis": explanation["lexical_analysis"],
            "timestamp": created_timestamp
        }

        # Persist to MongoDB Atlas / fallback
        self.db.insert_scan_log(scan_doc)
        return scan_doc

# Singleton instance
inference_service = InferenceService()
