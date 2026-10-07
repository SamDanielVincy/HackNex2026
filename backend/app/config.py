import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_STORE_DIR = BASE_DIR / "data_store"
UPLOADS_DIR = DATA_STORE_DIR / "uploads"
ARTIFACTS_DIR = DATA_STORE_DIR / "artifacts"

# Ensure directories exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

APP_TITLE = "InsightForge AI - Self-Verifying Multi-Agent Data Analyst"
APP_VERSION = "1.0.0"
