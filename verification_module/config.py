"""Configuration and environment settings for Court Document Verification Module."""
import os
from pydantic import BaseModel, Field

class Settings(BaseModel):
    # Hugging Face Models
    NER_MODEL_NAME: str = os.getenv("NER_MODEL_NAME", "evolawyer/inlegalbert-sc-ner-silver")
    FALLBACK_NER_MODEL_NAME: str = os.getenv("FALLBACK_NER_MODEL_NAME", "law-ai/InLegalBERT")
    SBERT_MODEL_NAME: str = os.getenv("SBERT_MODEL_NAME", "bhavyagiri/InLegal-Sbert")

    # API Keys / External APIs
    ECOURTS_API_URL: str = os.getenv("ECOURTS_API_URL", "https://api.surepass.io/api/v1/ecourts/cnr-search")
    ECOURTS_API_KEY: str = os.getenv("ECOURTS_API_KEY", "")
    ECOURTS_API_TIMEOUT_SECONDS: float = float(os.getenv("ECOURTS_API_TIMEOUT_SECONDS", "10.0"))

    # OCR Settings
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "tesseract")
    OCR_DPI: int = int(os.getenv("OCR_DPI", "200"))

    # Scoring Thresholds
    SEMANTIC_SIMILARITY_THRESHOLD: float = float(os.getenv("SEMANTIC_SIMILARITY_THRESHOLD", "0.78"))
    MAX_TAMPER_SCORE_FOR_APPROVAL: float = float(os.getenv("MAX_TAMPER_SCORE_FOR_APPROVAL", "0.35"))
    MIN_OVERALL_SCORE_FOR_APPROVAL: float = float(os.getenv("MIN_OVERALL_SCORE_FOR_APPROVAL", "0.75"))
    MIN_OVERALL_SCORE_FOR_REVIEW: float = float(os.getenv("MIN_OVERALL_SCORE_FOR_REVIEW", "0.45"))

settings = Settings()
