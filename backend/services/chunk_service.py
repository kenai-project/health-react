"""ChunkService — Independent text chunking for document processing."""

import os
import json
import logging

logger = logging.getLogger(__name__)

# Configuration via environment variables
CHUNK_SIZE = int(os.environ.get("CHUNK_SIZE", 1000))       # words per chunk
CHUNK_OVERLAP = int(os.environ.get("CHUNK_OVERLAP", 100))  # overlapping words


class ChunkService:
    """
    Handles text chunking for document processing.

    Chunking logic is independent from DocumentService.
    Future strategies: sentence-based, paragraph-based, semantic.
    """

    def chunk_text(self, text: str, page_count: int = 1) -> list[dict]:
        """
        Split text into overlapping chunks.

        Args:
            text: Full extracted text
            page_count: Number of pages (for page reference estimation)

        Returns:
            List of chunk dicts with:
            - chunk_index: sequential index
            - page_number: estimated page number
            - start_word: starting word index
            - end_word: ending word index
            - text: chunk text content
        """
        if not text or not text.strip():
            return []

        words = text.split()
        total_words = len(words)

        if total_words == 0:
            return []

        chunks = []
        chunk_index = 0
        start = 0

        while start < total_words:
            end = min(start + CHUNK_SIZE, total_words)
            chunk_words = words[start:end]
            chunk_text = " ".join(chunk_words)

            # Estimate page number based on word position
            page_number = 1
            if page_count > 1 and total_words > 0:
                page_number = min(
                    int((start / total_words) * page_count) + 1,
                    page_count,
                )

            chunks.append({
                "chunk_index": chunk_index,
                "page_number": page_number,
                "start_word": start,
                "end_word": end - 1,
                "text": chunk_text,
            })

            chunk_index += 1
            start += CHUNK_SIZE - CHUNK_OVERLAP

        logger.debug(
            "Chunked %d words into %d chunks (size=%d, overlap=%d)",
            total_words, len(chunks), CHUNK_SIZE, CHUNK_OVERLAP,
        )
        return chunks


# Singleton instance
chunk_service = ChunkService()