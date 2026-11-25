"""
Batch Scanner Service.
Processes large batches of URLs, saves records into MongoDB Atlas `batch_jobs`,
and outputs downloadable CSV and JSON security reports.
"""
import io
import csv
import time
import uuid
from datetime import datetime
from typing import List, Dict, Any
from .inference_service import inference_service
from ..core.db import get_db

class BatchScannerService:
    def __init__(self):
        self.db = get_db()

    def process_batch(self, urls: List[str], inference_mode: str = "onnx_student") -> Dict[str, Any]:
        """Scans a collection of URLs, saves batch job, and computes summary metrics."""
        job_id = str(uuid.uuid4())
        start_time = time.perf_counter()

        results = []
        phishing_count = 0
        legit_count = 0

        for url in urls:
            clean_url = url.strip()
            if not clean_url:
                continue
            scan_res = inference_service.scan_url(clean_url, mode=inference_mode)
            results.append(scan_res)
            if scan_res["is_phishing"]:
                phishing_count += 1
            else:
                legit_count += 1

        total_elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        avg_latency = round(total_elapsed_ms / max(1, len(results)), 2)
        created_at = datetime.utcnow().isoformat()

        job_doc = {
            "job_id": job_id,
            "batch_id": job_id,
            "total_urls": len(results),
            "phishing_count": phishing_count,
            "legitimate_count": legit_count,
            "avg_latency_ms": avg_latency,
            "total_time_ms": total_elapsed_ms,
            "status": "completed",
            "results": results,
            "created_at": created_at
        }

        # Persist to MongoDB Atlas `batch_jobs` collection
        self.db.insert_batch_job(job_doc)
        return job_doc

    def generate_csv_report(self, batch_data: Dict[str, Any]) -> str:
        """Exports batch scan results to CSV string."""
        output = io.StringIO()
        fieldnames = [
            "id", "url", "normalized_url", "verdict", "confidence", "risk_score",
            "model_mode", "latency_ms", "threat_indicators", "created_at"
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for res in batch_data.get("results", []):
            writer.writerow({
                "id": res.get("id"),
                "url": res.get("url"),
                "normalized_url": res.get("normalized_url", res.get("url")),
                "verdict": res.get("verdict", "phishing" if res.get("is_phishing") else "legitimate"),
                "confidence": res.get("confidence", res.get("phishing_probability")),
                "risk_score": res.get("risk_score", res.get("phishing_probability")),
                "model_mode": res.get("model_mode", res.get("inference_mode")),
                "latency_ms": res.get("latency_ms", res.get("inference_latency_ms")),
                "threat_indicators": " | ".join(res.get("threat_indicators", [])),
                "created_at": res.get("created_at", res.get("timestamp"))
            })

        return output.getvalue()

batch_service = BatchScannerService()
