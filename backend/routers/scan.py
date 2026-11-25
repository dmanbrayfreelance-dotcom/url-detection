"""
Scan router for single URL inspection.
"""
from fastapi import APIRouter, HTTPException, Query
from ..schemas.url_scan import ScanRequest, ScanResponse
from ..services.inference_service import inference_service
from ..core.db import get_db

router = APIRouter(prefix="/scan", tags=["URL Scanner"])

@router.post("", response_model=ScanResponse, summary="Inspect raw URL without live page visits")
async def scan_single_url(request: ScanRequest):
    """
    Executes zero-visit phishing URL inspection with multi-embedding fusion attention
    or distilled ONNX student inference. Returns verdict, confidence, tokens, guards, and latency.
    Persists scan event into MongoDB Atlas scan_logs collection.
    """
    if not request.url or not request.url.strip():
        raise HTTPException(status_code=400, detail="Target URL cannot be empty")

    mode = request.inference_mode or "teacher_attention"
    if mode not in ["teacher_attention", "onnx_student"]:
        raise HTTPException(status_code=400, detail="Invalid inference mode. Choose 'teacher_attention' or 'onnx_student'")

    result = inference_service.scan_url(request.url.strip(), mode=mode)
    return result

@router.get("/{scan_id}", response_model=ScanResponse, summary="Get past scan by ID")
async def get_scan_details(scan_id: str):
    db = get_db()
    scan = db.get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found")
    return scan
