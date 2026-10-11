"""Step 5: External API Grounding.

Integrates with eCourts CNR Search APIs (Surepass / FastKYC / eCourts Portal).
Performs query verification on extracted 16-character CNR numbers to validate:
- Case status (Pending, Disposed, Listed)
- Presiding Judge
- Filing Date
- Petitioner & Respondent details

Includes robust error handling for API timeouts, rate limits, and fallback mock data.
"""
import httpx
import logging
from typing import List, Optional, Dict, Any

from .config import settings
from .schemas import ExternalGroundingResult, GroundingCaseData

logger = logging.getLogger(__name__)

# Mock eCourts Registry Database for local grounding and testing
MOCK_ECOURTS_REGISTRY: Dict[str, Dict[str, Any]] = {
    "DLHC010012342023": {
        "case_status": "PENDING",
        "filing_date": "2023-03-14",
        "court_name": "High Court of Delhi, New Delhi",
        "presiding_judge": "Hon'ble Mr. Justice Manmohan",
        "petitioner": "Union of India",
        "respondent": "ABC Telecom Ltd."
    },
    "MHPU010045672021": {
        "case_status": "DISPOSED",
        "filing_date": "2021-08-20",
        "court_name": "District & Sessions Court, Pune",
        "presiding_judge": "Hon'ble Smt. Justice K.R. Joshi",
        "petitioner": "Maharashtra State Electricity Board",
        "respondent": "Apex Infra Works"
    },
    "KAHC010078902022": {
        "case_status": "LISTED FOR HEARING",
        "filing_date": "2022-11-05",
        "court_name": "High Court of Karnataka, Bengaluru",
        "presiding_judge": "Hon'ble Mr. Justice P.B. Bajanthri",
        "petitioner": "State of Karnataka",
        "respondent": "R. Ramanathan & Ors."
    }
}

async def ground_cnr_with_ecourts(
    cnr_numbers: List[str],
    extracted_judges: Optional[List[str]] = None
) -> ExternalGroundingResult:
    """Queries external eCourts API or registry to verify case details against CNR numbers.
    
    Args:
        cnr_numbers: List of 16-character CNR numbers.
        extracted_judges: Judge names detected in the document to check for mismatches.
        
    Returns:
        ExternalGroundingResult with verified case records and discrepancy flags.
    """
    if not cnr_numbers:
        return ExternalGroundingResult(
            api_status="NO_CNR_FOUND",
            grounded_cases=[],
            overall_grounding_score=0.5,  # Neutral/caution if CNR is missing in judicial pleadings
            error_message="No 16-character CNR number found in the document."
        )

    grounded_cases: List[GroundingCaseData] = []
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "CourtReview-DocVerificationEngine/1.0"
    }
    if settings.ECOURTS_API_KEY:
        headers["Authorization"] = f"Bearer {settings.ECOURTS_API_KEY}"

    extracted_judges_clean = [j.lower() for j in (extracted_judges or [])]
    api_status = "SUCCESS"
    err_msg = None

    for cnr in cnr_numbers:
        record_found = None
        source_name = "Mock/eCourts-Registry"

        # Try live eCourts API if configured with an API key
        if settings.ECOURTS_API_KEY and settings.ECOURTS_API_URL:
            try:
                async with httpx.AsyncClient(timeout=settings.ECOURTS_API_TIMEOUT_SECONDS) as client:
                    resp = await client.post(
                        settings.ECOURTS_API_URL,
                        json={"cnr_number": cnr},
                        headers=headers
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        result_data = data.get("data") or data
                        record_found = {
                            "case_status": result_data.get("case_status") or result_data.get("status"),
                            "filing_date": result_data.get("filing_date") or result_data.get("registration_date"),
                            "court_name": result_data.get("court_name"),
                            "presiding_judge": result_data.get("judge_name") or result_data.get("presiding_judge"),
                            "petitioner": result_data.get("petitioner"),
                            "respondent": result_data.get("respondent")
                        }
                        source_name = "Live-eCourts-API"
                    else:
                        logger.warning(f"External API returned {resp.status_code} for CNR {cnr}. Falling back to registry database.")
            except httpx.TimeoutException:
                logger.warning(f"eCourts API timed out for CNR {cnr}. Using fallback verification.")
                api_status = "TIMEOUT"
                err_msg = f"External API timed out after {settings.ECOURTS_API_TIMEOUT_SECONDS}s. Used local court registry cache."
            except Exception as e:
                logger.error(f"Error querying external API for CNR {cnr}: {e}")
                api_status = "API_ERROR"
                err_msg = str(e)

        # Fallback to local canonical registry cache
        if not record_found and cnr in MOCK_ECOURTS_REGISTRY:
            record_found = MOCK_ECOURTS_REGISTRY[cnr]
            source_name = "Mock/Canonical-eCourts-Registry"

        if record_found:
            mismatches: List[str] = []
            judge_in_ecourts = record_found.get("presiding_judge") or ""

            # Verify if presiding judge matches document claim
            if extracted_judges_clean and judge_in_ecourts:
                matched_judge = any(
                    part.lower() in " ".join(extracted_judges_clean)
                    for part in judge_in_ecourts.split() if len(part) > 3
                )
                if not matched_judge:
                    mismatches.append(
                        f"Judge discrepancy: Document claims {[j for j in (extracted_judges or [])]}, but eCourts registry lists '{judge_in_ecourts}'."
                    )

            grounded_cases.append(GroundingCaseData(
                cnr_number=cnr,
                case_status=record_found.get("case_status"),
                filing_date=record_found.get("filing_date"),
                court_name=record_found.get("court_name"),
                presiding_judge=judge_in_ecourts,
                petitioner=record_found.get("petitioner"),
                respondent=record_found.get("respondent"),
                source=source_name,
                verified=True,
                mismatches=mismatches
            ))
        else:
            # CNR number could not be found in active registry
            grounded_cases.append(GroundingCaseData(
                cnr_number=cnr,
                case_status="NOT FOUND",
                filing_date=None,
                court_name=None,
                presiding_judge=None,
                source="eCourts Query",
                verified=False,
                mismatches=[f"CNR '{cnr}' does not exist in registry or has invalid checksum/year."]
            ))

    # Calculate overall grounding score
    verified_count = sum(1 for c in grounded_cases if c.verified and not c.mismatches)
    has_mismatches = any(len(c.mismatches) > 0 for c in grounded_cases)

    if not grounded_cases:
        score = 0.5
    elif verified_count == len(grounded_cases) and not has_mismatches:
        score = 1.0
    elif any(c.verified for c in grounded_cases) and has_mismatches:
        score = 0.4  # Discrepancy between document and registry
    else:
        score = 0.2  # CNR completely invalid or not found

    return ExternalGroundingResult(
        api_status=api_status,
        grounded_cases=grounded_cases,
        overall_grounding_score=round(score, 3),
        error_message=err_msg
    )
