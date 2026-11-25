"""
Scan Audit Logs Router.
GET /api/v1/logs: paginated scan audit logs from MongoDB scan_logs collection with search & filter.
"""
from fastapi import APIRouter, Query
from typing import List, Optional
from ..schemas.url_scan import ScanResponse
from ..core.db import get_db

router = APIRouter(prefix="/logs", tags=["Audit Logs"])

@router.get("", response_model=List[ScanResponse], summary="Get paginated history of scanned URLs from MongoDB")
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    search: Optional[str] = Query(None, description="Search keyword in URL"),
    verdict: Optional[str] = Query(None, description="'all', 'phishing', or 'legitimate'")
):
    db = get_db()
    return db.get_scan_logs(limit=limit, skip=skip, search=search, verdict=verdict)
