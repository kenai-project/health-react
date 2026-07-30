"""TXT parser using built-in file I/O."""

import time
import logging
from ..parsers import BaseParser, DocumentParseResult, register_parser

logger = logging.getLogger(__name__)


class TXTParser(BaseParser):
    extension = ".txt"
    display_name = "Text Parser"

    def _import_library(self):
        pass  # Built-in, no external library needed

    def extract_metadata(self, filepath: str) -> dict:
        encoding = self._detect_encoding(filepath)
        return {"encoding": encoding}

    def _detect_encoding(self, filepath: str) -> str:
        """Try UTF-8 first, fall back to latin-1."""
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                f.read()
            return "utf-8"
        except UnicodeDecodeError:
            return "latin-1"

    def parse(self, filepath: str) -> DocumentParseResult:
        start = time.time()
        try:
            encoding = self._detect_encoding(filepath)
            with open(filepath, "r", encoding=encoding) as f:
                full_text = f.read()

            word_count = len(full_text.split())
            elapsed = (time.time() - start) * 1000

            logger.debug(
                "Parsed TXT: %s (%d words, %.0fms)",
                filepath, word_count, elapsed,
            )
            return DocumentParseResult(
                text=full_text,
                metadata={"encoding": encoding},
                page_count=1,
                word_count=word_count,
                warnings=[],
                parser_used="txt_parser",
                processing_time_ms=round(elapsed, 2),
            )

        except Exception as e:
            elapsed = (time.time() - start) * 1000
            logger.error("TXT parsing failed for %s: %s", filepath, e)
            return DocumentParseResult(
                text="",
                metadata={},
                page_count=0,
                word_count=0,
                warnings=[f"TXT parsing failed: {e}"],
                parser_used="txt_parser",
                processing_time_ms=round(elapsed, 2),
            )


register_parser(TXTParser())