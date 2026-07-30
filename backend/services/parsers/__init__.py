"""
Parser Registry — Plug-in Architecture for Document Parsing.

Usage:
    from services.parsers import parse_document, get_parser, DocumentParseResult

    result = parse_document("/path/to/file.pdf", ".pdf")
    print(result.text, result.word_count, result.warnings)

Adding a new parser:
    1. Create a new file (e.g., pptx_parser.py)
    2. Create a class extending BaseParser
    3. Call register_parser(MyParser()) at module level
    4. Import the file in __init__.py
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
from enum import Enum


class AnalysisType(str, Enum):
    """Types of AI analysis that can be performed on a document."""
    SUMMARY = "summary"
    EXPLANATION = "explanation"
    QA = "qa"
    LAB_REPORT = "lab_report"
    PRESCRIPTION = "prescription"


class DocumentErrorCode(str, Enum):
    """Structured error codes for document operations."""
    DOCUMENT_TOO_LARGE = "DOCUMENT_TOO_LARGE"
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE"
    PARSER_FAILED = "PARSER_FAILED"
    ANALYSIS_FAILED = "ANALYSIS_FAILED"
    DOCUMENT_NOT_FOUND = "DOCUMENT_NOT_FOUND"
    EXTRACTION_FAILED = "EXTRACTION_FAILED"
    DUPLICATE_DOCUMENT = "DUPLICATE_DOCUMENT"
    UNAUTHORIZED = "UNAUTHORIZED"
    UPLOAD_FAILED = "UPLOAD_FAILED"
    CHUNKING_FAILED = "CHUNKING_FAILED"


@dataclass
class DocumentParseResult:
    """Standard result returned by every parser."""
    text: str
    metadata: dict
    page_count: int
    word_count: int
    warnings: list[str]
    parser_used: str
    processing_time_ms: float = 0.0


class BaseParser:
    """
    Abstract base class for all document parsers.

    All parsers must implement the parse() method.
    Override other methods as needed.
    """

    extension: str = ""
    display_name: str = ""

    def supports(self, extension: str) -> bool:
        """Check if this parser can handle the given file extension."""
        return extension.lower() == self.extension

    def validate(self, filepath: str) -> list[str]:
        """Pre-parse validation. Return list of warnings (empty if no issues)."""
        return []

    def parse(self, filepath: str) -> DocumentParseResult:
        """Extract text and metadata from the file."""
        raise NotImplementedError(
            f"{self.__class__.__name__} must implement parse()"
        )

    def extract_metadata(self, filepath: str) -> dict:
        """Extract metadata without performing a full text parse."""
        raise NotImplementedError(
            f"{self.__class__.__name__} must implement extract_metadata()"
        )

    def health_check(self) -> bool:
        """Check if the parser's required library is available."""
        try:
            self._import_library()
            return True
        except ImportError:
            return False

    def _import_library(self):
        """Import the required library. Override in subclasses."""
        pass


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

PARSERS: dict[str, BaseParser] = {}


def register_parser(parser: BaseParser) -> None:
    """Register a parser in the global registry."""
    PARSERS[parser.extension] = parser


def get_parser(extension: str) -> Optional[BaseParser]:
    """Get a parser by file extension (e.g., '.pdf')."""
    return PARSERS.get(extension.lower())


def parse_document(filepath: str, extension: str) -> DocumentParseResult:
    """Parse a document using the registered parser for the given extension."""
    parser = get_parser(extension)
    if not parser:
        raise ValueError(
            f"No parser registered for extension '{extension}'. "
            f"Available: {list(PARSERS.keys())}"
        )
    return parser.parse(filepath)


def get_supported_extensions() -> list[str]:
    """Return list of supported file extensions."""
    return list(PARSERS.keys())


def all_parsers_healthy() -> dict[str, bool]:
    """Check health of all registered parsers."""
    return {ext: parser.health_check() for ext, parser in PARSERS.items()}


# ---------------------------------------------------------------------------
# Import parsers so they register themselves
# ---------------------------------------------------------------------------

from . import pdf_parser      # noqa: F401, E402
from . import docx_parser     # noqa: F401, E402
from . import xlsx_parser     # noqa: F401, E402
from . import csv_parser      # noqa: F401, E402
from . import txt_parser      # noqa: F401, E402