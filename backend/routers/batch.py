"""
Batch Scanner Router.
Accepts multiple URLs via JSON or CSV file upload and provides CSV/JSON report exports.
Endpoints: POST /api/v1/batch, POST /api/v1/batch/scan, POST /api/v1/batch/upload-csv
"""
import io
import csv
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import PlainTextResponse
from typing import List, Optional

from ..schemas.url_scan import BatchScanRequest, BatchScanResponse
from ..services.batch_service import batch_service

router = APIRouter(prefix="/batch", tags=["Batch Scanner"])

@router.post("", response_model=BatchScanResponse, summary="Scan a batch of URLs from JSON list")
async def scan_batch_root(request: BatchScanRequest):
    if not request.urls:
        raise HTTPException(status_code=400, detail="URL list cannot be empty")
    return batch_service.process_batch(request.urls, inference_mode=request.inference_mode)

@router.post("/scan", response_model=BatchScanResponse, summary="Scan a batch of URLs (alias)")
async def scan_batch_alias(request: BatchScanRequest):
    return await scan_batch_root(request)

@router.post("/upload-csv", response_model=BatchScanResponse, summary="Scan URLs from an uploaded CSV or TXT file")
async def scan_batch_csv(
    file: UploadFile = File(...),
    inference_mode: str = Form("onnx_student")
):
    if not file.filename.endswith((".csv", ".txt")):
        raise HTTPException(status_code=400, detail="Uploaded file must be a .csv or .txt file")

    content = await file.read()
    text = content.decode("utf-8", errors="ignore")

    urls = []
    reader = csv.reader(io.StringIO(text))
    for row in reader:
        if not row:
            continue
        first_col = row[0].strip()
        if first_col.lower() in ["url", "urls", "link", "domain"]:
            continue  # Skip header
        if first_col:
            urls.append(first_col)

    if not urls:
        raise HTTPException(status_code=400, detail="No valid URLs found in the uploaded file")

    urls = urls[:500]
    return batch_service.process_batch(urls, inference_mode=inference_mode)

@router.post("/export-csv", summary="Export batch results to CSV file string")
async def export_batch_csv(data: BatchScanResponse):
    csv_string = batch_service.generate_csv_report(data.model_dump())
    return PlainTextResponse(
        content=csv_string,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trackphish_scan_report.csv"}
    )
