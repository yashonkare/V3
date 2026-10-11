# Court Document Authenticity & Reference Verification Module

A modular, production-ready Python / FastAPI verification engine designed for Indian court review applications. It accepts legal PDF documents (petitions, affidavits, judicial decrees) and runs a sequential 6-stage authenticity pipeline.

---

## 🏛 Pipeline Architecture

```
[ Uploaded Court PDF ]
         │
         ▼
[ Step 1: Cryptographic & Metadata Check ]
    - Extracts creation/mod dates, generator tools via PyMuPDF
    - Inspects /ByteRange & PKCS#7 signatures via PyCryptodome
    - Detects post-signing modifications & online editor scrubbing
    - Returns Tamper Risk Score (0.0 to 1.0)
         │
         ▼
[ Step 2: OCR & Text Extraction ]
    - Direct textual layer extraction via PyMuPDF (fitz)
    - Automatic page density heuristic: scans < 40 chars trigger Tesseract OCR fallback
    - Image enhancement & DPI resolution tuning
         │
         ▼
[ Step 3: NLP Citation & Entity Extraction (NER) ]
    - Hugging Face `evolawyer/inlegalbert-sc-ner-silver` / `law-ai/InLegalBERT`
    - High-precision regular expressions for 16-character eCourts CNR numbers
    - Identifies legal citations (AIR, SCC, SCALE, SCR), Judge names, and Advocates
    - Extracts quoted legal holding passages
         │
         ▼
[ Step 4: Semantic Verification ]
    - Uses `bhavyagiri/InLegal-Sbert` (Sentence-BERT) embeddings
    - Cosine similarity evaluation against indexed canonical landmark precedents
    - Flags subtle misquotes, altered constitutional dicta, or fabricated precedents
         │
         ▼
[ Step 5: External API Grounding ]
    - Grounding against eCourts CNR Search APIs (Surepass / FastKYC / registry scraper)
    - Verifies case status (PENDING/DISPOSED), filing date, and court jurisdiction
    - Detects judge discrepancies between claims and registry records
    - Graceful fallback with timeouts (default: 10s) and local court cache
         │
         ▼
[ Step 6: Decision Engine Matrix ]
    - Weighted multi-factor aggregation:
      • Document Integrity (30%)
      • Semantic Quote Fidelity (25%)
      • eCourts Grounding (25%)
      • Text Quality / OCR (10%)
      • Legal Entity Extraction (10%)
    - Categorizes into:
      • "Allowed"
      • "Flagged for Manual Review"
      • "Rejected"
```

---

## 📁 Directory Structure

```
verification_module/
├── __init__.py                # Package entrypoint exports
├── config.py                  # Pydantic Settings & environment variables
├── cryptographic_verifier.py  # Step 1: PyMuPDF + PyCryptodome inspection
├── text_extractor.py          # Step 2: Text extraction + Tesseract OCR fallback
├── ner_extractor.py           # Step 3: InLegalBERT NER & citation parser
├── semantic_verifier.py       # Step 4: InLegal-Sbert quote verification
├── external_grounder.py       # Step 5: eCourts API grounding & timeout handler
├── decision_engine.py         # Step 6: Multi-factor evaluation matrix
├── pipeline.py                # Sequential pipeline orchestrator
├── main.py                    # FastAPI application & REST endpoints
├── schemas.py                 # Pydantic schemas & response models
├── tests.py                   # Pytest test suite for all 6 steps
└── requirements.txt           # Python dependency specifications
```

---

## 🚀 Getting Started

### 1. Installation

Create a virtual environment and install dependencies:
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r verification_module/requirements.txt
```

### 2. Environment Variables (Optional)

Create a `.env` file or export environment variables:
```env
# Models
NER_MODEL_NAME=evolawyer/inlegalbert-sc-ner-silver
SBERT_MODEL_NAME=bhavyagiri/InLegal-Sbert

# External eCourts API
ECOURTS_API_URL=https://api.surepass.io/api/v1/ecourts/cnr-search
ECOURTS_API_KEY=your_surepass_or_fastkyc_key
ECOURTS_API_TIMEOUT_SECONDS=10.0

# OCR Configuration (if Tesseract is in a custom path)
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

### 3. Running the FastAPI Server

```bash
uvicorn verification_module.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## 📡 API Endpoints

### 1. Document Verification
- **POST** `/api/v1/verify-document`
- **Content-Type**: `multipart/form-data`
- **Payload**: `file: <binary PDF>`

#### Sample JSON Response:
```json
{
  "verdict": "Allowed",
  "confidence_score": 0.94,
  "summary": "Verdict: Allowed (Confidence: 94.0%). Integrity: 0.90, Semantic Fidelity: 0.96, eCourts Grounding: 1.00.",
  "reasons": [
    "Document verified: cryptographic structure intact, citations authentic, and grounded in court records."
  ],
  "step_scores": {
    "integrity_score": 0.90,
    "text_quality_score": 1.00,
    "entity_extraction_score": 1.00,
    "semantic_fidelity_score": 0.96,
    "external_grounding_score": 1.00
  },
  "check_1_cryptographic": {
    "creation_date": "2024-01-15T10:30:00",
    "has_digital_signature": true,
    "is_modified_after_signing": false,
    "tamper_risk_score": 0.10,
    "anomalies": []
  },
  "check_2_extraction": {
    "char_count": 4210,
    "page_count": 3,
    "ocr_applied": false,
    "ocr_warnings": []
  },
  "check_3_ner_entities": {
    "cnr_numbers": ["DLHC010012342023"],
    "citations": ["AIR 1950 SC 27", "(2017) 10 SCC 1"],
    "judge_names": ["Hon'ble Mr. Justice Manmohan"],
    "advocate_names": ["Mr. Kapil Sibal, Sr. Adv."],
    "extracted_quotes": [
      "There is no doubt that the word 'law' in Article 21 has been used in the sense of state-made law..."
    ]
  },
  "check_4_semantic_verification": {
    "average_similarity": 0.9624,
    "misquote_detected": false,
    "summary": "Evaluated 1 quoted passage(s). Average semantic alignment: 0.96. No deliberate quote alteration detected.",
    "results": [
      {
        "quote": "There is no doubt that the word 'law' in Article 21...",
        "canonical_citation": "AIR 1950 SC 27",
        "similarity_score": 0.9624,
        "is_accurate": true,
        "status": "Verified"
      }
    ]
  },
  "check_5_external_grounding": {
    "api_status": "SUCCESS",
    "overall_grounding_score": 1.0,
    "grounded_cases": [
      {
        "cnr_number": "DLHC010012342023",
        "case_status": "PENDING",
        "filing_date": "2023-03-14",
        "court_name": "High Court of Delhi, New Delhi",
        "presiding_judge": "Hon'ble Mr. Justice Manmohan",
        "verified": true,
        "mismatches": []
      }
    ]
  }
}
```

### 2. Health & Model Diagnostics
- **GET** `/api/v1/health`

### 3. Canonical Legal Citations Cache
- **GET** `/api/v1/canonical-cases`

---

## 🧪 Running Tests

Execute the unit test suite:
```bash
pytest verification_module/tests.py -v
```
