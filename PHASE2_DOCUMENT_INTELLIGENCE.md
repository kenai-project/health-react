# Phase 2: Document Intelligence — Architecture & Design (Implementation Ready)

> **Status**: Design Document (Ready for Implementation)  
> **Date**: 2026-07-30  
> **Scope**: PDF, DOCX, XLSX/CSV, TXT upload, extraction, analysis, Q&A

---

## Design Philosophy

- **Local-first**: All document processing happens on the server using free Python libraries. No external APIs.
- **Separation of concerns**: Upload, extraction, and analysis are distinct operations with separate endpoints.
- **Extraction is async, analysis is on-demand**: Text extraction runs in the background after upload. AI analysis only runs when the user explicitly requests it.
- **Parser plug-in architecture**: Parsers are registered in a registry pattern. Adding new formats requires only creating a new parser class and registering it.
- **Task abstraction**: Background execution is abstracted behind a `TaskService`. Initially uses FastAPI `BackgroundTasks`; can swap to Celery/RQ/APScheduler without API changes.
- **Future-ready schema**: Every document record is designed for future OCR, vision, embeddings, and RAG without schema changes.
- **Privacy**: Documents stay on the local filesystem. No data leaves the server.

---

## Implementation Guidelines (Final)

### 1. Background Jobs (TaskService Abstraction)
- Extraction runs via `TaskService.submit(extract_task, document_id)`
- Initially: FastAPI `BackgroundTasks` (in-process)
- Future: Celery, RQ, or APScheduler — no API changes needed
- `TaskService` interface: `submit(task, *args, **kwargs)`, `get_status(task_id)`

### 2. Parser Interface
Every parser implements:
- `supports(extension: str) → bool` — can this parser handle this file type?
- `validate(filepath: str) → list[str]` — pre-parse validation warnings
- `parse(filepath: str) → DocumentParseResult` — extract text and metadata
- `extract_metadata(filepath: str) → dict` — metadata without full parse
- `health_check() → bool` — is the parser's library available?

### 3. Storage Configuration
- Path configured via `DOCUMENT_STORAGE_PATH` environment variable
- Default: `storage/uploads/`
- Deployments can change storage without code changes

### 4. Chunking Service
- `ChunkService` is a separate module from `DocumentService`
- `DocumentService.extract()` → calls `Parser.parse()` → calls `ChunkService.chunk()`
- Chunking logic can evolve independently (different strategies, sizes, overlaps)

### 5. Analysis Types (Enum)
```python
from enum import Enum

class AnalysisType(str, Enum):
    SUMMARY = "summary"
    EXPLANATION = "explanation"
    QA = "qa"
    LAB_REPORT = "lab_report"
    PRESCRIPTION = "prescription"
```

### 6. API Versioning
- All document routes under `/api/v1/documents`
- Future API versions can coexist (e.g., `/api/v2/documents`)

### 7. Configurable File Limits
```python
MAX_UPLOAD_SIZE = int(os.environ.get("MAX_UPLOAD_SIZE_MB", 20)) * 1024 * 1024
MAX_PAGES = int(os.environ.get("MAX_DOCUMENT_PAGES", 500))
MAX_WORDS = int(os.environ.get("MAX_DOCUMENT_WORDS", 100000))
```

### 8. Logging
- Log every operation: upload, extraction, analysis, delete, failures
- Include: document_id, user_id, processing_time_ms, file_size, parser_used
- Use Python's `logging` module (already configured in the project)

### 9. Structured Error Codes
```python
class DocumentErrorCode(str, Enum):
    DOCUMENT_TOO_LARGE = "DOCUMENT_TOO_LARGE"
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE"
    PARSER_FAILED = "PARSER_FAILED"
    ANALYSIS_FAILED = "ANALYSIS_FAILED"
    DOCUMENT_NOT_FOUND = "DOCUMENT_NOT_FOUND"
    EXTRACTION_FAILED = "EXTRACTION_FAILED"
    DUPLICATE_DOCUMENT = "DUPLICATE_DOCUMENT"
    UNAUTHORIZED = "UNAUTHORIZED"
```

### 10. Verification Checklist
- [ ] Functional: PDF/DOCX/XLSX/CSV/TXT upload + extract + analyze + Q&A
- [ ] Security: MIME validation, path traversal, auth, cross-user isolation
- [ ] Performance: Large file handling, extraction time < 30s
- [ ] Build: `vite build` passes, `pip install` succeeds
- [ ] Regression: Existing chat, records, analytics, voice all work

---

## 1. Overall Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (React)                                 │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  DocumentsPage                                                    │   │
│  │                                                                    │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │   │
│  │  │ DocumentUploader │  │  DocumentList   │  │  DocumentViewer  │  │   │
│  │  │                 │  │                 │  │                  │  │   │
│  │  │ - Drag & drop   │  │ - Card grid     │  │ - Summary tab    │  │   │
│  │  │ - File picker   │  │ - Search/filter │  │ - Original Text  │  │   │
│  │  │ - Progress bar  │  │ - Sort          │  │ - Ask AI tab     │  │   │
│  │  │ - Multi-file    │  │ - Delete        │  │ - Metadata tab   │  │   │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬─────────┘  │   │
│  │           │                    │                     │            │   │
│  │           └────────────────────┴─────────────────────┘            │   │
│  │                              │ HTTP multipart + JSON              │   │
│  └──────────────────────────────┼────────────────────────────────────┘   │
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────────┐
│                          FASTAPI BACKEND                                 │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  /api/v1/documents/*  (new router)                               │   │
│  │                                                                   │   │
│  │  POST /upload       → validate + save + checksum + queue         │   │
│  │  POST /extract      → TaskService → parse + chunk + DB           │   │
│  │  POST /analyze      → LLM summarize/explain                      │   │
│  │  POST /question     → LLM answer question on document            │   │
│  │  GET /              → list user's documents                      │   │
│  │  GET /{id}          → get document details                       │   │
│  │  DELETE /{id}       → delete file + DB row                       │   │
│  └──────────────────────────┬────────────────────────────────────────┘   │
│                             │                                            │
│  ┌──────────────────────────▼────────────────────────────────────────┐   │
│  │  document_service.py  (new service)                               │   │
│  │                                                                    │   │
│  │  upload()    → validate → save → checksum → DB insert             │   │
│  │  extract()   → dispatch parser → ChunkService → DB update         │   │
│  │  analyze()   → LLM (summarize/explain) → store analysis           │   │
│  │  question()  → LLM (answer on document) → return result           │   │
│  │  delete()    → remove file + DB row + analyses                    │   │
│  └──────────────────────────┬────────────────────────────────────────┘   │
│                             │                                            │
│  ┌──────────────────────────▼────────────────────────────────────────┐   │
│  │  TaskService (abstracted background execution)                    │   │
│  │                                                                    │   │
│  │  submit(task, *args) → task_id                                    │   │
│  │  get_status(task_id) → status                                     │   │
│  │                                                                    │   │
│  │  Initial: FastAPI BackgroundTasks                                 │   │
│  │  Future: Celery / RQ / APScheduler (swap without API changes)     │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────▼────────────────────────────────────────┐   │
│  │  ChunkService (independent chunking logic)                        │   │
│  │                                                                    │   │
│  │  chunk_text(text, page_count) → list of chunk objects             │   │
│  │  Configurable: CHUNK_SIZE, CHUNK_OVERLAP                          │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────▼────────────────────────────────────────┐   │
│  │  Parser Registry (plug-in pattern)                                │   │
│  │                                                                    │   │
│  │  PARSERS = {                                                      │   │
│  │      ".pdf":  PDFParser(),                                        │   │
│  │      ".docx": DOCXParser(),                                       │   │
│  │      ".xlsx": XLSXParser(),                                       │   │
│  │      ".csv":  CSVParser(),                                        │   │
│  │      ".txt":  TXTParser(),                                        │   │
│  │  }                                                                │   │
│  │                                                                    │   │
│  │  Each parser implements: supports(), validate(), parse(),         │   │
│  │                          extract_metadata(), health_check()       │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Storage (configurable via DOCUMENT_STORAGE_PATH)                 │   │
│  │                                                                   │   │
│  │  {DOCUMENT_STORAGE_PATH}/{user_id}/originals/{uuid}.ext           │   │
│  │  {DOCUMENT_STORAGE_PATH}/{user_id}/extracted/{uuid}.txt           │   │
│  │  {DOCUMENT_STORAGE_PATH}/{user_id}/thumbnails/  (future)          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Database                                                         │   │
│  │                                                                    │   │
│  │  documents: id, user_id, original_filename, stored_filename,      │   │
│  │             mime_type, file_size, checksum, version,              │   │
│  │             upload_time, created_at, updated_at, last_accessed,   │   │
│  │             parser_used, processing_time_ms,                      │   │
│  │             status (UPLOADED|EXTRACTING|READY|ANALYZING|          │   │
│  │                      COMPLETED|FAILED),                           │   │
│  │             extracted_text, text_chunks (JSON),                   │   │
│  │             metadata (JSON), error_code, error_message            │   │
│  │                                                                    │   │
│  │  document_analyses: id, document_id, type (enum),                 │   │
│  │                     content, llm_model, generated_at              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Parser Architecture

### 2.1 Parser Registry (Plug-in Pattern)

```python
# backend/services/parsers/__init__.py

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


class AnalysisType(str, Enum):
    SUMMARY = "summary"
    EXPLANATION = "explanation"
    QA = "qa"
    LAB_REPORT = "lab_report"
    PRESCRIPTION = "prescription"


class DocumentErrorCode(str, Enum):
    DOCUMENT_TOO_LARGE = "DOCUMENT_TOO_LARGE"
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE"
    PARSER_FAILED = "PARSER_FAILED"
    ANALYSIS_FAILED = "ANALYSIS_FAILED"
    DOCUMENT_NOT_FOUND = "DOCUMENT_NOT_FOUND"
    EXTRACTION_FAILED = "EXTRACTION_FAILED"
    DUPLICATE_DOCUMENT = "DUPLICATE_DOCUMENT"
    UNAUTHORIZED = "UNAUTHORIZED"


@dataclass
class DocumentParseResult:
    text: str
    metadata: dict
    page_count: int
    word_count: int
    warnings: list[str]
    parser_used: str
    processing_time_ms: float = 0.0


class BaseParser:
    """All parsers must implement this interface."""
    extension: str = ""
    display_name: str = ""

    def supports(self, extension: str) -> bool:
        return extension.lower() == self.extension

    def validate(self, filepath: str) -> list[str]:
        """Pre-parse validation. Return list of warnings."""
        return []

    def parse(self, filepath: str) -> DocumentParseResult:
        raise NotImplementedError

    def extract_metadata(self, filepath: str) -> dict:
        """Extract metadata without full text parse."""
        raise NotImplementedError

    def health_check(self) -> bool:
        """Check if parser's library is available."""
        try:
            self._import_library()
            return True
        except ImportError:
            return False

    def _import_library(self):
        """Import the required library. Override in subclasses."""
        pass


# Registry
PARSERS: dict[str, BaseParser] = {}

def register_parser(parser: BaseParser) -> None:
    PARSERS[parser.extension] = parser

def get_parser(extension: str) -> Optional[BaseParser]:
    return PARSERS.get(extension.lower())

def parse_document(filepath: str, extension: str) -> DocumentParseResult:
    parser = get_parser(extension)
    if not parser:
        raise ValueError(f"No parser registered for extension: {extension}")
    return parser.parse(filepath)
```

### 2.2 Parser Implementations

Each parser extends `BaseParser` and registers itself:

```python
# backend/services/parsers/pdf_parser.py
import time
from ..parsers import BaseParser, DocumentParseResult, register_parser

class PDFParser(BaseParser):
    extension = ".pdf"
    display_name = "PDF Parser"

    def _import_library(self):
        from pypdf import PdfReader  # noqa: F401

    def validate(self, filepath: str) -> list[str]:
        warnings = []
        try:
            from pypdf import PdfReader
            reader = PdfReader(filepath)
            if len(reader.pages) > 500:
                warnings.append(f"PDF has {len(reader.pages)} pages. Processing may be slow.")
        except Exception:
            warnings.append("Could not validate PDF structure.")
        return warnings

    def extract_metadata(self, filepath: str) -> dict:
        from pypdf import PdfReader
        reader = PdfReader(filepath)
        return {
            "pages": len(reader.pages),
            "author": str(reader.metadata.author) if reader.metadata and reader.metadata.author else None,
            "producer": str(reader.metadata.producer) if reader.metadata and reader.metadata.producer else None,
        }

    def parse(self, filepath: str) -> DocumentParseResult:
        start = time.time()
        try:
            from pypdf import PdfReader
            reader = PdfReader(filepath)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n\n"

            word_count = len(text.split())
            elapsed = (time.time() - start) * 1000

            # Detect scanned PDF
            if word_count < 10 and len(reader.pages) > 0:
                return DocumentParseResult(
                    text="",
                    metadata={"pages": len(reader.pages)},
                    page_count=len(reader.pages),
                    word_count=0,
                    warnings=["Scanned document detected. OCR support will be added in the Vision phase."],
                    parser_used="pdf_parser",
                    processing_time_ms=round(elapsed, 2),
                )

            return DocumentParseResult(
                text=text.strip(),
                metadata=self.extract_metadata(filepath),
                page_count=len(reader.pages),
                word_count=word_count,
                warnings=[],
                parser_used="pdf_parser",
                processing_time_ms=round(elapsed, 2),
            )
        except Exception as e:
            elapsed = (time.time() - start) * 1000
            return DocumentParseResult(
                text="",
                metadata={},
                page_count=0,
                word_count=0,
                warnings=[f"PDF parsing failed: {str(e)}"],
                parser_used="pdf_parser",
                processing_time_ms=round(elapsed, 2),
            )

register_parser(PDFParser())
```

### 2.3 Parser List

| Parser | Extension | Library | Methods |
|--------|-----------|---------|---------|
| `PDFParser` | `.pdf` | pypdf2 | supports, validate, parse, extract_metadata, health_check |
| `DOCXParser` | `.docx` | python-docx | supports, validate, parse, extract_metadata, health_check |
| `XLSXParser` | `.xlsx` | openpyxl | supports, validate, parse, extract_metadata, health_check |
| `CSVParser` | `.csv` | pandas | supports, validate, parse, extract_metadata, health_check |
| `TXTParser` | `.txt` | built-in | supports, validate, parse, extract_metadata, health_check |

---

## 3. TaskService (Background Jobs)

```python
# backend/services/task_service.py

import logging
from typing import Callable, Any
from fastapi import BackgroundTasks

logger = logging.getLogger(__name__)


class TaskService:
    """
    Abstracted background task execution.

    Initial implementation uses FastAPI BackgroundTasks.
    Future implementations can swap to Celery, RQ, or APScheduler
    without changing the calling code.

    Usage:
        task_service = TaskService()
        task_service.submit(background_tasks, extract_task, document_id=42)
    """

    def __init__(self):
        self._implementation = "background_tasks"  # future: "celery", "rq", "apscheduler"

    def submit(self, background_tasks: BackgroundTasks, task: Callable, *args, **kwargs) -> str:
        """
        Submit a task for background execution.

        Args:
            background_tasks: FastAPI BackgroundTasks (injected by FastAPI)
            task: Callable to execute
            *args, **kwargs: Arguments for the task

        Returns:
            task_id: Identifier for the task (for future status tracking)
        """
        task_id = f"task_{id(task)}_{hash(str(args))}_{hash(str(kwargs))}"

        if self._implementation == "background_tasks":
            background_tasks.add_task(self._run_task, task, task_id, *args, **kwargs)
        # Future: elif self._implementation == "celery":
        #     celery_task.delay(*args, **kwargs)

        logger.info("Task submitted: %s (%s)", task.__name__, task_id)
        return task_id

    def _run_task(self, task: Callable, task_id: str, *args, **kwargs):
        """Wrapper to log task execution."""
        logger.info("Task started: %s (%s)", task.__name__, task_id)
        try:
            result = task(*args, **kwargs)
            logger.info("Task completed: %s (%s)", task.__name__, task_id)
            return result
        except Exception as e:
            logger.error("Task failed: %s (%s): %s", task.__name__, task_id, str(e))
            raise


# Singleton instance
task_service = TaskService()
```

---

## 4. ChunkService

```python
# backend/services/chunk_service.py

import os
import json
import logging

logger = logging.getLogger(__name__)

# Configuration
CHUNK_SIZE = int(os.environ.get("CHUNK_SIZE", 1000))       # words per chunk
CHUNK_OVERLAP = int(os.environ.get("CHUNK_OVERLAP", 100))  # overlapping words


class ChunkService:
    """
    Handles text chunking for document processing.

    Chunking logic can evolve independently from DocumentService.
    Future strategies: sentence-based, paragraph-based, semantic.
    """

    def chunk_text(self, text: str, page_count: int = 1) -> list[dict]:
        """
        Split text into overlapping chunks.

        Args:
            text: Full extracted text
            page_count: Number of pages (for page reference estimation)

        Returns:
            List of chunk dicts with chunk_index, page_number, start_word, end_word, text
        """
        if not text or not text.strip():
            return []

        words = text.split()
        total_words = len(words)
        chunks = []
        chunk_index = 0
        start = 0

        while start < total_words:
            end = min(start + CHUNK_SIZE, total_words)
            chunk_words = words[start:end]
            chunk_text = " ".join(chunk_words)

            # Estimate page number
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

        logger.debug("Chunked %d words into %d chunks", total_words, len(chunks))
        return chunks


# Singleton
chunk_service = ChunkService()
```

---

## 5. Database Schema

### 5.1 Table: `documents`

```python
class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # File identity
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256
    version: Mapped[int] = mapped_column(Integer, default=1)

    # Timestamps
    upload_time: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[str] = mapped_column(String(30), nullable=False)
    updated_at: Mapped[str] = mapped_column(String(30), nullable=False)
    last_accessed: Mapped[str] = mapped_column(String(30), nullable=True)

    # Parsing
    parser_used: Mapped[str] = mapped_column(String(50), nullable=True)
    processing_time_ms: Mapped[float] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="UPLOADED")

    # Content
    extracted_text: Mapped[str] = mapped_column(Text, nullable=True)
    text_chunks: Mapped[str] = mapped_column(Text, nullable=True)
    metadata: Mapped[str] = mapped_column(Text, nullable=True)

    # Error
    error_code: Mapped[str] = mapped_column(String(50), nullable=True)
    error_message: Mapped[str] = mapped_column(String(500), nullable=True)

    # Relationships
    user = relationship("User", backref="documents")
    analyses = relationship("DocumentAnalysis", back_populates="document", cascade="all, delete-orphan")
```

### 5.2 Table: `document_analyses`

```python
class DocumentAnalysis(Base):
    __tablename__ = "document_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # AnalysisType enum value
    content: Mapped[str] = mapped_column(Text, nullable=False)
    llm_model: Mapped[str] = mapped_column(String(100), nullable=False)
    generated_at: Mapped[str] = mapped_column(String(30), nullable=False)

    document = relationship("Document", back_populates="analyses")
```

### 5.3 Indexes

```python
__table_args__ = (
    Index("idx_documents_user_status", "user_id", "status"),
    Index("idx_documents_checksum", "checksum"),
    Index("idx_documents_updated", "updated_at"),
)
```

---

## 6. Backend API Design

### 6.1 Router: `/api/v1/documents`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/documents/upload` | JWT | Upload file(s) |
| POST | `/api/v1/documents/extract` | JWT | Extract text |
| POST | `/api/v1/documents/analyze` | JWT | AI analyze |
| POST | `/api/v1/documents/question` | JWT | Ask question |
| GET | `/api/v1/documents` | JWT | List documents |
| GET | `/api/v1/documents/{id}` | JWT | Get document |
| DELETE | `/api/v1/documents/{id}` | JWT | Delete document |

### 6.2 Standard API Response

```python
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    error_code: Optional[str] = None
    timestamp: str
```

---

## 7. Frontend UI Design

### 7.1 Route

```jsx
{ path: 'ai/documents', element: <DocumentsPage /> }
```

### 7.2 Sidebar

```jsx
{ name: 'Documents', href: '/ai/documents', icon: FileText },
```

### 7.3 Component Tree

```
DocumentsPage
├── PageHeader
├── DocumentUploader (drag & drop + progress)
├── DocumentList (card grid + search/filter/sort)
│   ├── EmptyState
│   └── DocumentCard (icon, name, date, size, status, parser, pages, words, actions)
└── DocumentViewer (slide-over, 4 tabs)
    ├── SummaryTab (Summarize/Explain buttons + results)
    ├── OriginalTextTab (extracted text)
    ├── AskAITab (Q&A)
    └── MetadataTab (all properties)
```

---

## 8. Files to Create

### Backend (12 files)

| # | File | Purpose |
|---|------|---------|
| 1 | `backend/api/routes/documents.py` | 7 endpoints under `/api/v1/documents` |
| 2 | `backend/services/document_service.py` | Upload, extract, analyze, question, delete |
| 3 | `backend/services/task_service.py` | Abstracted background task execution |
| 4 | `backend/services/chunk_service.py` | Text chunking logic |
| 5 | `backend/services/parsers/__init__.py` | Parser registry, BaseParser, enums, errors |
| 6 | `backend/services/parsers/pdf_parser.py` | PDFParser class |
| 7 | `backend/services/parsers/docx_parser.py` | DOCXParser class |
| 8 | `backend/services/parsers/xlsx_parser.py` | XLSXParser class |
| 9 | `backend/services/parsers/csv_parser.py` | CSVParser class |
| 10 | `backend/services/parsers/txt_parser.py` | TXTParser class |
| 11 | `backend/services/parsers/__init__.py` | Auto-imports all parsers |

### Frontend (9 files)

| # | File | Purpose |
|---|------|---------|
| 1 | `frontend/src/features/documents/pages/DocumentsPage.jsx` | Main page |
| 2 | `frontend/src/features/documents/components/DocumentUploader.jsx` | Drag & drop upload |
| 3 | `frontend/src/features/documents/components/DocumentList.jsx` | Card grid |
| 4 | `frontend/src/features/documents/components/DocumentViewer.jsx` | Slide-over panel |
| 5 | `frontend/src/features/documents/components/DocumentCard.jsx` | Individual card |
| 6 | `frontend/src/features/documents/components/UploadProgress.jsx` | Progress indicator |
| 7 | `frontend/src/features/documents/components/SummaryTab.jsx` | Summarize/Explain |
| 8 | `frontend/src/features/documents/components/AskAITab.jsx` | Q&A |
| 9 | `frontend/src/features/documents/components/MetadataTab.jsx` | Properties |

---

## 9. Files to Modify

### Backend (4 files)

| # | File | Changes |
|---|------|---------|
| 1 | `backend/db/models.py` | Add Document + DocumentAnalysis models |
| 2 | `backend/api/main.py` | Register documents router under `/api/v1` |
| 3 | `backend/services/llm_service.py` | Add 3 system prompts |
| 4 | `backend/requirements.txt` | Add pypdf2, python-docx |

### Frontend (3 files)

| # | File | Changes |
|---|------|---------|
| 1 | `frontend/src/app/routes.jsx` | Add `/ai/documents` route |
| 2 | `frontend/src/app/components/Sidebar.jsx` | Add Documents nav item |
| 3 | `frontend/src/app/services/api.js` | Add documentService |

---

## 10. Implementation Order

### Phase 2a: Foundation (Days 1-2)
1. Add models to `db/models.py`
2. Create storage directory
3. Update `requirements.txt`
4. Create parser registry + all 5 parsers
5. Create `chunk_service.py`
6. Create `task_service.py`
7. Create `document_service.py` (upload + extract)
8. Create `documents.py` route (upload + extract + list + get + delete)
9. Register router in `main.py`
10. Add `documentService` to `api.js`

### Phase 2b: Frontend Upload & List (Days 3-4)
1. Create DocumentUploader + UploadProgress
2. Create DocumentList + DocumentCard
3. Create DocumentsPage
4. Add route + sidebar

### Phase 2c: Viewer & Analysis (Days 5-6)
1. Create DocumentViewer + 3 tabs
2. Add analyze + question to document_service.py
3. Add analyze + question routes
4. Add system prompts to llm_service.py

### Phase 2d: Polish & Testing (Day 7)
1. Error handling + structured error codes
2. Loading/empty states
3. Mobile responsive
4. Security audit
5. Full test suite

---

## 11. Verification Checklist

- [ ] **Functional**: PDF/DOCX/XLSX/CSV/TXT upload + extract + analyze + Q&A
- [ ] **Security**: MIME validation, path traversal, auth, cross-user isolation
- [ ] **Performance**: Large file handling, extraction time < 30s
- [ ] **Build**: `vite build` passes, `pip install` succeeds
- [ ] **Regression**: Existing chat, records, analytics, voice all work