"""
FastAPI Main Application Entry Point.
Mounts API routers for scan, batch, analytics, logs, and feedback.
Pre-configured with MongoDB Atlas connection management, CORS, and optional static frontend serving.
"""
import sys
from pathlib import Path

# Add project root to sys.path so ml_pipeline is directly importable
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.core.db import get_db
from backend.routers import scan, batch, analytics, logs, feedback

app = FastAPI(
    title="TrackPhish Enhanced API",
    description="Multi-Embedding Attention-Enhanced 1D CNN for Phishing URL Detection (IEEE TIFS 2025) with MongoDB Atlas",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(scan.router, prefix=settings.API_V1_STR)
app.include_router(batch.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(logs.router, prefix=settings.API_V1_STR)
app.include_router(feedback.router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["General"])
async def health_check():
    db = get_db()
    health = db.get_health()
    return {
        "status": "healthy",
        "service": "TrackPhish Enhanced Backend",
        "database": health
    }

# Check for production frontend build (e.g. Render / Docker single-service deployment)
FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"
if FRONTEND_DIST.exists():
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    if (FRONTEND_DIST / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", tags=["Frontend"])
    async def serve_spa(full_path: str):
        target = FRONTEND_DIST / full_path
        if full_path and target.exists() and target.is_file():
            return FileResponse(target)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/", tags=["General"])
    async def root():
        db = get_db()
        return {
            "project": "TrackPhish Enhanced",
            "reference": "IEEE TIFS 2025 (Kondaiah, Pais, and Rao)",
            "status": "operational",
            "docs_url": "/docs",
            "api_v1": settings.API_V1_STR,
            "database": db.get_health()
        }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
