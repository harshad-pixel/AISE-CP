"""
NLP Service - Text analysis engine for requirement processing.

Uses lightweight, rule-based + statistical NLP techniques so the system works
standalone without heavy ML dependencies.  Optionally enhanced by OpenAI when
an API key is configured.
"""
import re
import math
from collections import Counter
from typing import Optional

from app.config import settings


# ---------------------------------------------------------------------------
# Keyword dictionaries used for classification and quality heuristics
# ---------------------------------------------------------------------------

CATEGORY_KEYWORDS = {
    "functional": [
        "system shall", "must", "will", "user can", "user should",
        "feature", "function", "process", "workflow", "action",
        "button", "screen", "page", "display", "generate", "calculate",
        "search", "filter", "sort", "export", "import", "upload",
        "download", "create", "edit", "delete", "update", "view",
    ],
    "non_functional": [
        "performance", "scalability", "security", "reliability",
        "availability", "usability", "maintainability", "portability",
        "response time", "throughput", "latency", "concurrent",
        "uptime", "recovery", "encryption", "authentication",
        "authorization", "audit", "compliance", "accessibility",
    ],
    "technical": [
        "database", "api", "endpoint", "server", "client", "protocol",
        "microservice", "architecture", "integration", "deployment",
        "docker", "kubernetes", "cloud", "aws", "azure", "infrastructure",
        "schema", "migration", "cache", "queue", "message", "webhook",
    ],
    "business": [
        "revenue", "cost", "roi", "market", "customer", "stakeholder",
        "business rule", "policy", "regulation", "compliance", "kpi",
        "metric", "goal", "objective", "sla", "contract", "legal",
    ],
    "constraint": [
        "constraint", "limitation", "deadline", "budget", "resource",
        "must not exceed", "within", "minimum", "maximum", "at least",
        "no more than", "capacity", "bound", "restrict",
    ],
}

# Vague / ambiguous terms that reduce requirement quality
AMBIGUITY_TERMS = {
    "maybe", "possibly", "probably", "approximately", "roughly",
    "some", "various", "certain", "appropriate", "reasonable",
    "as needed", "as applicable", "etc", "and so on", "and/or",
    "tbd", "tba", "pending", "flexible", "user-friendly", "fast",
    "quick", "efficient", "simple", "easy", "modern", "scalable",
    "robust", "powerful", "seamless", "intuitive", "clean",
    "good", "nice", "better", "acceptable", "adequate",
}

# Quality indicators - terms that suggest well-specified requirements
QUALITY_INDICATORS = {
    "acceptance": ["acceptance criteria", "given", "when", "then", "expected result"],
    "measurable": ["seconds", "ms", "percent", "%", "users", "requests", "gb", "mb",
                   "minutes", "hours", "days", "limit", "threshold", "minimum",
                   "maximum", "exactly", "at least", "no more than"],
    "testable": ["test", "verify", "validate", "assert", "expected",
                 "should return", "should display", "should show"],
    "specific": ["id", "name", "field", "column", "table", "endpoint",
                 "status", "role", "permission", "value"],
}

# Urgency signals in text
URGENCY_TERMS = {
    "critical": ["critical", "urgent", "immediate", "asap", "blocker", "blocking"],
    "high": ["priority", "important", "soon", "deadline", "milestone", "release"],
}

# Stop words for keyword extraction
STOP_WORDS = frozenset({
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "should",
    "could", "may", "might", "must", "shall", "can", "need", "to",
    "of", "in", "on", "at", "by", "for", "with", "about", "from",
    "into", "through", "during", "before", "after", "above", "below",
    "up", "down", "out", "off", "over", "under", "again", "further",
    "then", "once", "here", "there", "when", "where", "why", "how",
    "all", "each", "every", "both", "few", "more", "most", "other",
    "such", "no", "not", "only", "own", "same", "so", "than", "too",
    "very", "s", "t", "just", "also", "this", "that", "these", "those",
    "it", "its", "they", "them", "their", "we", "us", "our", "you",
    "your", "he", "she", "him", "her", "his", "hers", "i", "me", "my",
    "and", "or", "but", "if", "because", "as", "until", "while",
    "what", "which", "who", "whom", "any", "shall", "system", "user",
    "requirement", "must", "should", "allow", "enable", "provide",
})


class NLPService:
    """Lightweight NLP utilities for requirement text analysis."""

    # ------------------------------------------------------------------
    # Text cleaning & tokenization
    # ------------------------------------------------------------------

    @staticmethod
    def clean_text(text: str) -> str:
        """Normalise whitespace and lowercase for analysis."""
        text = text.strip()
        text = re.sub(r"\s+", " ", text)
        return text

    @staticmethod
    def tokenize(text: str) -> list[str]:
        """Split text into lowercased word tokens, removing punctuation."""
        tokens = re.findall(r"[a-z]+(?:_[a-z]+)*", text.lower())
        return [t for t in tokens if t not in STOP_WORDS and len(t) > 1]

    @staticmethod
    def split_sentences(text: str) -> list[str]:
        """Simple sentence splitter."""
        sentences = re.split(r"[.!?]+", text)
        return [s.strip() for s in sentences if s.strip()]

    # ------------------------------------------------------------------
    # Keyword extraction (TF-based)
    # ------------------------------------------------------------------

    @staticmethod
    def extract_keywords(text: str, top_n: int = 10) -> list[str]:
        """Extract the most frequent meaningful tokens as keywords."""
        tokens = NLPService.tokenize(text)
        if not tokens:
            return []

        freq = Counter(tokens)
        # Boost multi-word domain terms via bigrams
        bigrams = ["_".join(b) for b in zip(tokens, tokens[1:])]
        bigram_freq = Counter(bigrams)
        for bg, count in bigram_freq.most_common(top_n):
            if count >= 2:
                freq[bg] = count

        return [word for word, _ in freq.most_common(top_n)]

    # ------------------------------------------------------------------
    # Requirement classification
    # ------------------------------------------------------------------

    @staticmethod
    def classify_category(text: str) -> tuple[str, float]:
        """
        Classify a requirement into a category using keyword matching.
        Returns (category, confidence 0-1).
        """
        text_lower = text.lower()
        scores: dict[str, float] = {}

        for category, keywords in CATEGORY_KEYWORDS.items():
            score = 0.0
            for kw in keywords:
                if kw in text_lower:
                    # Longer keywords get more weight
                    weight = len(kw.split()) * 2
                    score += weight
            if score > 0:
                scores[category] = score

        if not scores:
            return ("functional", 0.3)

        total = sum(scores.values())
        best_category = max(scores, key=scores.get)
        confidence = round(scores[best_category] / total, 2)

        # Boost confidence if one category clearly dominates
        if len(scores) == 1:
            confidence = min(confidence + 0.2, 1.0)

        return (best_category, confidence)

    @staticmethod
    def classify_moscow(text: str, explicit_type: Optional[str] = None) -> str:
        """
        Determine MoSCoW classification (must/should/could/wont have).
        Honours an explicit type if provided, otherwise infers from text.
        """
        if explicit_type and explicit_type in ("must_have", "should_have", "could_have", "wont_have"):
            return explicit_type

        text_lower = text.lower()
        if any(w in text_lower for w in ["must", "critical", "essential", "mandatory", "required"]):
            return "must_have"
        if any(w in text_lower for w in ["should", "important", "preferred"]):
            return "should_have"
        if any(w in text_lower for w in ["could", "optional", "nice to have", "may"]):
            return "could_have"
        if any(w in text_lower for w in ["won't", "wont", "not required", "out of scope", "exclude"]):
            return "wont_have"
        return "should_have"

    # ------------------------------------------------------------------
    # Quality scoring
    # ------------------------------------------------------------------

    @staticmethod
    def detect_ambiguity(text: str) -> tuple[float, list[str]]:
        """
        Detect vague / ambiguous language.
        Returns (ambiguity_score 0-100, list of ambiguous terms found).
        """
        text_lower = text.lower()
        found: list[str] = []

        for term in AMBIGUITY_TERMS:
            if term in text_lower:
                found.append(term)

        # Also flag sentences that lack measurable specifics
        sentences = NLPService.split_sentences(text)
        vague_sentences = 0
        for sent in sentences:
            sent_lower = sent.lower()
            has_measure = any(m in sent_lower for m in QUALITY_INDICATORS["measurable"])
            has_ambiguity = any(t in sent_lower for t in AMBIGUITY_TERMS)
            if has_ambiguity and not has_measure:
                vague_sentences += 1

        # Compute score: weighted combination
        term_penalty = min(len(found) * 10, 50)
        sentence_penalty = 0
        if sentences:
            sentence_penalty = round((vague_sentences / len(sentences)) * 50)

        score = min(term_penalty + sentence_penalty, 100)
        return (round(score, 1), found)

    @staticmethod
    def detect_completeness(text: str, acceptance_criteria: str = "") -> tuple[float, list[str]]:
        """
        Assess how complete / well-specified a requirement is.
        Returns (completeness_score 0-100, list of missing aspects).
        """
        combined = (text + " " + (acceptance_criteria or "")).lower()
        missing: list[str] = []

        checks = {
            "acceptance criteria": QUALITY_INDICATORS["acceptance"],
            "measurable criteria": QUALITY_INDICATORS["measurable"],
            "testability": QUALITY_INDICATORS["testable"],
            "specificity": QUALITY_INDICATORS["specific"],
        }

        score = 100.0
        for aspect, indicators in checks.items():
            if not any(ind in combined for ind in indicators):
                score -= 25
                missing.append(aspect)

        # Short requirements tend to be incomplete
        word_count = len(text.split())
        if word_count < 10:
            score -= 10
            if "detail" not in missing:
                missing.append("sufficient detail")

        score = max(score, 0)
        return (round(score, 1), missing)

    @staticmethod
    def compute_quality_score(text: str, acceptance_criteria: str = "") -> tuple[float, dict]:
        """
        Overall quality assessment combining ambiguity and completeness.
        Returns (quality_score 0-100, details dict).
        """
        ambiguity_score, ambiguous_terms = NLPService.detect_ambiguity(text)
        completeness_score, missing_aspects = NLPService.detect_completeness(text, acceptance_criteria)

        # Quality = high completeness, low ambiguity
        quality = (completeness_score * 0.6) + ((100 - ambiguity_score) * 0.4)
        quality = round(max(0, min(100, quality)), 1)

        # Confidence is higher when text is longer and more specific
        word_count = len(text.split())
        confidence = min((word_count / 50) * 0.5 + 0.3, 0.95) if word_count > 0 else 0.1

        details = {
            "ambiguity_score": ambiguity_score,
            "ambiguous_terms": ambiguous_terms,
            "completeness_score": completeness_score,
            "missing_aspects": missing_aspects,
            "word_count": word_count,
            "confidence": round(confidence, 2),
        }

        return (quality, details)

    # ------------------------------------------------------------------
    # Urgency detection from text
    # ------------------------------------------------------------------

    @staticmethod
    def detect_urgency(text: str) -> tuple[float, list[str]]:
        """
        Detect urgency signals in requirement text.
        Returns (urgency_boost 0-10, list of signals found).
        """
        text_lower = text.lower()
        signals: list[str] = []

        for level, terms in URGENCY_TERMS.items():
            for term in terms:
                if term in text_lower:
                    signals.append(term)

        boost = 0.0
        if signals:
            boost = min(5.0 + len(signals) * 1.5, 10.0)

        return (round(boost, 1), signals)

    # ------------------------------------------------------------------
    # Dependency extraction
    # ------------------------------------------------------------------

    @staticmethod
    def extract_dependencies(text: str) -> list[str]:
        """Extract referenced requirement IDs or feature names from text."""
        # Look for explicit references like REQ-001, #123, depends on X
        refs = re.findall(r"(?:REQ-?|#|requirement\s+)(\d+)", text, re.IGNORECASE)
        # Look for "depends on", "requires", "blocked by" patterns
        dep_patterns = re.findall(
            r"(?:depends on|requires|blocked by|relies on|prerequisite:?)\s+([a-zA-Z0-9_\- ]+?)(?:[.,;]|$)",
            text,
            re.IGNORECASE,
        )
        refs.extend([d.strip() for d in dep_patterns if d.strip()])
        return refs

    # ------------------------------------------------------------------
    # Text similarity (Jaccard-based)
    # ------------------------------------------------------------------

    @staticmethod
    def text_similarity(text_a: str, text_b: str) -> float:
        """
        Compute a Jaccard similarity score between two texts (0-1).
        Uses token sets for a lightweight comparison.
        """
        tokens_a = set(NLPService.tokenize(text_a))
        tokens_b = set(NLPService.tokenize(text_b))

        if not tokens_a or not tokens_b:
            return 0.0

        intersection = tokens_a & tokens_b
        union = tokens_a | tokens_b
        return round(len(intersection) / len(union), 3)

    # ------------------------------------------------------------------
    # Full analysis pipeline
    # ------------------------------------------------------------------

    @staticmethod
    def analyze(text: str, title: str = "", acceptance_criteria: str = "") -> dict:
        """
        Run the full NLP analysis pipeline on a single requirement.
        Returns a comprehensive analysis dictionary.
        """
        full_text = f"{title} {text}".strip()

        category, cat_confidence = NLPService.classify_category(full_text)
        moscow = NLPService.classify_moscow(full_text)
        quality, quality_details = NLPService.compute_quality_score(full_text, acceptance_criteria)
        keywords = NLPService.extract_keywords(full_text)
        urgency_boost, urgency_signals = NLPService.detect_urgency(full_text)
        dependencies = NLPService.extract_dependencies(full_text)

        return {
            "category": category,
            "category_confidence": cat_confidence,
            "moscow": moscow,
            "quality_score": quality,
            "ambiguity_score": quality_details["ambiguity_score"],
            "ambiguous_terms": quality_details["ambiguous_terms"],
            "completeness_score": quality_details["completeness_score"],
            "missing_aspects": quality_details["missing_aspects"],
            "confidence": quality_details["confidence"],
            "keywords": keywords,
            "urgency_boost": urgency_boost,
            "urgency_signals": urgency_signals,
            "dependencies": dependencies,
            "word_count": quality_details["word_count"],
        }
