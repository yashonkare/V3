"""Unit and integration tests for the Authenticity & Reference Verification pipeline."""
import pytest
import fitz  # PyMuPDF
from fastapi.testclient import TestClient

from verification_module.main import app
from verification_module.cryptographic_verifier import check_pdf_integrity
from verification_module.text_extractor import extract_document_text
from verification_module.ner_extractor import ner_extractor
from verification_module.semantic_verifier import semantic_verifier
from verification_module.decision_engine import evaluate_document_decision
from verification_module.schemas import VerificationVerdict, ExternalGroundingResult, GroundingCaseData

client = TestClient(app)

def create_sample_legal_pdf(text: str, producer: str = "Acrobat Distiller 15.0") -> bytes:
    """Utility to generate an in-memory PDF document with given text and metadata."""
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text, fontsize=11)
    doc.set_metadata({
        "producer": producer,
        "creator": "Official e-Filing Portal",
        "creationDate": "D:20240115103000+05'30'",
        "modDate": "D:20240115103000+05'30'"
    })
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "models" in data

def test_canonical_cases_endpoint():
    response = client.get("/api/v1/canonical-cases")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 5

def test_cryptographic_verifier_clean_doc():
    pdf_bytes = create_sample_legal_pdf("High Court of Delhi\nCase Title: State v. Kumar")
    result = check_pdf_integrity(pdf_bytes)
    assert result.page_count == 1
    assert result.is_modified_after_signing is False
    assert result.tamper_risk_score <= 0.30

def test_cryptographic_verifier_suspicious_producer():
    pdf_bytes = create_sample_legal_pdf("Sample petition", producer="iLovePDF Online Tool")
    result = check_pdf_integrity(pdf_bytes)
    assert any("online PDF editor" in a for a in result.anomalies)
    assert result.tamper_risk_score >= 0.35

def test_text_extractor():
    sample_text = "CNR Number: DLHC010012342023. IN THE HIGH COURT OF DELHI AT NEW DELHI."
    pdf_bytes = create_sample_legal_pdf(sample_text)
    result = extract_document_text(pdf_bytes)
    assert "DLHC010012342023" in result.raw_text
    assert result.char_count > 20

def test_ner_extractor():
    text = (
        "CNR: DLHC010012342023\n"
        "In the High Court of Delhi.\n"
        "CORAM: Hon'ble Mr. Justice Manmohan and Justice Sanjiv Khanna\n"
        "APPEARANCES: Mr. Kapil Sibal, Sr. Adv. for the Petitioner.\n"
        "Reliance is placed on AIR 1950 SC 27 and (2017) 10 SCC 1.\n"
        'The court noted that "There is no doubt that the word \'law\' in Article 21 has been used in the sense of state-made law".'
    )
    entities = ner_extractor.extract_entities(text)
    assert "DLHC010012342023" in entities.cnr_numbers
    assert any("AIR 1950 SC 27" in c for c in entities.citations)
    assert any("Justice" in j for j in entities.judge_names)
    assert len(entities.extracted_quotes) >= 1

def test_semantic_verifier_accurate_quote():
    quote = "There is no doubt that the word 'law' in Article 21 has been used in the sense of state-made law and not as an equivalent of law in the abstract or general principles of natural justice."
    result = semantic_verifier.verify_quotes([quote], ["AIR 1950 SC 27"])
    assert result.misquote_detected is False
    assert result.results[0].is_accurate is True
    assert result.results[0].similarity_score >= 0.70

def test_semantic_verifier_tampered_quote():
    # Misquote intentionally falsifying the legal rule
    tampered_quote = "There is clear evidence that the word 'law' in Article 21 does completely exempt executive orders from constitutional scrutiny."
    result = semantic_verifier.verify_quotes([tampered_quote], ["AIR 1950 SC 27"])
    # Should flag misquote or not verify
    assert result.results[0].similarity_score < 0.78

def test_decision_engine_allowed():
    clean_pdf = create_sample_legal_pdf(
        "CNR: DLHC010012342023\n"
        "Hon'ble Mr. Justice Manmohan\n"
        "Citation: AIR 1950 SC 27\n"
        'Held: "There is no doubt that the word \'law\' in Article 21 has been used in the sense of state-made law and not as an equivalent of law in the abstract or general principles of natural justice."'
    )
    check_1 = check_pdf_integrity(clean_pdf)
    check_2 = extract_document_text(clean_pdf)
    check_3 = ner_extractor.extract_entities(check_2.raw_text)
    check_4 = semantic_verifier.verify_quotes(check_3.extracted_quotes, check_3.citations)
    check_5 = ExternalGroundingResult(
        api_status="SUCCESS",
        grounded_cases=[GroundingCaseData(cnr_number="DLHC010012342023", case_status="PENDING", presiding_judge="Hon'ble Mr. Justice Manmohan", verified=True)],
        overall_grounding_score=1.0
    )
    report = evaluate_document_decision(check_1, check_2, check_3, check_4, check_5)
    assert report.verdict in [VerificationVerdict.ALLOWED, VerificationVerdict.FLAGGED]
    assert report.confidence_score > 0.60

def test_fastapi_upload_endpoint():
    clean_pdf = create_sample_legal_pdf(
        "CNR: DLHC010012342023\nHon'ble Mr. Justice Manmohan\nCitation: AIR 1950 SC 27\n"
        'Precedent: "There is no doubt that the word \'law\' in Article 21 has been used in the sense of state-made law and not as an equivalent of law in the abstract or general principles of natural justice."'
    )
    response = client.post(
        "/api/v1/verify-document",
        files={"file": ("petition.pdf", clean_pdf, "application/pdf")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "verdict" in data
    assert "check_1_cryptographic" in data
    assert "check_2_extraction" in data
    assert "check_3_ner_entities" in data
    assert "check_4_semantic_verification" in data
    assert "check_5_external_grounding" in data
