"""
Analyst Feedback Router.
POST /api/v1/feedback: saves analyst label corrections to MongoDB Atlas analyst_feedback collection.
"""
from fastapi import APIRouter, HTTPException
from typing import List
from ..schemas.url_scan import FeedbackRequest, FeedbackResponse
from ..services.feedback_service import feedback_service

router = APIRouter(prefix="/feedback", tags=["Analyst Feedback Loop"])

@router.post("", response_model=FeedbackResponse, summary="Submit analyst label correction to MongoDB")
async def submit_feedback(req: FeedbackRequest):
    if not req.url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    if req.corrected_verdict not in ["phishing", "legitimate"]:
        raise HTTPException(status_code=400, detail="corrected_verdict must be 'phishing' or 'legitimate'")

    saved = feedback_service.record_feedback(
        url=req.url,
        predicted_verdict=req.predicted_verdict or "unknown",
        corrected_verdict=req.corrected_verdict,
        scan_id=req.scan_id,
        notes=req.notes,
        predicted_prob=req.predicted_probability,
        analyst_name=req.analyst_name
    )

    return {
        "id": saved["id"],
        "status": "success",
        "message": f"Analyst correction '{req.corrected_verdict}' logged to MongoDB analyst_feedback",
        "created_at": saved["created_at"]
    }

@router.get("", summary="List analyst feedback submissions")
async def list_feedback():
    return feedback_service.list_feedback()
