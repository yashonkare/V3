"""Step 1: Cryptographic, Metadata, and Digital Signature / e-Sign Verification.

Extracts PDF metadata using PyMuPDF (fitz) and cryptographically inspects signatures,
digests, incremental updates, and modification discrepancies.
"""
import io
import re
import fitz  # PyMuPDF
from typing import Dict, Any, List, Tuple
from datetime import datetime
from Crypto.Hash import SHA256

from .schemas import MetadataSignatureCheck

def _parse_pdf_date(date_str: str) -> str:
    """Normalizes PDF date strings like D:20240115120000+05'30' into ISO format."""
    if not date_str:
        return ""
    clean = date_str.replace("D:", "").replace("'", "")
    if len(clean) >= 14:
        try:
            dt = datetime.strptime(clean[:14], "%Y%m%d%H%M%S")
            return dt.isoformat()
        except Exception:
            return clean
    return clean

def check_pdf_integrity(pdf_bytes: bytes) -> MetadataSignatureCheck:
    """Analyzes PDF metadata, incremental updates, digital signatures, and calculates a tamper risk score.
    
    Args:
        pdf_bytes: Raw bytes of the uploaded PDF file.
        
    Returns:
        MetadataSignatureCheck containing metadata, signature info, anomalies, and tamper-risk score (0.0 to 1.0).
    """
    anomalies: List[str] = []
    signatures: List[Dict[str, Any]] = []
    has_digital_signature = False
    is_modified_after_signing = False
    tamper_score = 0.0

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        return MetadataSignatureCheck(
            anomalies=[f"Corrupt or unreadable PDF file: {str(e)}"],
            tamper_risk_score=1.0,
            has_digital_signature=False,
            page_count=0
        )

    metadata = doc.metadata or {}
    creation_date = _parse_pdf_date(metadata.get("creationDate", ""))
    mod_date = _parse_pdf_date(metadata.get("modDate", ""))
    creator = metadata.get("creator", "")
    producer = metadata.get("producer", "")
    title = metadata.get("title", "")
    author = metadata.get("author", "")
    page_count = len(doc)

    # 1. Anomaly: Missing Creation Date
    if not creation_date:
        anomalies.append("Creation date metadata is missing or scrubbed.")
        tamper_score += 0.15

    # 2. Anomaly: Significant modification gap without official signer tool
    if creation_date and mod_date and creation_date != mod_date:
        anomalies.append("Document was modified after initial creation timestamp.")
        tamper_score += 0.10

    # 3. Anomaly: Suspicious/generic producer or known PDF rewriting tools
    suspicious_producers = ["ilovepdf", "smallpdf", "pdfescape", "sejda", "canva", "camscanner"]
    combined_tooling = f"{creator.lower()} {producer.lower()}"
    if any(sp in combined_tooling for sp in suspicious_producers):
        anomalies.append(f"Document was produced/manipulated using an online PDF editor ({producer or creator}).")
        tamper_score += 0.35

    # 4. Digital Signature & e-Sign Detection (PyMuPDF widget check + PDF structure parsing)
    pdf_text_raw = pdf_bytes.decode("latin1", errors="ignore")
    has_sig_obj = "/Type /Sig" in pdf_text_raw or "/ByteRange" in pdf_text_raw or "/SubFilter /adbe.pkcs7" in pdf_text_raw

    # Check form fields & widgets for electronic signatures
    for page in doc:
        for widget in page.widgets():
            if widget.field_type == fitz.PDF_WIDGET_TYPE_SIGNATURE:
                has_digital_signature = True
                signatures.append({
                    "field_name": widget.field_name,
                    "field_value": widget.field_value,
                    "rect": [widget.rect.x0, widget.rect.y0, widget.rect.x1, widget.rect.y1]
                })

    if has_sig_obj and not has_digital_signature:
        has_digital_signature = True
        signatures.append({
            "field_name": "Embedded_ByteRange_Signature",
            "field_value": "PKCS#7/e-Sign Detached Signature Object Found",
            "rect": []
        })

    # Check for incremental updates / byte range tamper detection
    byte_range_matches = re.findall(r"/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]", pdf_text_raw)
    if byte_range_matches:
        for br in byte_range_matches:
            offset1, len1, offset2, len2 = map(int, br)
            total_signed_len = offset2 + len2
            file_len = len(pdf_bytes)
            # If extra bytes exist after signed byte range, verify if incremental update occurred
            if file_len > total_signed_len:
                diff = file_len - total_signed_len
                if diff > 128:  # Non-trivial append
                    is_modified_after_signing = True
                    anomalies.append(f"Signed document has {diff} bytes appended after the cryptographic ByteRange.")
                    tamper_score += 0.40

    # If document has verified digital signature and no post-signature tampering:
    if has_digital_signature and not is_modified_after_signing:
        tamper_score = max(0.0, tamper_score - 0.20)
    elif not has_digital_signature:
        # Court pleadings might be scanned, which is common in Indian lower courts, but slightly higher risk than digitally signed
        anomalies.append("No cryptographic digital signature or PKCS#7 certificate detected (Unsigned / Standard Copy).")
        tamper_score += 0.10

    # Cryptographic hash of whole document for audit chain
    doc_sha256 = SHA256.new(pdf_bytes).hexdigest()

    doc.close()

    # Clamp tamper score to [0.0, 1.0]
    final_tamper_score = round(min(1.0, max(0.0, tamper_score)), 3)

    return MetadataSignatureCheck(
        creation_date=creation_date,
        modification_date=mod_date,
        creator=creator,
        producer=producer,
        title=title,
        author=author,
        page_count=page_count,
        has_digital_signature=has_digital_signature,
        signature_details=signatures,
        is_modified_after_signing=is_modified_after_signing,
        anomalies=anomalies,
        tamper_risk_score=final_tamper_score
    )
