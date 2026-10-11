"""FastAPI Application exposing the Authenticity & Reference Verification Service.

Endpoints:
- POST /api/v1/verify-document: Upload PDF file for complete 6-step verification
- GET /api/v1/health: Service health and configured model states
- GET /api/v1/canonical-cases: Inspect current indexed landmark cases
"""
import os
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import logging

from .config import settings
from .schemas import VerificationReport
from .pipeline import run_verification_pipeline
from .semantic_verifier import CANONICAL_LEGAL_DATABASE

# Logging configuration
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("court_verification_service")

app = FastAPI(
    title="Court Review Authenticity & Reference Verification Service",
    description="Automated 6-stage verification pipeline for Indian judicial pleadings, e-Signs, and citation fidelity.",
    version="1.0.0"
)

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", include_in_schema=False)
async def serve_root_ui():
    """Serves the interactive web portal."""
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Court Review Verification API is active."}

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """Health status and configuration diagnostics."""
    return {
        "status": "healthy",
        "service": "Authenticity & Reference Verification Module",
        "models": {
            "ner_model": settings.NER_MODEL_NAME,
            "sentence_bert_model": settings.SBERT_MODEL_NAME
        },
        "ecourts_api_endpoint": settings.ECOURTS_API_URL,
        "ecourts_api_configured": bool(settings.ECOURTS_API_KEY)
    }

@app.get("/api/v1/canonical-cases", tags=["Reference Data"])
async def list_canonical_cases():
    """Returns the list of indexed landmark precedents used for semantic quote verification."""
    return {
        "count": len(CANONICAL_LEGAL_DATABASE),
        "precedents": [
            {"citation": k, "title": v["title"], "holding": v["holding"]}
            for k, v in CANONICAL_LEGAL_DATABASE.items()
        ]
    }

@app.post(
    "/api/v1/verify-document",
    response_model=VerificationReport,
    tags=["Verification Pipeline"],
    summary="Verify PDF Document Authenticity & Citations"
)
async def verify_court_document(
    file: UploadFile = File(..., description="Uploaded legal petition, affidavit, or court decree in PDF format.")
):
    """Executes sequential 6-step authenticity verification pipeline:
    
    1. **Cryptographic & Metadata Check**: Inspects signatures, byte range modifications, and producer anomalies.
    2. **OCR & Text Extraction**: Extracts textual layer, fallback to OCR on scanned orders.
    3. **NLP Citation & Entity Extraction**: Identifies 16-char CNR, citations (AIR/SCC), judges, and advocates.
    4. **Semantic Verification**: Evaluates quoted legal holding similarity to detect altered dicta.
    5. **External API Grounding**: Queries eCourts registry API for case validation and judge consistency.
    6. **Decision Matrix Engine**: Computes scores and yields verdict: 'Allowed', 'Flagged for Manual Review', or 'Rejected'.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF documents (.pdf) are supported."
        )

    try:
        pdf_bytes = await file.read()
        if len(pdf_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

        report = await run_verification_pipeline(pdf_bytes)
        return report

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Unhandled error during document verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification pipeline failed: {str(e)}"
        )
