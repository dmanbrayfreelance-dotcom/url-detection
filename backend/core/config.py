"""
Backend environment and application settings with MongoDB Atlas support.
"""
import os
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "TrackPhish Enhanced API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "chrome-extension://*",
        "*"
    ]

    # MongoDB Atlas Configuration
    MONGODB_USERNAME: str = os.getenv("MONGODB_USERNAME", "rakeyr213_db_user")
    MONGODB_PASSWORD: str = os.getenv("MONGODB_PASSWORD", "PZ8WlXLGDL1eYm47")
    MONGODB_URI: str = os.getenv(
        "MONGODB_URI",
        os.getenv(
            "MONGO_URI",
            "mongodb+srv://rakeyr213_db_user:PZ8WlXLGDL1eYm47@cluster0.jwoohac.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        )
    )
    MONGODB_DB_NAME: str = os.getenv(
        "MONGODB_DB_NAME",
        os.getenv("MONGO_DB_NAME", "trackphish_enhanced")
    )
    USE_IN_MEMORY_FALLBACK: bool = True

    # ML Inference Default
    DEFAULT_INFERENCE_MODE: str = "teacher_attention"  # or "onnx_student"

    class Config:
        env_file = ".env"
        extra = "ignore"
        case_sensitive = True

settings = Settings()
