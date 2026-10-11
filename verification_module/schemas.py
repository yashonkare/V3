"""Pydantic data schemas for inputs, step outputs, and final decision results."""
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field

class VerificationVerdict(str, Enum):
    ALLOWED = "Allowed"
    FLAGGED = "Flagged for Manual Review"
    REJECTED = "Rejected"

class MetadataSignatureCheck(BaseModel):
    creation_date: Optional[str] = None
    modification_date: Optional[str] = None
    creator: Optional[str] = None
    producer: Optional[str] = None
    title: Optional[str] = None
    author: Optional[str] = None
    page_count: int = 0
    has_digital_signature: bool = False
    signature_details: List[Dict[str, Any]] = Field(default_factory=list)
    is_modified_after_signing: bool = False
    anomalies: List[str] = Field(default_factory=list)
    tamper_risk_score: float = Field(..., description="Risk score from 0.0 (safe) to 1.0 (critical tamper risk)")

class TextExtractionResult(BaseModel):
    raw_text: str
    char_count: int
    page_count: int
    ocr_applied: bool = False
    ocr_warnings: List[str] = Field(default_factory=list)

class LegalEntities(BaseModel):
    cnr_numbers: List[str] = Field(default_factory=list)
    citations: List[str] = Field(default_factory=list)
    judge_names: List[str] = Field(default_factory=list)
    advocate_names: List[str] = Field(default_factory=list)
    extracted_quotes: List[str] = Field(default_factory=list)
    raw_ner_tokens: List[Dict[str, Any]] = Field(default_factory=list)

class QuoteMatchResult(BaseModel):
    quote: str
    canonical_citation: Optional[str] = None
    matched_canonical_text: Optional[str] = None
    similarity_score: float
    is_accurate: bool
    status: str  # "Verified", "Misquoted/Altered", "Unknown/Unindexed"

class SemanticVerificationResult(BaseModel):
    results: List[QuoteMatchResult] = Field(default_factory=list)
    average_similarity: float = 1.0
    misquote_detected: bool = False
    summary: str

class GroundingCaseData(BaseModel):
    cnr_number: str
    case_status: Optional[str] = None
    filing_date: Optional[str] = None
    court_name: Optional[str] = None
    presiding_judge: Optional[str] = None
    petitioner: Optional[str] = None
    respondent: Optional[str] = None
    source: str = "Mock/eCourts-API"
    verified: bool = False
    mismatches: List[str] = Field(default_factory=list)

class ExternalGroundingResult(BaseModel):
    api_status: str  # "SUCCESS", "TIMEOUT", "API_ERROR", "NO_CNR_FOUND", "MOCK_FALLBACK"
    grounded_cases: List[GroundingCaseData] = Field(default_factory=list)
    overall_grounding_score: float = 1.0
    error_message: Optional[str] = None

class StepScores(BaseModel):
    integrity_score: float = Field(..., description="1 - tamper_risk_score (0.0 - 1.0)")
    text_quality_score: float = Field(..., description="0.0 - 1.0 based on text readability/OCR confidence")
    entity_extraction_score: float = Field(..., description="0.0 - 1.0 based on completeness of legal citations & CNR")
    semantic_fidelity_score: float = Field(..., description="0.0 - 1.0 based on citation fidelity")
    external_grounding_score: float = Field(..., description="0.0 - 1.0 based on eCourts registry match")

class VerificationReport(BaseModel):
    verdict: VerificationVerdict
    confidence_score: float
    summary: str
    reasons: List[str]
    step_scores: StepScores
    check_1_cryptographic: MetadataSignatureCheck
    check_2_extraction: TextExtractionResult
    check_3_ner_entities: LegalEntities
    check_4_semantic_verification: SemanticVerificationResult
    check_5_external_grounding: ExternalGroundingResult
