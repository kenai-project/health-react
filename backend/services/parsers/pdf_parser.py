"""PDF parser using pypdf2. Detects scanned PDFs (no extractable text)."""

import time
import logging
from ..parsers import BaseParser, DocumentParseResult, register_parser

logger = logging.getLogger(__name__)


class PDFParser(BaseParser):
    extension = ".pdf"
    display_name = "PDF Parser"

    def _import_library(self):
        from pypdf2 import PdfReader  # noqa: F401

    def validate(self, filepath: str) -> list[str]:
        warnings = []
        try:
            from pypdf2 import PdfReader
            reader = PdfReader(filepath)
            if len(reader.pages) > 500:
                warnings.append(
                    f"PDF has {len(reader.pages)} pages. Processing may be slow."
                )
        except Exception as e:
            warnings.append(f"Could not validate PDF structure: {e}")
        return warnings

    def extract_metadata(self, filepath: str) -> dict:
        from pypdf2 import PdfReader
        reader = PdfReader(filepath)
        meta = reader.metadata
        return {
            "pages": len(reader.pages),
            "author": str(meta.author) if meta and meta.author else None,
            "producer": str(meta.producer) if meta and meta.producer else None,
            "title": str(meta.title) if meta and meta.title else None,
        }

    def parse(self, filepath: str) -> DocumentParseResult:
        start = time.time()
        try:
            from pypdf2 import PdfReader
            reader = PdfReader(filepath)
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text.strip())

            full_text = "\n\n".join(text_parts)
            word_count = len(full_text.split())
            elapsed = (time.time() - start) * 1000

            # Detect scanned PDF: no extractable text but has pages
            if word_count < 10 and len(reader.pages) > 0:
                logger.info("Scanned PDF detected: %s (%d pages)", filepath, len(reader.pages))
                return DocumentParseResult(
                    text="",
                    metadata={"pages": len(reader.pages)},
                    page_count=len(reader.pages),
                    word_count=0,
                    warnings=[
                        "Scanned document detected. "
                        "OCR support will be added in the Vision phase."
                    ],
                    parser_used="pdf_parser",
                    processing_time_ms=round(elapsed, 2),
                )

            logger.debug(
                "Parsed PDF: %s (%d pages, %d words, %.0fms)",
                filepath, len(reader.pages), word_count, elapsed,
            )
            return DocumentParseResult(
                text=full_text,
                metadata=self.extract_metadata(filepath),
                page_count=len(reader.pages),
                word_count=word_count,
                warnings=[],
                parser_used="pdf_parser",
                processing_time_ms=round(elapsed, 2),
            )

        except Exception as e:
            elapsed = (time.time() - start) * 1000
            logger.error("PDF parsing failed for %s: %s", filepath, e)
            return DocumentParseResult(
                text="",
                metadata={},
                page_count=0,
                word_count=0,
                warnings=[f"PDF parsing failed: {e}"],
                parser_used="pdf_parser",
                processing_time_ms=round(elapsed, 2),
            )


register_parser(PDFParser())