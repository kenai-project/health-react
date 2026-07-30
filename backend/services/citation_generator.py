"""CitationGenerator - Generate citations from chunk metadata for AI responses."""

import os
import logging
import hashlib
from typing import Optional

logger = logging.getLogger(__name__)


class CitationGenerator:
    """Generate citations from chunk metadata."""

    def generate_citations(self, chunks: list[dict], response_text: str) -> list[dict]:
        """
        Generate citations by mapping response to chunks.

        Args:
            chunks: Selected chunks used for analysis
            response_text: Generated response from LLM

        Returns:
            List of citation dicts with chunk_index, page_number, text_preview
        """
        if not chunks:
            return []

        # Strategy: Use all chunks as citations (conservative approach)
        # In future, could implement semantic matching to find most relevant chunks
        citations = []

        for chunk in chunks:
            citation = {
                "chunk_index": chunk.get("chunk_index", 0),
                "page_number": chunk.get("page_number", 1),
                "text_preview": self._create_preview(chunk.get("text", "")),
                "start_word": chunk.get("start_word", 0),
                "end_word": chunk.get("end_word", 0),
            }
            citations.append(citation)

        return citations

    def _create_preview(self, text: str, max_length: int = 100) -> str:
        """
        Create a preview of text for citation.

        Args:
            text: Full text
            max_length: Maximum preview length

        Returns:
            Truncated text preview
        """
        if not text:
            return ""

        # Truncate to max_length
        if len(text) <= max_length:
            return text

        # Truncate at word boundary
        truncated = text[:max_length]
        last_space = truncated.rfind(' ')
        if last_space > 0:
            truncated = truncated[:last_space]

        return truncated + "..."

    def format_citation(self, citation: dict) -> str:
        """
        Format citation as human-readable string.

        Args:
            citation: Citation dict

        Returns:
            Formatted citation string
        """
        parts = []

        if citation.get("page_number"):
            parts.append(f"Page {citation['page_number']}")

        if citation.get("chunk_index") is not None:
            parts.append(f"Chunk {citation['chunk_index']}")

        if not parts:
            return "Unknown source"

        return ", ".join(parts)

    def format_citations_list(self, citations: list[dict]) -> str:
        """
        Format list of citations as human-readable string.

        Args:
            citations: List of citation dicts

        Returns:
            Formatted citations string
        """
        if not citations:
            return ""

        formatted = [self.format_citation(c) for c in citations]
        return "; ".join(formatted)

    def validate_citation(self, citation: dict) -> bool:
        """
        Validate citation has required fields.

        Args:
            citation: Citation dict

        Returns:
            True if valid, False otherwise
        """
        required_fields = ["chunk_index", "page_number", "text_preview"]
        return all(field in citation for field in required_fields)


# Global instance
citation_generator = CitationGenerator()