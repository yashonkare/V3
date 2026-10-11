# Authenticity & Reference Verification Service

This module provides document authenticity checks, cryptographic tamper verification, legal entity extraction (InLegalBERT), semantic citation verification (InLegal-SBERT), and external eCourts CNR grounding.

## Requirements

Install the dependencies:
```bash
pip install -r requirements.txt
```

Required packages:
- `fastapi` & `uvicorn`: API server
- `pymupdf`: PDF text and metadata parsing
- `pycryptodome`: SHA-256 cryptographic hashing & signature verification
- `transformers` & `sentence-transformers`: InLegalBERT NER & InLegal-SBERT semantic verification
- `requests`: External court API query grounding
- `numpy`, `PIL`, `pytesseract`: OCR and image fallback for scanned pages
- `pydantic`, `python-multipart`: Request validation & file upload

## Running the API

Start the FastAPI verification server:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Or run directly:
```bash
python app.py
```

## Endpoints

### 1. Health Check
- **`GET /health`**
- Returns status and whether NLP models are loaded.

### 2. Verify Document
- **`POST /verify-document/`**
- Form-data: `file` (PDF file)
- **Response Format**:
```json
{
  "filename": "judgment.pdf",
  "decision": "Allowed" | "Flagged for Manual Review" | "Rejected",
  "diagnostics": {
    "metadata_check": {
      "tamper_score": 0,
      "is_signed": true,
      "hash_sha256": "...",
      "generator": "..."
    },
    "extracted_entities": {
      "cnr_numbers": ["DLHC010012342022"],
      "judges": ["Justice ..."],
      "advocates": ["Advocate ..."],
      "citations": ["AIR 2021 SC ..."]
    },
    "semantic_similarity_score": 0.9412,
    "external_api_grounding": {
      "DLHC010012342022": {
        "status": "Verified",
        "data": { ... }
      }
    }
  }
}
```
