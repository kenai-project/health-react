# Phase 2a Backend Foundation — Architecture Documentation

## Overview

Phase 2a implements a complete document management backend foundation with plug-in parser architecture, background task execution, and comprehensive security controls.

## Core Components

### 1. Parser Registry (`services/parsers/`)

**Purpose:** Pluggable document parsing framework supporting multiple file formats.

**Architecture:**
- `BaseParser`: Abstract base class defining the parser interface
- `DocumentParseResult`: Standardized result dataclass returned by all parsers
- `DocumentErrorCode`: Enum of structured error codes
- `AnalysisType`: Enum of AI analysis types (summary, explanation, QA, lab_report, prescription)
- Registry pattern with `register_parser()` and `get_parser()`

**Usage:**
```python
from services.parsers import parse_document, get_parser

# Parse a document
result = parse_document("/path/to/file.pdf", ".pdf")

# Check parser health
parser = get_parser(".pdf")
is_healthy = parser.health_check()
```

**Supported Formats:**
- `.pdf` — PDF documents (requires `pypdf2`)
- `.docx` — Word documents (requires `python-docx`)
- `.xlsx` — Excel spreadsheets (requires `openpyxl`)
- `.csv` — CSV files (requires `pandas`)
- `.txt` — Plain text (built-in)

**Adding a New Parser:**
1. Create `services/parsers/myparser.py`
2. Implement `BaseParser` interface
3. Call `register_parser(MyParser())` at module level
4. Import in `__init__.py`

### 2. ChunkService (`services/chunk_service.py`)

**Purpose:** Split extracted text into overlapping chunks for RAG and analysis.

**Configuration:**
- `CHUNK_SIZE`: Words per chunk (default: 1000, env: `CHUNK_SIZE`)
- `CHUNK_OVERLAP`: Overlapping words between chunks (default: 100, env: `CHUNK_OVERLAP`)

**Algorithm:**
- Word-based chunking with configurable overlap
- Page number estimation based on word position
- Metadata includes: `chunk_index`, `page_number`, `start_word`, `end_word`, `text`

**Usage:**
```python
from services.chunk_service import chunk_service

chunks = chunk_service.chunk_text(full_text, page_count=10)
for chunk in chunks:
    print(chunk["chunk_index"], chunk["page_number"], chunk["text"][:100])
```

### 3. TaskService (`services/task_service.py`)

**Purpose:** Abstracted background task execution.

**Current Implementation:** FastAPI `BackgroundTasks`
**Future:** Swappable to Celery, RQ, or APScheduler without changing calling code.

**Usage:**
```python
from services.task_service import task_service

def my_task(arg1, arg2):
    # Long-running task
    pass

task_id = task_service.submit(background_tasks, my_task, "arg1", "arg2")
```

### 4. DocumentService (`services/document_service.py`)

**Purpose:** Business logic for document management (upload, extract, list, get, delete).

**Key Features:**
- SHA-256 checksum-based duplicate detection
- Versioning (same filename + different content = new version)
- Filename sanitization (path traversal protection)
- MIME type validation
- File size limits
- User isolation (foreign key enforcement)
- Background extraction via TaskService
- Structured logging with document_id, user_id, processing_time

**Configuration:**
- `DOCUMENT_STORAGE_PATH`: Base directory for uploads (default: `storage/uploads`, env: `DOCUMENT_STORAGE_PATH`)
- `MAX_UPLOAD_SIZE_MB`: Max file size in MB (default: 20, env: `MAX_UPLOAD_SIZE_MB`)
- `MAX_DOCUMENT_PAGES`: Max pages per document (default: 500, env: `MAX_DOCUMENT_PAGES`)
- `MAX_DOCUMENT_WORDS`: Max words per document (default: 100000, env: `MAX_DOCUMENT_WORDS`)

**Storage Structure:**
```
storage/uploads/
├── {user_id}/
│   ├── originals/
│   │   └── {uuid}.pdf  # Original uploaded files
│   ├── extracted/
│   │   └── {uuid}.txt  # Extracted text
│   └── thumbnails/
│       └── {uuid}.png  # Future: thumbnails
```

**Public API:**

| Function | Description |
|----------|-------------|
| `upload_document(user_id, filename, content, mime_type)` | Upload a document |
| `extract_document(document_id, user_id, background_tasks)` | Queue text extraction |
| `get_document(document_id, user_id)` | Get single document |
| `list_documents(user_id, search, type, page, per_page)` | List with pagination |
| `delete_document(document_id, user_id)` | Delete document + files |

**Return Format:**
```python
{
    "success": bool,
    "message": str,
    "data": dict | None,
    "error_code": str | None,
    "timestamp": str  # ISO 8601
}
```

### 5. Document Lifecycle

```
UPLOADED → EXTRACTING → READY
              ↓
           FAILED
```

**States:**
- `UPLOADED`: File uploaded, not yet extracted
- `EXTRACTING`: Background extraction in progress
- `READY`: Extraction complete, text available
- `FAILED`: Extraction failed (check `error_code` and `error_message`)

**Background Extraction Flow:**
1. Client calls `POST /api/v1/documents/extract`
2. DocumentService updates status to `EXTRACTING`
3. TaskService submits `_perform_extraction()` to BackgroundTasks
4. Parser extracts text via parser registry
5. ChunkService splits text into chunks
6. Extracted text saved to `storage/uploads/{user_id}/extracted/{uuid}.txt`
7. Document updated with `extracted_text`, `text_chunks`, `doc_metadata`
8. Status set to `READY` (or `FAILED` if no text)

### 6. Database Schema

**Table: `documents`**
- 20 columns including: user_id (FK), filename, checksum, version, timestamps, status, extracted_text, text_chunks, doc_metadata
- 3 indexes: `idx_documents_user_status`, `idx_documents_checksum`, `idx_documents_updated`
- Foreign key to `users` table with CASCADE delete

**Table: `document_analyses`**
- 6 columns including: document_id (FK), type, content, llm_model, generated_at
- Index on `document_id`
- Foreign key to `documents` table with CASCADE delete

### 7. API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/documents/upload` | JWT | Upload file(s) — multipart/form-data |
| POST | `/api/v1/documents/extract` | JWT | Extract text — background task |
| GET | `/api/v1/documents` | JWT | List with pagination/search/filter |
| GET | `/api/v1/documents/{id}` | JWT | Get single document |
| DELETE | `/api/v1/documents/{id}` | JWT | Delete document + files |

**Standard Response Envelope:**
```json
{
    "success": true,
    "message": "Operation completed",
    "data": { ... },
    "error_code": null,
    "timestamp": "2026-07-30T10:00:00+00:00"
}
```

### 8. Security Controls

- **Path Traversal Protection:** `os.path.basename()` + regex strip of `\/:*?"<>|`
- **MIME Type Validation:** Extension must match expected MIME type
- **File Size Limits:** Enforced at upload time
- **User Isolation:** Foreign key constraints + user_id checks
- **Delete Authorization:** User can only delete own documents
- **Checksum Verification:** SHA-256 for duplicate detection

### 9. Logging Standards

- **INFO:** Normal operations (upload, extract, delete)
- **WARNING:** Recoverable issues (scanned PDF, parser warnings)
- **ERROR:** Failures (upload failed, extraction failed, DB errors)

**Log Format:**
```python
logger.info("Document uploaded: id=%d, user=%d, filename=%s, size=%d", ...)
logger.error("Upload failed: %s", e)
```

### 10. Dependencies

**New in Phase 2a:**
- `pypdf2>=3.0.0` — PDF parsing
- `python-docx>=1.1.0` — DOCX parsing
- `pytest` — Testing (dev dependency)

**Existing (used):**
- `openpyxl==3.1.5` — XLSX parsing
- `pandas>=2.3.0` — CSV parsing

## Future Enhancements (Phase 2b+)

- OCR for scanned PDFs (Tesseract + Vision model)
- Thumbnail generation
- Document preview
- AI analysis endpoints (summary, explanation, QA)
- RAG integration with embeddings
- Multi-language support
- Chat history with document context