"""Step 6: Decision Engine & Evaluation Matrix.

Aggregates scores from:
1. Cryptographic & Metadata Check (Tamper Risk Score)
2. Text Extraction & OCR Reliability
3. Legal Citation & Entity Validity
4. Semantic Citation & Quote Fidelity
5. External eCourts Grounding Consistency

Applies a multi-factor decision matrix to categorize documents into:
- 'Allowed' (High confidence authenticity)
- 'Flagged for Manual Review' (Moderate anomalies or unverified CNR)
- 'Rejected' (Critical tampering, fabricated citations, or active fraud)
"""
from typing import List, Tuple
from .config import settings
from .schemas import (
    MetadataSignatureCheck,
    TextExtractionResult,
    LegalEntities,
    SemanticVerificationResult,
    ExternalGroundingResult,
    StepScores,
    VerificationVerdict,
    VerificationReport
)

def evaluate_document_decision(
    check_1: MetadataSignatureCheck,
    check_2: TextExtractionResult,
    check_3: LegalEntities,
    check_4: SemanticVerificationResult,
    check_5: ExternalGroundingResult
) -> VerificationReport:
    """Evaluates multi-step findings and produces the final legal document verification report.
    
    Args:
        check_1: Cryptographic and metadata check results.
        check_2: OCR and text extraction results.
        check_3: Extracted entities (citations, judges, advocates, CNR).
        check_4: Semantic verification of quoted authorities.
        check_5: External eCourts API grounding.
        
    Returns:
        VerificationReport with final verdict, aggregated confidence score, reasons, and step scores.
    """
    reasons: List[str] = []

    # 1. Integrity Score (derived from tamper risk)
    integrity_score = round(max(0.0, 1.0 - check_1.tamper_risk_score), 3)

    # 2. Text Quality Score
    if check_2.char_count == 0:
        text_quality_score = 0.0
        reasons.append("Document text extraction yielded no content (empty document or failed OCR).")
    elif check_2.ocr_applied and len(check_2.ocr_warnings) > 0:
        text_quality_score = 0.70
        reasons.append("Document required OCR fallback with scanning/clarity warnings.")
    elif check_2.ocr_applied:
        text_quality_score = 0.85
    else:
        text_quality_score = 1.0

    # 3. Entity Extraction Score
    has_cnr = len(check_3.cnr_numbers) > 0
    has_citations = len(check_3.citations) > 0
    has_judges = len(check_3.judge_names) > 0

    if has_cnr and has_citations:
        entity_score = 1.0
    elif has_cnr or has_citations:
        entity_score = 0.80
    elif has_judges:
        entity_score = 0.60
    else:
        entity_score = 0.40
        reasons.append("No official CNR number or standard legal citations (SCC/AIR) detected.")

    # 4. Semantic Fidelity Score
    if check_4.misquote_detected:
        semantic_score = 0.20
        reasons.append("Critical Misquote Alert: Quoted precedent text deviates significantly from canonical judicial holding.")
    else:
        semantic_score = round(check_4.average_similarity, 3)

    # 5. External Grounding Score
    external_score = check_5.overall_grounding_score
    for case in check_5.grounded_cases:
        if case.mismatches:
            for m in case.mismatches:
                reasons.append(f"eCourts Grounding: {m}")

    # Build StepScores
    step_scores = StepScores(
        integrity_score=integrity_score,
        text_quality_score=text_quality_score,
        entity_extraction_score=entity_score,
        semantic_fidelity_score=semantic_score,
        external_grounding_score=external_score
    )

    # Weighted Confidence Score Aggregation
    # Weights: Integrity (30%), Semantic (25%), Grounding (25%), Extraction (10%), Entities (10%)
    weighted_confidence = (
        (integrity_score * 0.30) +
        (semantic_score * 0.25) +
        (external_score * 0.25) +
        (text_quality_score * 0.10) +
        (entity_score * 0.10)
    )
    weighted_confidence = round(max(0.0, min(1.0, weighted_confidence)), 3)

    # Hard Reject Conditions (immediate disqualification)
    critical_reject_conditions = [
        check_1.is_modified_after_signing,  # Tampered after cryptographic signing
        check_1.tamper_risk_score >= 0.75,   # Massive structural/tampering anomalies
        check_2.char_count == 0,             # Empty / corrupt file
        (check_4.misquote_detected and external_score < 0.4) # Fabricated quotes + ungrounded CNR
    ]

    # Manual Review Conditions
    flagged_conditions = [
        check_4.misquote_detected,           # Quoting discrepancy requires judicial inspection
        check_1.tamper_risk_score > settings.MAX_TAMPER_SCORE_FOR_APPROVAL,
        any(c.mismatches for c in check_5.grounded_cases), # Judge/Case detail discrepancy
        len(check_3.cnr_numbers) == 0,       # Missing mandatory case identifier
        weighted_confidence < settings.MIN_OVERALL_SCORE_FOR_APPROVAL,
        check_5.api_status == "TIMEOUT"      # Registry offline, human verification required
    ]

    if any(critical_reject_conditions):
        verdict = VerificationVerdict.REJECTED
        reasons.insert(0, "Document rejected due to critical cryptographic tampering or fraudulent modification.")
    elif any(flagged_conditions) or weighted_confidence < settings.MIN_OVERALL_SCORE_FOR_APPROVAL:
        verdict = VerificationVerdict.FLAGGED
        if not reasons:
            reasons.append("Document exhibits borderline anomalies requiring clerk/judicial manual review.")
    else:
        verdict = VerificationVerdict.ALLOWED
        reasons.append("Document verified: cryptographic structure intact, citations authentic, and grounded in court records.")

    summary_text = (
        f"Verdict: {verdict.value} (Confidence: {weighted_confidence * 100:.1f}%). "
        f"Integrity: {integrity_score:.2f}, Semantic Fidelity: {semantic_score:.2f}, "
        f"eCourts Grounding: {external_score:.2f}."
    )

    return VerificationReport(
        verdict=verdict,
        confidence_score=weighted_confidence,
        summary=summary_text,
        reasons=reasons,
        step_scores=step_scores,
        check_1_cryptographic=check_1,
        check_2_extraction=check_2,
        check_3_ner_entities=check_3,
        check_4_semantic_verification=check_4,
        check_5_external_grounding=check_5
    )
