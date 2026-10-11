"""Sequential Verification Pipeline Orchestrator.

Coordinates execution of steps 1 through 6 sequentially on an uploaded PDF document.
"""
import logging
from typing import Optional

from .schemas import VerificationReport
from .cryptographic_verifier import check_pdf_integrity
from .text_extractor import extract_document_text
from .ner_extractor import ner_extractor
from .semantic_verifier import semantic_verifier
from .external_grounder import ground_cnr_with_ecourts
from .decision_engine import evaluate_document_decision

logger = logging.getLogger(__name__)

async def run_verification_pipeline(pdf_bytes: bytes) -> VerificationReport:
    """Executes the complete 6-step Court Authenticity & Reference Verification pipeline.
    
    1. Cryptographic & Metadata Check (PyMuPDF + pycryptodome) -> Tamper Risk Score
    2. OCR & Text Extraction (PyMuPDF direct + Tesseract OCR fallback)
    3. NLP Citation Extraction (NER: CNR, Indian legal citations, judges, advocates)
    4. Semantic Verification (Sentence-BERT InLegal-Sbert against canonical precedents)
    5. External API Grounding (eCourts CNR Search API integration)
    6. Decision Engine (Aggregated Evaluation Matrix -> Allowed / Flagged / Rejected)
    
    Args:
        pdf_bytes: Uploaded PDF raw bytes.
        
    Returns:
        Comprehensive VerificationReport.
    """
    logger.info("Executing Step 1: Cryptographic & Metadata Verification...")
    check_1 = check_pdf_integrity(pdf_bytes)

    logger.info("Executing Step 2: OCR & Text Extraction...")
    check_2 = extract_document_text(pdf_bytes)

    logger.info("Executing Step 3: Legal NER & Citation Extraction...")
    check_3 = ner_extractor.extract_entities(check_2.raw_text)

    logger.info("Executing Step 4: Semantic Verification on Quoted Authorities...")
    check_4 = semantic_verifier.verify_quotes(
        extracted_quotes=check_3.extracted_quotes,
        citations=check_3.citations
    )

    logger.info("Executing Step 5: External eCourts API Grounding...")
    check_5 = await ground_cnr_with_ecourts(
        cnr_numbers=check_3.cnr_numbers,
        extracted_judges=check_3.judge_names
    )

    logger.info("Executing Step 6: Decision Engine Multi-Factor Matrix...")
    report = evaluate_document_decision(
        check_1=check_1,
        check_2=check_2,
        check_3=check_3,
        check_4=check_4,
        check_5=check_5
    )

    return report
