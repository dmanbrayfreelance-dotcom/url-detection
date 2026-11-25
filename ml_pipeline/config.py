"""
Configuration constants and hyperparameters for TrackPhish Enhanced.
"""
from pathlib import Path
from pydantic import BaseModel
from typing import List, Dict, Set

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"
CHECKPOINTS_DIR = ARTIFACTS_DIR / "checkpoints"
ONNX_DIR = ARTIFACTS_DIR / "onnx"
DATA_DIR = PROJECT_ROOT / "data"
SAMPLES_DIR = DATA_DIR / "samples"

CHECKPOINTS_DIR.mkdir(parents=True, exist_ok=True)
ONNX_DIR.mkdir(parents=True, exist_ok=True)

class ModelConfig(BaseModel):
    # Sequence & Tokenizer settings
    max_sequence_length: int = 128
    vocab_size: int = 20000
    subword_min_n: int = 3
    subword_max_n: int = 6

    # Embedding Dimensions
    word2vec_dim: int = 100
    fasttext_dim: int = 100
    glove_dim: int = 100
    transformer_dim: int = 128  # Projected contextual embedding dim (from 768 or direct projection)
    total_embedding_dim: int = 428  # 100 + 100 + 100 + 128

    # Fusion Attention settings
    fusion_hidden_dim: int = 128
    attention_heads: int = 4
    scaled_dot_product: bool = True

    # 1D CNN Architecture settings
    cnn_filters_1: int = 128
    cnn_filters_2: int = 128
    kernel_size: int = 3
    dense_dim_1: int = 256
    dropout_rate: float = 0.2
    dense_dim_2: int = 128

    # Training settings
    batch_size: int = 32
    learning_rate: float = 1e-3
    weight_decay: float = 1e-4
    epochs: int = 10
    temperature: float = 3.0  # For Knowledge Distillation
    alpha_distillation: float = 0.6  # Weight for KD loss vs Hard Label loss

    # Distilled Student Settings
    student_dim: int = 96
    student_filters: int = 64
    student_kernel: int = 3

DEFAULT_MODEL_CONFIG = ModelConfig()

# Known Free Hosting / Site Builders
KNOWN_FREE_HOSTS: Set[str] = {
    "sites.google.com",
    "wixsite.com",
    "wordpress.com",
    "weebly.com",
    "github.io",
    "gitlab.io",
    "netlify.app",
    "firebaseapp.com",
    "web.app",
    "pages.dev",
    "vercel.app",
    "webflow.io",
    "glitch.me",
    "surge.sh",
    "pantheonsite.io",
    "blogspot.com",
    "appspot.com",
    "render.com",
    "fly.dev",
    "000webhostapp.com",
    "myshopify.com",
    "mystrikingly.com",
    "carrd.co",
    "bravesites.com",
    "jimdofree.com"
}

# Known URL Shorteners
KNOWN_SHORTENERS: Set[str] = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "is.gd",
    "cutt.ly",
    "ow.ly",
    "rebrand.ly",
    "rb.gy",
    "shorturl.at",
    "goo.gl",
    "buff.ly",
    "bl.ink",
    "t.ly",
    "soo.gd",
    "s.id",
    "trib.al",
    "lnkd.in"
}

# High-Value Targeted Brands and their legitimate authoritative domain tokens
TARGET_BRANDS: Dict[str, List[str]] = {
    "paypal": ["paypal.com", "paypal-communication.com"],
    "google": ["google.com", "google.co.uk", "google.co.in", "google.ca", "gmail.com", "youtube.com"],
    "microsoft": ["microsoft.com", "microsoftonline.com", "live.com", "office.com", "office365.com", "outlook.com", "azure.com"],
    "apple": ["apple.com", "icloud.com"],
    "amazon": ["amazon.com", "amazon.co.uk", "amazon.de", "amazon.in", "amazon.co.jp", "aws.amazon.com"],
    "netflix": ["netflix.com"],
    "chase": ["chase.com", "jpmorganchase.com"],
    "bankofamerica": ["bankofamerica.com", "bofa.com"],
    "wellsfargo": ["wellsfargo.com"],
    "binance": ["binance.com", "binance.us"],
    "coinbase": ["coinbase.com"],
    "facebook": ["facebook.com", "fb.com", "meta.com"],
    "instagram": ["instagram.com"],
    "steam": ["steampowered.com", "steamcommunity.com"],
    "dhl": ["dhl.com", "dhl-usa.com", "dhl.de"],
    "fedex": ["fedex.com"],
    "usps": ["usps.com"],
    "ups": ["ups.com"],
    "adobe": ["adobe.com"],
    "linkedin": ["linkedin.com"],
    "twitter": ["twitter.com", "x.com"],
    "dropbox": ["dropbox.com"],
    "yahoo": ["yahoo.com", "yahoo.co.jp"]
}

# Suspicious TLDs frequently abused in rapid phishing campaigns
SUSPICIOUS_TLDS: Set[str] = {
    "xyz", "top", "cc", "tk", "ml", "ga", "cf", "gq", "work", "click", "buzz",
    "icu", "monster", "rest", "cam", "fit", "sbs", "cfd", "live-security", "support"
}
