"""ContextSelector - Select relevant chunks for document analysis using strategy pattern."""

import os
import logging
from abc import ABC, abstractmethod
from typing import Optional

logger = logging.getLogger(__name__)

# Configuration
MAX_CONTEXT_TOKENS = int(os.environ.get("ANALYSIS_MAX_CONTEXT_TOKENS", 4000))


class ChunkSelectionStrategy(ABC):
    """Base strategy for chunk selection."""

    @abstractmethod
    def select(
        self,
        chunks: list[dict],
        max_tokens: int = MAX_CONTEXT_TOKENS,
        question: Optional[str] = None,
    ) -> list[dict]:
        """
        Select chunks for analysis.

        Args:
            chunks: All available chunks
            max_tokens: Maximum tokens to include
            question: User question (for QA)

        Returns:
            Selected chunks
        """
        pass


class SummaryStrategy(ChunkSelectionStrategy):
    """Strategy for summary: use first + representative chunks."""

    def select(self, chunks: list[dict], max_tokens: int = MAX_CONTEXT_TOKENS, question: Optional[str] = None) -> list[dict]:
        """
        Select chunks for summary.

        Strategy:
        - Use first 30% of chunks (introduction)
        - Use middle 40% of chunks (body)
        - Use last 30% of chunks (conclusion)
        - This ensures full document coverage
        """
        if not chunks:
            return []

        # For short documents, use all chunks
        if len(chunks) <= 5:
            return self._fit_to_budget(chunks, max_tokens)

        # For longer documents, sample from beginning, middle, and end
        n = len(chunks)
        first_count = max(1, int(n * 0.3))
        middle_count = max(1, int(n * 0.4))
        last_count = max(1, int(n * 0.3))

        first_chunks = chunks[:first_count]
        middle_start = first_count
        middle_end = first_count + middle_count
        middle_chunks = chunks[middle_start:middle_end]
        last_chunks = chunks[-last_count:]

        selected = first_chunks + middle_chunks + last_chunks
        return self._fit_to_budget(selected, max_tokens)

    def _fit_to_budget(self, chunks: list[dict], max_tokens: int) -> list[dict]:
        """Fit chunks within token budget."""
        selected = []
        current_tokens = 0

        for chunk in chunks:
            chunk_tokens = self._estimate_tokens(chunk["text"])
            if current_tokens + chunk_tokens > max_tokens:
                break
            selected.append(chunk)
            current_tokens += chunk_tokens

        return selected

    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count."""
        return len(text) // 4


class ExplanationStrategy(ChunkSelectionStrategy):
    """Strategy for explanation: use representative chunks."""

    def select(self, chunks: list[dict], max_tokens: int = MAX_CONTEXT_TOKENS, question: Optional[str] = None) -> list[dict]:
        """
        Select chunks for explanation.

        Strategy:
        - Use first 50% of chunks (provides context)
        - Skip repetitive sections
        """
        if not chunks:
            return []

        # For short documents, use all chunks
        if len(chunks) <= 5:
            return self._fit_to_budget(chunks, max_tokens)

        # Use first half of document
        n = len(chunks)
        selected = chunks[: n // 2]
        return self._fit_to_budget(selected, max_tokens)

    def _fit_to_budget(self, chunks: list[dict], max_tokens: int) -> list[dict]:
        """Fit chunks within token budget."""
        selected = []
        current_tokens = 0

        for chunk in chunks:
            chunk_tokens = len(chunk["text"]) // 4
            if current_tokens + chunk_tokens > max_tokens:
                break
            selected.append(chunk)
            current_tokens += chunk_tokens

        return selected


class QAStrategy(ChunkSelectionStrategy):
    """Strategy for Q&A: use most relevant chunks."""

    def select(self, chunks: list[dict], max_tokens: int = MAX_CONTEXT_TOKENS, question: Optional[str] = None) -> list[dict]:
        """
        Select chunks for Q&A.

        Strategy:
        - Extract keywords from question
        - Score chunks by keyword matches
        - Select top-scoring chunks
        - Fallback to first chunks if no matches
        """
        if not chunks:
            return []

        if not question:
            # No question provided, use first chunks
            return self._fit_to_budget(chunks[:5], max_tokens)

        # Extract keywords from question
        keywords = self._extract_keywords(question)

        # Score chunks
        scored_chunks = []
        for chunk in chunks:
            score = self._score_chunk(chunk["text"], keywords)
            scored_chunks.append((score, chunk))

        # Sort by score (descending)
        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        # Select top chunks within budget
        selected = []
        current_tokens = 0
        for score, chunk in scored_chunks:
            if score == 0:
                # No matches, skip remaining
                break
            chunk_tokens = len(chunk["text"]) // 4
            if current_tokens + chunk_tokens > max_tokens:
                break
            selected.append(chunk)
            current_tokens += chunk_tokens

        # Fallback: if no matches, use first chunks
        if not selected:
            selected = self._fit_to_budget(chunks[:5], max_tokens)

        return selected

    def _extract_keywords(self, question: str) -> list[str]:
        """Extract keywords from question."""
        # Remove common stop words
        stop_words = {
            "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "do", "does", "did", "will", "would", "could",
            "should", "may", "might", "must", "shall", "can", "need", "dare",
            "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by",
            "from", "as", "into", "through", "during", "before", "after",
            "above", "below", "between", "out", "off", "over", "under", "again",
            "further", "then", "once", "here", "there", "when", "where", "why",
            "how", "all", "each", "every", "both", "few", "more", "most", "other",
            "some", "such", "no", "nor", "not", "only", "own", "same", "so",
            "than", "too", "very", "just", "because", "but", "and", "or", "if",
            "while", "although", "though", "what", "which", "who", "whom",
            "this", "that", "these", "those", "am", "i", "me", "my", "myself",
            "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself",
            "yourselves", "he", "him", "his", "himself", "she", "her", "hers",
            "herself", "it", "its", "itself", "they", "them", "their", "theirs",
            "themselves", "about", "up", "down", "off", "over", "under",
        }

        words = question.lower().split()
        keywords = [w for w in words if w not in stop_words and len(w) > 2]
        return keywords

    def _score_chunk(self, text: str, keywords: list[str]) -> int:
        """Score chunk by keyword matches."""
        text_lower = text.lower()
        score = 0
        for keyword in keywords:
            score += text_lower.count(keyword)
        return score

    def _fit_to_budget(self, chunks: list[dict], max_tokens: int) -> list[dict]:
        """Fit chunks within token budget."""
        selected = []
        current_tokens = 0

        for chunk in chunks:
            chunk_tokens = len(chunk["text"]) // 4
            if current_tokens + chunk_tokens > max_tokens:
                break
            selected.append(chunk)
            current_tokens += chunk_tokens

        return selected


class LabReportStrategy(ChunkSelectionStrategy):
    """Strategy for lab reports: use all chunks (documents are typically short)."""

    def select(self, chunks: list[dict], max_tokens: int = MAX_CONTEXT_TOKENS, question: Optional[str] = None) -> list[dict]:
        """
        Select chunks for lab report.

        Strategy:
        - Use all chunks (lab reports are typically < 5 pages)
        - Fit within token budget
        """
        if not chunks:
            return []

        # Use all chunks, fit within budget
        return self._fit_to_budget(chunks, max_tokens)

    def _fit_to_budget(self, chunks: list[dict], max_tokens: int) -> list[dict]:
        """Fit chunks within token budget."""
        selected = []
        current_tokens = 0

        for chunk in chunks:
            chunk_tokens = len(chunk["text"]) // 4
            if current_tokens + chunk_tokens > max_tokens:
                break
            selected.append(chunk)
            current_tokens += chunk_tokens

        return selected


class PrescriptionStrategy(ChunkSelectionStrategy):
    """Strategy for prescriptions: use all chunks (documents are typically short)."""

    def select(self, chunks: list[dict], max_tokens: int = MAX_CONTEXT_TOKENS, question: Optional[str] = None) -> list[dict]:
        """
        Select chunks for prescription.

        Strategy:
        - Use all chunks (prescriptions are typically < 2 pages)
        - Fit within token budget
        """
        if not chunks:
            return []

        # Use all chunks, fit within budget
        return self._fit_to_budget(chunks, max_tokens)

    def _fit_to_budget(self, chunks: list[dict], max_tokens: int) -> list[dict]:
        """Fit chunks within token budget."""
        selected = []
        current_tokens = 0

        for chunk in chunks:
            chunk_tokens = len(chunk["text"]) // 4
            if current_tokens + chunk_tokens > max_tokens:
                break
            selected.append(chunk)
            current_tokens += chunk_tokens

        return selected


class ContextSelector:
    """Context selector using strategy pattern."""

    def __init__(self):
        self.strategies = {
            "SUMMARY": SummaryStrategy(),
            "EXPLANATION": ExplanationStrategy(),
            "QA": QAStrategy(),
            "LAB_REPORT": LabReportStrategy(),
            "PRESCRIPTION": PrescriptionStrategy(),
        }

    def select_chunks(
        self,
        analysis_type: str,
        chunks: list[dict],
        max_tokens: int = MAX_CONTEXT_TOKENS,
        question: Optional[str] = None,
    ) -> list[dict]:
        """
        Select chunks using appropriate strategy.

        Args:
            analysis_type: Type of analysis
            chunks: All available chunks
            max_tokens: Maximum tokens to include
            question: User question (for QA)

        Returns:
            Selected chunks
        """
        strategy = self.strategies.get(analysis_type.upper())
        if not strategy:
            # Default to summary strategy
            strategy = self.strategies["SUMMARY"]

        return strategy.select(chunks, max_tokens, question)

    def estimate_tokens(self, text: str) -> int:
        """Estimate token count."""
        return len(text) // 4


# Global instance
context_selector = ContextSelector()