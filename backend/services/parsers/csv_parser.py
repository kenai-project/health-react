"""CSV parser using pandas (already present in dependencies)."""

import time
import logging
from ..parsers import BaseParser, DocumentParseResult, register_parser

logger = logging.getLogger(__name__)


class CSVParser(BaseParser):
    extension = ".csv"
    display_name = "CSV Parser"

    def _import_library(self):
        import pandas  # noqa: F401

    def extract_metadata(self, filepath: str) -> dict:
        import pandas as pd
        df = pd.read_csv(filepath)
        return {
            "rows": len(df),
            "columns": len(df.columns),
            "headers": list(df.columns),
        }

    def parse(self, filepath: str) -> DocumentParseResult:
        start = time.time()
        try:
            import pandas as pd
            df = pd.read_csv(filepath)

            # Convert DataFrame to text representation
            text_parts = []
            text_parts.append(" | ".join(df.columns))
            text_parts.append("-" * 80)

            for _, row in df.iterrows():
                cells = [str(val) if pd.notna(val) else "" for val in row]
                text_parts.append(" | ".join(cells))

            full_text = "\n".join(text_parts)
            word_count = len(full_text.split())
            elapsed = (time.time() - start) * 1000

            logger.debug(
                "Parsed CSV: %s (%d rows, %d words, %.0fms)",
                filepath, len(df), word_count, elapsed,
            )
            return DocumentParseResult(
                text=full_text,
                metadata=self.extract_metadata(filepath),
                page_count=1,
                word_count=word_count,
                warnings=[],
                parser_used="csv_parser",
                processing_time_ms=round(elapsed, 2),
            )

        except Exception as e:
            elapsed = (time.time() - start) * 1000
            logger.error("CSV parsing failed for %s: %s", filepath, e)
            return DocumentParseResult(
                text="",
                metadata={},
                page_count=0,
                word_count=0,
                warnings=[f"CSV parsing failed: {e}"],
                parser_used="csv_parser",
                processing_time_ms=round(elapsed, 2),
            )


register_parser(CSVParser())