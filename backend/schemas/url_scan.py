"""
Pydantic Schemas for TrackPhish URL scanning, explainability, batch jobs, and feedback.
Fully aligned with MongoDB Atlas collections: scan_logs, batch_jobs, analyst_feedback.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class TokenItem(BaseModel):
    token: str
    weight: float
    risk_tag: str = "normal"  # critical, high, moderate, low, normal
    start: Optional[int] = None
    end: Optional[int] = None
    category: Optional[str] = None
    color: Optional[str] = None
    rationales: List[str] = []

class GuardsBreakdown(BaseModel):
    free_host_guard: Dict[str, Any]
    homoglyph_guard: Dict[str, Any]
    lexical_entropy: Dict[str, Any]

class ScanRequest(BaseModel):
    url: str = Field(..., description="Target URL to inspect without live visits", example="https://pаypal.com/signin")
    inference_mode: str = Field(default="teacher_attention", description="'teacher_attention' (full explainability) or 'onnx_student' (ultra-low latency)")

class ScanResponse(BaseModel):
    id: str
    scan_id: Optional[str] = None
    url: str
    normalized_url: str
    verdict: str  # "phishing" or "legitimate"
    confidence: float
    risk_score: float
    model_mode: str  # "teacher_attention" or "onnx_student"
    latency_ms: float
    tokens: List[TokenItem]
    guards: GuardsBreakdown
    threat_indicators: List[str] = []
    created_at: str

    # Backward-compatible convenience fields for frontend / extension
    is_phishing: bool
    phishing_probability: float
    threat_level: str
    inference_mode: str
    inference_latency_ms: float
    homoglyph_analysis: Dict[str, Any]
    free_host_analysis: Dict[str, Any]
    lexical_analysis: Dict[str, Any]
    timestamp: str

class BatchScanRequest(BaseModel):
    urls: List[str] = Field(..., min_items=1, max_items=500)
    inference_mode: str = Field(default="onnx_student")

class BatchScanResponse(BaseModel):
    job_id: str
    batch_id: Optional[str] = None
    total_urls: int
    phishing_count: int
    legitimate_count: int
    avg_latency_ms: float
    total_time_ms: float
    status: str = "completed"
    results: List[ScanResponse]
    created_at: str

class FeedbackRequest(BaseModel):
    scan_id: Optional[str] = None
    url: str
    predicted_verdict: Optional[str] = "phishing"
    corrected_verdict: str = Field(..., description="'phishing' or 'legitimate'")
    notes: Optional[str] = None
    predicted_probability: Optional[float] = None
    analyst_name: Optional[str] = "Security Analyst"

class FeedbackResponse(BaseModel):
    id: str
    status: str
    message: str
    created_at: str

class AnalyticsResponse(BaseModel):
    total_scans: int
    phishing_detected: int
    legitimate_scanned: int
    phishing_rate: float
    latency_by_mode: Dict[str, float]
    top_attack_vectors: List[Dict[str, Any]]
    top_targeted_brands: List[Dict[str, Any]]
    top_flagged_tokens: List[Dict[str, Any]]
    feedback_count: int
    db_status: Dict[str, Any]
