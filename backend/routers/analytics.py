"""
Analytics & SOC Threat Metrics Router.
GET /api/v1/analytics: summary counts, phishing vs. legitimate ratio, latency by mode, top flagged tokens/domains.
"""
from fastapi import APIRouter
from ..schemas.url_scan import AnalyticsResponse
from ..core.db import get_db

router = APIRouter(prefix="/analytics", tags=["Threat Analytics"])

@router.get("", response_model=AnalyticsResponse, summary="Get summary threat intelligence metrics from MongoDB")
async def get_analytics_root():
    db = get_db()
    return db.get_analytics()

@router.get("/overview", response_model=AnalyticsResponse, summary="Get summary threat intelligence metrics (alias)")
async def get_overview():
    return await get_analytics_root()
