"""
Database layer for TrackPhish Enhanced with MongoDB Atlas Integration.
Supports live MongoDB Atlas (mongodb+srv://...) with automatic graceful fallback
to an in-memory buffer if the network, DNS, or Atlas IP allowlist is offline.
"""
import os
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from .config import settings

logger = logging.getLogger("trackphish.db")

class DatabaseManager:
    """
    Unified Database Manager for MongoDB Atlas with zero-crash in-memory fallback buffer.
    Maintains collections:
      - scan_logs
      - batch_jobs
      - analyst_feedback
    """
    def __init__(self):
        self.is_connected = False
        self.client = None
        self.db = None
        self.backend_type = "in_memory_buffer"

        # In-memory buffer collections
        self._mem_scan_logs: List[Dict[str, Any]] = []
        self._mem_batch_jobs: List[Dict[str, Any]] = []
        self._mem_feedback: List[Dict[str, Any]] = []

        # Initialize connection
        self._connect_startup()

    def _connect_startup(self):
        """Attempts connection to MongoDB Atlas with a quick timeout and health check."""
        uri = settings.MONGODB_URI
        db_name = settings.MONGODB_DB_NAME

        try:
            from pymongo import MongoClient
            # Set a 2.5-second timeout so offline/sandboxed startup does not hang
            self.client = MongoClient(
                uri,
                serverSelectionTimeoutMS=2500,
                connectTimeoutMS=2500,
                socketTimeoutMS=2500,
                retryWrites=True
            )
            # Ping database to verify Atlas IP allowlist and credentials
            self.client.admin.command("ping")
            self.db = self.client[db_name]
            self.is_connected = True
            self.backend_type = "mongodb_atlas"
            logger.info("Successfully connected to MongoDB Atlas database: %s", db_name)

            # Ensure indexes on Atlas collections
            self._ensure_indexes()
        except Exception as e:
            self.is_connected = False
            self.backend_type = "in_memory_buffer"
            logger.warning(
                "MongoDB Atlas unreachable (%s). Initialized graceful in-memory buffer fallback.",
                str(e)
            )

    def _ensure_indexes(self):
        """Creates indexes on live MongoDB collections if connected."""
        if not self.is_connected or self.db is None:
            return
        try:
            # scan_logs indexes
            self.db.scan_logs.create_index([("url", 1)])
            self.db.scan_logs.create_index([("verdict", 1)])
            self.db.scan_logs.create_index([("created_at", -1)])
            self.db.scan_logs.create_index([("risk_score", -1)])

            # batch_jobs indexes
            self.db.batch_jobs.create_index([("job_id", 1)], unique=True)
            self.db.batch_jobs.create_index([("created_at", -1)])

            # analyst_feedback indexes
            self.db.analyst_feedback.create_index([("scan_id", 1)])
            self.db.analyst_feedback.create_index([("url", 1)])
            self.db.analyst_feedback.create_index([("created_at", -1)])
            logger.info("MongoDB Atlas indexes verified successfully.")
        except Exception as e:
            logger.warning("Index creation warning: %s", str(e))

    def get_health(self) -> Dict[str, Any]:
        """Returns live connection health status."""
        return {
            "is_connected": self.is_connected,
            "backend": self.backend_type,
            "database_name": settings.MONGODB_DB_NAME,
            "buffered_scans": len(self._mem_scan_logs) if not self.is_connected else self.db.scan_logs.count_documents({})
        }

    # =========================================================================
    # 1. SCAN LOGS
    # =========================================================================
    def insert_scan_log(self, data: Dict[str, Any]) -> str:
        """
        Inserts document into `scan_logs`.
        Schema fields:
          url, normalized_url, verdict, confidence, risk_score, model_mode,
          latency_ms, tokens [{token, weight, risk_tag}], guards, created_at
        """
        doc = dict(data)
        doc_id = str(doc.get("id") or doc.get("_id") or uuid.uuid4())
        doc["id"] = doc_id
        doc["_id"] = doc_id
        doc["created_at"] = doc.get("created_at") or datetime.utcnow().isoformat()

        if self.is_connected and self.db is not None:
            try:
                self.db.scan_logs.insert_one(doc)
                return doc_id
            except Exception as e:
                logger.error("Error inserting scan log to Atlas: %s. Storing in memory.", e)

        # In-memory buffer fallback
        self._mem_scan_logs.insert(0, doc)
        return doc_id

    def get_scan_logs(
        self,
        limit: int = 50,
        skip: int = 0,
        search: Optional[str] = None,
        verdict: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Retrieves paginated scan logs with optional search & verdict filters."""
        if self.is_connected and self.db is not None:
            try:
                query = {}
                if search:
                    query["url"] = {"$regex": search, "$options": "i"}
                if verdict and verdict != "all":
                    query["verdict"] = verdict

                cursor = self.db.scan_logs.find(query).sort("created_at", -1).skip(skip).limit(limit)
                results = []
                for item in cursor:
                    item["id"] = str(item.get("_id") or item.get("id"))
                    item.pop("_id", None)
                    results.append(item)
                return results
            except Exception as e:
                logger.error("Error querying Atlas scan logs: %s", e)

        # In-memory fallback
        filtered = self._mem_scan_logs
        if search:
            s_lower = search.lower()
            filtered = [s for s in filtered if s_lower in s.get("url", "").lower()]
        if verdict and verdict != "all":
            filtered = [s for s in filtered if s.get("verdict") == verdict]

        return filtered[skip : skip + limit]

    def get_scan_by_id(self, scan_id: str) -> Optional[Dict[str, Any]]:
        """Finds single scan log by scan_id."""
        if self.is_connected and self.db is not None:
            try:
                res = self.db.scan_logs.find_one({"$or": [{"id": scan_id}, {"_id": scan_id}]})
                if res:
                    res["id"] = str(res.get("_id") or res.get("id"))
                    res.pop("_id", None)
                    return res
            except Exception as e:
                logger.error("Error fetching scan by id from Atlas: %s", e)

        # In-memory fallback
        for s in self._mem_scan_logs:
            if s.get("id") == scan_id or str(s.get("_id")) == scan_id:
                return s
        return None

    # =========================================================================
    # 2. BATCH JOBS
    # =========================================================================
    def insert_batch_job(self, data: Dict[str, Any]) -> str:
        """
        Inserts document into `batch_jobs`.
        Schema fields:
          job_id, total_urls, phishing_count, legitimate_count, avg_latency_ms,
          status, results, created_at
        """
        doc = dict(data)
        job_id = doc.get("job_id") or str(uuid.uuid4())
        doc["job_id"] = job_id
        doc["_id"] = job_id
        doc["created_at"] = doc.get("created_at") or datetime.utcnow().isoformat()

        if self.is_connected and self.db is not None:
            try:
                self.db.batch_jobs.insert_one(doc)
                return job_id
            except Exception as e:
                logger.error("Error inserting batch job to Atlas: %s", e)

        self._mem_batch_jobs.insert(0, doc)
        return job_id

    def get_batch_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves batch job results by job_id."""
        if self.is_connected and self.db is not None:
            try:
                res = self.db.batch_jobs.find_one({"$or": [{"job_id": job_id}, {"_id": job_id}]})
                if res:
                    res["job_id"] = str(res.get("job_id") or res.get("_id"))
                    res.pop("_id", None)
                    return res
            except Exception as e:
                logger.error("Error fetching batch job: %s", e)

        for b in self._mem_batch_jobs:
            if b.get("job_id") == job_id or str(b.get("_id")) == job_id:
                return b
        return None

    # =========================================================================
    # 3. ANALYST FEEDBACK
    # =========================================================================
    def insert_feedback(self, data: Dict[str, Any]) -> str:
        """
        Inserts document into `analyst_feedback`.
        Schema fields:
          scan_id, url, predicted_verdict, corrected_verdict, notes, created_at
        """
        doc = dict(data)
        fb_id = str(doc.get("id") or uuid.uuid4())
        doc["id"] = fb_id
        doc["_id"] = fb_id
        doc["created_at"] = doc.get("created_at") or datetime.utcnow().isoformat()

        if self.is_connected and self.db is not None:
            try:
                self.db.analyst_feedback.insert_one(doc)
                return fb_id
            except Exception as e:
                logger.error("Error inserting feedback to Atlas: %s", e)

        self._mem_feedback.insert(0, doc)
        return fb_id

    def get_feedback_list(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Lists recent analyst feedback entries."""
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.analyst_feedback.find().sort("created_at", -1).limit(limit)
                items = []
                for item in cursor:
                    item["id"] = str(item.get("_id") or item.get("id"))
                    item.pop("_id", None)
                    items.append(item)
                return items
            except Exception as e:
                logger.error("Error reading feedback from Atlas: %s", e)

        return self._mem_feedback[:limit]

    # =========================================================================
    # 4. ANALYTICS & SOC METRICS
    # =========================================================================
    def get_analytics(self) -> Dict[str, Any]:
        """Calculates SOC metrics: phishing vs legit ratio, latency by mode, top tokens/domains."""
        logs = self.get_scan_logs(limit=500)

        total_scans = len(logs)
        phishing_count = sum(1 for s in logs if s.get("verdict") == "phishing" or s.get("is_phishing"))
        legit_count = total_scans - phishing_count

        teacher_latencies = [s.get("latency_ms", s.get("inference_latency_ms", 0)) for s in logs if s.get("model_mode") == "teacher_attention"]
        student_latencies = [s.get("latency_ms", s.get("inference_latency_ms", 0)) for s in logs if s.get("model_mode") == "onnx_student"]

        avg_teacher_lat = round(sum(teacher_latencies) / max(1, len(teacher_latencies)), 2)
        avg_student_lat = round(sum(student_latencies) / max(1, len(student_latencies)), 2)

        vector_counts: Dict[str, int] = {}
        brand_counts: Dict[str, int] = {}
        token_weights: Dict[str, float] = {}

        for s in logs:
            guards = s.get("guards", {})
            hg = guards.get("homoglyph_guard") or s.get("homoglyph_analysis", {})
            fh = guards.get("free_host_guard") or s.get("free_host_analysis", {})
            lex = guards.get("lexical_entropy") or s.get("lexical_analysis", {})

            if hg.get("is_homoglyph_attack"):
                vector_counts["Homoglyph / Punycode"] = vector_counts.get("Homoglyph / Punycode", 0) + 1
            if fh.get("is_free_hosting"):
                vector_counts["Free Hosting Abuse"] = vector_counts.get("Free Hosting Abuse", 0) + 1
            if fh.get("is_url_shortener"):
                vector_counts["URL Shorteners"] = vector_counts.get("URL Shorteners", 0) + 1
            if lex.get("is_ip_host"):
                vector_counts["Raw IP Host"] = vector_counts.get("Raw IP Host", 0) + 1
            if lex.get("has_at_symbol"):
                vector_counts["@ Redirection"] = vector_counts.get("@ Redirection", 0) + 1

            for b in lex.get("spoofed_brands", []):
                brand_counts[b] = brand_counts.get(b, 0) + 1
            for b in fh.get("abused_brands", []):
                brand_counts[b] = brand_counts.get(b, 0) + 1

            for tok in s.get("tokens", []):
                tok_str = tok.get("token", "").lower()
                w = tok.get("weight", tok.get("attention_weight", 0.0))
                if len(tok_str) > 2 and w > 0.4:
                    token_weights[tok_str] = max(token_weights.get(tok_str, 0.0), w)

        top_brands = [{"brand": k, "count": v} for k, v in sorted(brand_counts.items(), key=lambda x: -x[1])[:5]]
        top_vectors = [{"vector": k, "count": v} for k, v in sorted(vector_counts.items(), key=lambda x: -x[1])[:5]]
        top_flagged_tokens = [{"token": k, "weight": round(v, 4)} for k, v in sorted(token_weights.items(), key=lambda x: -x[1])[:8]]

        return {
            "total_scans": total_scans,
            "phishing_detected": phishing_count,
            "legitimate_scanned": legit_count,
            "phishing_rate": round((phishing_count / total_scans * 100), 1) if total_scans > 0 else 0.0,
            "latency_by_mode": {
                "teacher_attention_avg_ms": avg_teacher_lat,
                "onnx_student_avg_ms": avg_student_lat
            },
            "top_attack_vectors": top_vectors,
            "top_targeted_brands": top_brands,
            "top_flagged_tokens": top_flagged_tokens,
            "feedback_count": len(self._mem_feedback) if not self.is_connected else self.db.analyst_feedback.count_documents({}),
            "db_status": self.get_health()
        }

# Global database manager instance
db_manager = DatabaseManager()

def get_db():
    """Returns database manager instance."""
    return db_manager
