"""Step 2: OCR & Text Extraction.

Extracts text directly via PyMuPDF. If pages are scanned images (low character density),
gracefully falls back to Tesseract OCR with image preprocessing and robust error handling.
"""
import io
import fitz  # PyMuPDF
from PIL import Image
from typing import Tuple, List

from .config import settings
from .schemas import TextExtractionResult

def _extract_page_with_ocr(page: fitz.Page, page_num: int) -> Tuple[str, List[str]]:
    """Performs OCR on a rendered pixmap of a PDF page with error handling."""
    warnings: List[str] = []
    text = ""
    try:
        import pytesseract
        if settings.TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

        # Render page to high-res image pixmap
        zoom = settings.OCR_DPI / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img = Image.open(io.BytesIO(pix.tobytes("png")))

        # OCR extraction
        text = pytesseract.image_to_string(img, lang="eng")
    except ImportError:
        warnings.append(f"Page {page_num}: 'pytesseract' is not installed or configured. OCR skipped.")
    except Exception as e:
        warnings.append(f"Page {page_num}: OCR processing error ({str(e)}).")

    return text.strip(), warnings

def extract_document_text(pdf_bytes: bytes) -> TextExtractionResult:
    """Extracts text from PDF. If page text is sparse (scanned document), activates OCR fallback.
    
    Args:
        pdf_bytes: Raw bytes of PDF.
        
    Returns:
        TextExtractionResult with concatenated raw text, metadata, and OCR status.
    """
    ocr_applied = False
    ocr_warnings: List[str] = []
    page_texts: List[str] = []

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        return TextExtractionResult(
            raw_text="",
            char_count=0,
            page_count=0,
            ocr_applied=False,
            ocr_warnings=[f"Failed to parse PDF document for text extraction: {str(e)}"]
        )

    page_count = len(doc)

    for i, page in enumerate(doc):
        page_num = i + 1
        page_text = page.get_text("text").strip()

        # If page has fewer than 40 characters, it is likely a scanned judicial decree or stamped order
        if len(page_text) < 40:
            ocr_text, warnings = _extract_page_with_ocr(page, page_num)
            ocr_warnings.extend(warnings)
            if ocr_text:
                page_text = ocr_text
                ocr_applied = True
            elif not warnings:
                # Page was genuinely empty or blank
                pass

        page_texts.append(page_text)

    doc.close()
    combined_text = "\n\n".join(page_texts).strip()

    if not combined_text:
        ocr_warnings.append("Document yielded zero readable text. Please verify scan resolution or document contents.")

    return TextExtractionResult(
        raw_text=combined_text,
        char_count=len(combined_text),
        page_count=page_count,
        ocr_applied=ocr_applied,
        ocr_warnings=ocr_warnings
    )
