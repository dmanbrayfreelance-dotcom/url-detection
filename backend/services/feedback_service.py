"""
Analyst Feedback Service.
Captures false positives, false negatives, and verified threat labels
into MongoDB Atlas `analyst_feedback` collection.
"""
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from ..core.db import get_db

class FeedbackService:
    def __init__(self):
        self.db = get_db()

    def record_feedback(
        self,
        url: str,
        predicted_verdict: str,
        corrected_verdict: str,
        scan_id: Optional[str] = None,
        notes: Optional[str] = None,
        predicted_prob: Optional[float] = None,
        analyst_name: Optional[str] = "Security Analyst"
    ) -> Dict[str, Any]:
        """Stores feedback entry into MongoDB Atlas `analyst_feedback` collection."""
        feedback_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        doc = {
            "id": feedback_id,
            "scan_id": scan_id or "",
            "url": url,
            "predicted_verdict": predicted_verdict,
            "corrected_verdict": corrected_verdict,
            "notes": notes or "",
            "predicted_probability": predicted_prob,
            "analyst_name": analyst_name,
            "created_at": created_at
        }
        self.db.insert_feedback(doc)
        return doc

    def list_feedback(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves feedback list."""
        return self.db.get_feedback_list(limit=limit)

feedback_service = FeedbackService()
