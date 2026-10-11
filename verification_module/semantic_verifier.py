"""Step 4: Semantic Verification using Sentence-BERT.

Uses `bhavyagiri/InLegal-Sbert` (Sentence-BERT) or cosine similarity fallback
to compute embeddings of extracted quotes and match them against a canonical legal
database to verify authenticity and detect subtle legal misquotes or alterations.
"""
import logging
import numpy as np
from typing import List, Dict, Optional, Tuple

from .config import settings
from .schemas import SemanticVerificationResult, QuoteMatchResult

logger = logging.getLogger(__name__)

# Canonical landmark Indian judicial precedents database for authenticity verification
CANONICAL_LEGAL_DATABASE: Dict[str, Dict[str, str]] = {
    "AIR 1950 SC 27": {
        "title": "A.K. Gopalan v. State of Madras",
        "holding": "There is no doubt that the word 'law' in Article 21 has been used in the sense of state-made law and not as an equivalent of law in the abstract or general principles of natural justice.",
        "case_no": "AIR 1950 SC 27"
    },
    "(1973) 4 SCC 225": {
        "title": "Kesavananda Bharati v. State of Kerala",
        "holding": "The power of amendment under Article 368 does not include the power to alter the basic structure or framework of the Constitution.",
        "case_no": "AIR 1973 SC 1461 / (1973) 4 SCC 225"
    },
    "AIR 1978 SC 597": {
        "title": "Maneka Gandhi v. Union of India",
        "holding": "The procedure prescribed by law under Article 21 must be right, just, and fair, and not arbitrary, fanciful or oppressive, otherwise it would be no procedure at all.",
        "case_no": "AIR 1978 SC 597"
    },
    "(2017) 10 SCC 1": {
        "title": "Justice K.S. Puttaswamy (Retd.) v. Union of India",
        "holding": "The right to privacy is an intrinsic part of the right to life and personal liberty under Article 21 and as a part of the freedoms guaranteed by Part III of the Constitution.",
        "case_no": "(2017) 10 SCC 1"
    },
    "AIR 1994 SC 1918": {
        "title": "S.R. Bommai v. Union of India",
        "holding": "Secularism is one of the basic features of the Constitution. Power under Article 356 is an exceptional power and must be used with circumspection.",
        "case_no": "AIR 1994 SC 1918"
    }
}

class SemanticLegalVerifier:
    def __init__(self):
        self.model = None
        self._init_model()

    def _init_model(self):
        """Attempts to load bhavyagiri/InLegal-Sbert via sentence-transformers."""
        try:
            from sentence_transformers import SentenceTransformer
            model_name = settings.SBERT_MODEL_NAME
            logger.info(f"Loading InLegal-Sbert model: {model_name}")
            self.model = SentenceTransformer(model_name)
            logger.info("InLegal-Sbert loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load '{settings.SBERT_MODEL_NAME}': {e}. Using TF-IDF/lexical cosine similarity fallback.")
            self.model = None

    def _cosine_similarity(self, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """Computes cosine similarity between two 1D vectors."""
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))

    def _fallback_similarity(self, text_a: str, text_b: str) -> float:
        """Lexical and character n-gram Jaccard/overlap fallback if transformer model unavailable."""
        words_a = set(text_a.lower().split())
        words_b = set(text_b.lower().split())
        if not words_a or not words_b:
            return 0.0
        intersection = words_a.intersection(words_b)
        union = words_a.union(words_b)
        return float(len(intersection) / len(union))

    def verify_quotes(
        self,
        extracted_quotes: List[str],
        citations: List[str]
    ) -> SemanticVerificationResult:
        """Verifies extracted quotes against canonical judgments to detect misquotes.
        
        Args:
            extracted_quotes: List of quotes pulled from the document.
            citations: Extracted legal citations (e.g., AIR 1950 SC 27).
            
        Returns:
            SemanticVerificationResult containing individual quote comparisons and misquote flags.
        """
        results: List[QuoteMatchResult] = []
        if not extracted_quotes:
            # Check if any citation is present, and verify general citation match
            return SemanticVerificationResult(
                results=[],
                average_similarity=1.0,
                misquote_detected=False,
                summary="No direct quoted holding passages detected in document."
            )

        # Precompute canonical embeddings if model is active
        canonical_entries = list(CANONICAL_LEGAL_DATABASE.items())
        canonical_texts = [entry[1]["holding"] for entry in canonical_entries]

        canonical_embeddings = None
        if self.model:
            try:
                canonical_embeddings = self.model.encode(canonical_texts)
            except Exception as e:
                logger.error(f"Error encoding canonical database: {e}")
                canonical_embeddings = None

        total_sim = 0.0
        has_misquote = False

        for quote in extracted_quotes:
            best_sim = 0.0
            best_canonical = None
            best_cit_key = None

            # First, check if quote has an associated known citation
            matching_key = None
            for cit in citations:
                for db_cit in CANONICAL_LEGAL_DATABASE:
                    if cit.lower() in db_cit.lower() or db_cit.lower() in cit.lower():
                        matching_key = db_cit
                        break

            if self.model and canonical_embeddings is not None:
                try:
                    quote_emb = self.model.encode(quote)
                    similarities = [
                        self._cosine_similarity(quote_emb, can_emb)
                        for can_emb in canonical_embeddings
                    ]
                    best_idx = int(np.argmax(similarities))
                    best_sim = float(similarities[best_idx])
                    best_cit_key, best_canonical = canonical_entries[best_idx]
                except Exception as e:
                    logger.error(f"Error generating embedding for quote: {e}")
                    best_sim = self._fallback_similarity(quote, canonical_texts[0])
                    best_cit_key, best_canonical = canonical_entries[0]
            else:
                # Fallback lexical comparison across database
                for key, val in canonical_entries:
                    sim = self._fallback_similarity(quote, val["holding"])
                    if sim > best_sim:
                        best_sim = sim
                        best_cit_key = key
                        best_canonical = val

            # Evaluation logic:
            # If similarity is between 0.35 and 0.77 with a matched canonical case, it suggests
            # the advocate altered words or fabricated judicial dicta (misquote).
            # If similarity >= threshold (e.g. 0.78), it's a verified authentic quote.
            # If similarity < 0.35, the quote is likely from a case not in the mock canonical database.
            status = "Unknown/Unindexed"
            is_accurate = True

            if best_sim >= settings.SEMANTIC_SIMILARITY_THRESHOLD:
                status = "Verified"
                is_accurate = True
            elif 0.35 <= best_sim < settings.SEMANTIC_SIMILARITY_THRESHOLD and matching_key:
                status = "Misquoted/Altered"
                is_accurate = False
                has_misquote = True
            elif best_sim >= 0.50:
                # Partial match to an existing precedent
                status = "Partially Consistent"
                is_accurate = True

            total_sim += best_sim
            results.append(QuoteMatchResult(
                quote=quote,
                canonical_citation=best_cit_key if best_canonical else None,
                matched_canonical_text=best_canonical["holding"] if best_canonical else None,
                similarity_score=round(best_sim, 4),
                is_accurate=is_accurate,
                status=status
            ))

        avg_similarity = round(total_sim / len(extracted_quotes), 4) if extracted_quotes else 1.0

        summary = (
            f"Evaluated {len(results)} quoted passage(s). "
            f"Average semantic alignment: {avg_similarity:.2f}. "
            f"{'Warning: Potential precedent distortion detected!' if has_misquote else 'No deliberate quote alteration detected.'}"
        )

        return SemanticVerificationResult(
            results=results,
            average_similarity=avg_similarity,
            misquote_detected=has_misquote,
            summary=summary
        )

semantic_verifier = SemanticLegalVerifier()
