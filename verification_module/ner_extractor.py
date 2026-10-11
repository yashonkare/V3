"""Step 3: NLP Citation Extraction (NER).

Integrates Hugging Face's `evolawyer/inlegalbert-sc-ner-silver` / `law-ai/InLegalBERT`
combined with legal domain regular expressions to extract:
1. 16-character eCourts CNR Numbers (e.g. DLHC010012342023, MHPU010045672021)
2. Indian Legal Citations (e.g., "AIR 1950 SC 27", "2021 SCC OnLine SC 123", "(2018) 1 SCC 1")
3. Judge Names (e.g., "Hon'ble Dr. Justice D.Y. Chandrachud", "Justice Sanjiv Khanna")
4. Advocate Names (e.g., "Mr. Kapil Sibal, Sr. Adv.", "Shri Harish Salve")
5. Relevant quoted judicial dicta / precedent arguments
"""
import re
import logging
from typing import List, Dict, Any, Optional
from .config import settings
from .schemas import LegalEntities

logger = logging.getLogger(__name__)

# Pattern for 16-character Indian Court Case Number Record (CNR)
# Format: 2-char State + 2-char District/Establishment + 2-char Court code + 6-digit Serial + 4-digit Year
CNR_REGEX = re.compile(r"\b([A-Z]{4}\d{12})\b", re.IGNORECASE)

# Indian Legal Citation regular expressions:
# Matches AIR (All India Reporter), SCC (Supreme Court Cases), SCR, ILR, Manu, etc.
CITATION_PATTERNS = [
    re.compile(r"\bAIR\s+\d{4}\s+(?:SC|Del|Bom|Mad|Cal|All|Kar|Guj|P&H|MP|Ker|AP|Pat)\s+\d+\b", re.IGNORECASE),
    re.compile(r"\(\d{4}\)\s+\d+\s+SCC\s+\d+", re.IGNORECASE),
    re.compile(r"\b\d{4}\s+SCC\s+OnLine\s+(?:SC|Del|Bom|Mad|Cal|All|Kar|Guj)\s+\d+\b", re.IGNORECASE),
    re.compile(r"\b\d{4}\s+\(\d+\)\s+SCALE\s+\d+\b", re.IGNORECASE),
    re.compile(r"\[\d{4}\]\s+\d+\s+SCR\s+\d+", re.IGNORECASE),
    re.compile(r"\b(?:Civil|Criminal|Writ)\s+Appeal\s+No\.?\s*\d+\s+of\s+\d{4}\b", re.IGNORECASE),
    re.compile(r"\bSpecial\s+Leave\s+Petition\s+\((?:C|Crl)\.?\)\s+No\.?\s*\d+\s+of\s+\d{4}\b", re.IGNORECASE)
]

# Judicial and advocate title heuristics
JUDGE_PREFIX_REGEX = re.compile(
    r"(?:Hon(?:'|\.?ble)?\s+)?(?:Mr\.|Ms\.|Mrs\.|Dr\.)?\s*Justice\s+([A-Z][a-zA-Z\.\s]{2,35})(?:\s+and\s+|\s*,|\s*\n|$)",
    re.IGNORECASE
)
ADVOCATE_PREFIX_REGEX = re.compile(
    r"(?:Mr\.|Ms\.|Mrs\.|Shri|Smt\.)?\s*([A-Z][a-zA-Z\.\s]{2,30})\s*(?:,\s*(?:Senior\s+Advocate|Sr\.\s*Adv\.?|Advocate|Adv\.?|for\s+the\s+(?:Petitioner|Appellant|Respondent)))",
    re.IGNORECASE
)

# Extract quoted excerpts (legal quotes within quotation marks)
QUOTE_REGEX = re.compile(r'["“]([^"”]{25,600})["”]', re.DOTALL)

class LegalNERExtractor:
    def __init__(self):
        self.pipeline = None
        self._init_model()

    def _init_model(self):
        """Attempts to load the Hugging Face InLegalBERT NER pipeline lazily."""
        try:
            from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
            model_name = settings.NER_MODEL_NAME
            logger.info(f"Loading Legal NER model: {model_name}")
            self.pipeline = pipeline(
                "ner",
                model=model_name,
                tokenizer=model_name,
                aggregation_strategy="simple",
                device=-1  # CPU safe default
            )
            logger.info("InLegalBERT NER loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load Hugging Face NER pipeline '{settings.NER_MODEL_NAME}': {e}. Falling back to rule-based regex extraction.")
            self.pipeline = None

    def extract_entities(self, text: str) -> LegalEntities:
        """Extracts CNRs, citations, judges, advocates, and quoted legal holdings.
        
        Args:
            text: Raw extracted document text.
            
        Returns:
            LegalEntities populated with detected entities.
        """
        if not text:
            return LegalEntities()

        cnrs = set()
        citations = set()
        judges = set()
        advocates = set()
        quotes = set()
        raw_tokens = []

        # 1. CNR Extraction (Strict 16-character validation)
        for match in CNR_REGEX.finditer(text):
            cnr = match.group(1).upper()
            if len(cnr) == 16:
                cnrs.add(cnr)

        # 2. Legal Citations via Patterns
        for pat in CITATION_PATTERNS:
            for match in pat.finditer(text):
                clean_cit = " ".join(match.group(0).split())
                citations.add(clean_cit)

        # 3. Judges and Advocates via High-Precision Indian Legal Grammars
        for match in JUDGE_PREFIX_REGEX.finditer(text):
            name = match.group(0).strip(" ,.\n\r")
            if len(name) > 5:
                judges.add(" ".join(name.split()))

        for match in ADVOCATE_PREFIX_REGEX.finditer(text):
            name = match.group(0).strip(" ,.\n\r")
            if len(name) > 5:
                advocates.add(" ".join(name.split()))

        # 4. Extract Quoted Legal Rulings / Citations
        for match in QUOTE_REGEX.finditer(text):
            quote_text = " ".join(match.group(1).split())
            if len(quote_text) > 30:
                quotes.add(quote_text)

        # 5. Hugging Face NER Enhancement (if model loaded)
        if self.pipeline:
            try:
                # Truncate / chunk text for BERT token limitations (first 4000 chars or split into sentences)
                sample_chunk = text[:3500]
                ner_results = self.pipeline(sample_chunk)
                for entity in ner_results:
                    raw_tokens.append({
                        "word": entity.get("word"),
                        "entity_group": entity.get("entity_group"),
                        "score": round(float(entity.get("score", 0.0)), 4)
                    })
                    ent_label = entity.get("entity_group", "").upper()
                    ent_word = entity.get("word", "").strip()

                    if not ent_word or len(ent_word) < 3:
                        continue

                    if any(j in ent_label for j in ["JUDGE", "COURT_OFFICIAL"]):
                        judges.add(ent_word)
                    elif any(a in ent_label for a in ["PETITIONER_LAWYER", "RESPONDENT_LAWYER", "LAWYER", "ADVOCATE"]):
                        advocates.add(ent_word)
                    elif any(c in ent_label for c in ["CITATION", "PRECEDENT", "STATUTE"]):
                        citations.add(ent_word)
            except Exception as e:
                logger.error(f"InLegalBERT inference error: {e}")

        return LegalEntities(
            cnr_numbers=sorted(list(cnrs)),
            citations=sorted(list(citations)),
            judge_names=sorted(list(judges)),
            advocate_names=sorted(list(advocates)),
            extracted_quotes=sorted(list(quotes)),
            raw_ner_tokens=raw_tokens[:50]  # Cap token logging
        )

# Module-level singleton
ner_extractor = LegalNERExtractor()
