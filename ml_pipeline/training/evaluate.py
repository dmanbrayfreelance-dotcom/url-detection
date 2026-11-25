"""
Evaluation and Metrics Benchmark Module for TrackPhish Enhanced.
Computes Accuracy, Precision, Recall, F1-Score, False Positive Rate (FPR),
ROC-AUC, and Inference Latency (ms) across teacher and student models.
"""
import time
import csv
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional
from ..config import SAMPLES_DIR
from .explainability import TokenExplainabilityEngine
from ..models.student_distiller import DistillationManager

class TrackPhishEvaluator:
    def __init__(self, sample_csv_path: Optional[Path] = None):
        self.csv_path = sample_csv_path or (SAMPLES_DIR / "sample_urls.csv")
        self.explainability_engine = TokenExplainabilityEngine()
        self.distillation_manager = DistillationManager()

    def load_dataset(self) -> List[Dict[str, Any]]:
        """Loads labeled URL dataset from CSV."""
        rows = []
        if not self.csv_path.exists():
            return rows

        with open(self.csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                rows.append({
                    "url": r["url"].strip(),
                    "label": int(r["label"].strip()),
                    "category": r.get("category", "unknown"),
                    "brand_target": r.get("brand_target", "none")
                })
        return rows

    def evaluate_model(self, mode: str = "teacher_attention") -> Dict[str, Any]:
        """
        Runs full evaluation across all samples and computes core cybersecurity metrics:
        Accuracy, Precision, Recall, F1, False Positive Rate (FPR), Latency.
        """
        samples = self.load_dataset()
        if not samples:
            return {"error": "Dataset is empty or not found"}

        y_true = []
        y_pred = []
        y_scores = []
        latencies = []

        for sample in samples:
            url = sample["url"]
            label = sample["label"]
            y_true.append(label)

            t0 = time.perf_counter()

            if mode == "teacher_attention":
                res = self.explainability_engine.explain_url(url)
                prob = res["phishing_probability"]
            else:
                # Student ONNX mode
                tokens = self.explainability_engine.sanitizer.get_token_strings(url)
                static_seq = self.explainability_engine.static_embedder.extract_static_sequence(tokens)
                trans_seq = self.explainability_engine.trans_embedder.extract_contextual_sequence(tokens)
                comb = np.concatenate([static_seq, trans_seq], axis=-1)

                parsed = self.explainability_engine.sanitizer.parse_url(url)
                lex = self.explainability_engine.lexical_analyzer.analyze(url, parsed)
                hg = self.explainability_engine.homoglyph_guard.analyze(url)
                fh = self.explainability_engine.free_host_analyzer.analyze(url, parsed)

                aux = np.array([
                    lex["lexical_risk_score"],
                    hg["homoglyph_risk_score"],
                    fh["free_hosting_risk_score"],
                    1.0 if lex["is_brand_spoof"] else 0.0,
                    1.0 if lex["is_ip_host"] else 0.0,
                    float(lex["shannon_entropy"]["domain"]) / 8.0
                ], dtype=np.float32)

                prob, _ = self.distillation_manager.run_student_inference(comb, aux)

                # Domain legitimacy check
                clean_host = parsed.get("hostname", "").lower()
                from ..config import TARGET_BRANDS
                is_known_legit = False
                for _, legit_list in TARGET_BRANDS.items():
                    if any(clean_host == l or clean_host.endswith("." + l) for l in legit_list):
                        if not hg["is_homoglyph_attack"] and not lex["is_brand_spoof"] and not fh["is_free_hosting"]:
                            is_known_legit = True
                            break

                if is_known_legit:
                    prob = min(0.12, prob * 0.25)
                else:
                    if hg["is_homoglyph_attack"] or (lex["is_brand_spoof"] and fh["is_free_hosting"]) or lex["is_brand_spoof"]:
                        prob = max(prob, 0.92)
                    elif fh["is_free_hosting"] and fh["free_hosting_risk_score"] >= 0.7:
                        prob = max(prob, 0.88)
                    elif lex["is_ip_host"] or lex["has_at_symbol"]:
                        prob = max(prob, 0.85)

            lat = (time.perf_counter() - t0) * 1000.0
            latencies.append(lat)

            y_scores.append(prob)
            y_pred.append(1 if prob >= 0.5 else 0)

        y_true_arr = np.array(y_true)
        y_pred_arr = np.array(y_pred)
        y_scores_arr = np.array(y_scores)

        # Confusion Matrix elements
        tp = int(np.sum((y_pred_arr == 1) & (y_true_arr == 1)))
        tn = int(np.sum((y_pred_arr == 0) & (y_true_arr == 0)))
        fp = int(np.sum((y_pred_arr == 1) & (y_true_arr == 0)))
        fn = int(np.sum((y_pred_arr == 0) & (y_true_arr == 1)))

        total = len(y_true_arr)
        accuracy = (tp + tn) / total if total > 0 else 0.0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0

        # Approximate ROC AUC
        sorted_indices = np.argsort(-y_scores_arr)
        sorted_labels = y_true_arr[sorted_indices]
        n_pos = np.sum(y_true_arr == 1)
        n_neg = np.sum(y_true_arr == 0)

        if n_pos > 0 and n_neg > 0:
            rank = np.empty_like(sorted_indices)
            rank[sorted_indices] = np.arange(total)
            pos_ranks = np.sum(total - rank[y_true_arr == 1])
            auc_roc = (pos_ranks - n_pos * (n_pos + 1) / 2.0) / (n_pos * n_neg)
        else:
            auc_roc = 1.0

        avg_latency = float(np.mean(latencies))
        p95_latency = float(np.percentile(latencies, 95))

        return {
            "mode": mode,
            "total_samples": total,
            "confusion_matrix": {
                "true_positives": tp,
                "true_negatives": tn,
                "false_positives": fp,
                "false_negatives": fn
            },
            "metrics": {
                "accuracy": round(float(accuracy), 4),
                "precision": round(float(precision), 4),
                "recall": round(float(recall), 4),
                "f1_score": round(float(f1), 4),
                "false_positive_rate": round(float(fpr), 4),
                "auc_roc": round(float(auc_roc), 4)
            },
            "performance": {
                "avg_latency_ms": round(avg_latency, 2),
                "p95_latency_ms": round(p95_latency, 2),
                "samples_per_second": round(1000.0 / max(0.1, avg_latency), 1)
            }
        }

if __name__ == "__main__":
    evaluator = TrackPhishEvaluator()
    print("Evaluating Teacher (Attention + Explainability)...")
    teacher_results = evaluator.evaluate_model("teacher_attention")
    print(teacher_results)

    print("\nEvaluating Student (Distilled ONNX / Low-Latency)...")
    student_results = evaluator.evaluate_model("onnx_student")
    print(student_results)
