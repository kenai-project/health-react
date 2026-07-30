# Phase 2c Analysis — AI-Powered Document Analysis

## Executive Summary

Phase 2c adds AI-powered analysis capabilities to the document management system. Users can generate summaries, explanations, and ask questions about their documents using local LLMs via Ollama. All processing remains local and privacy-focused.

---

## 1. AI Analysis Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AskAITab (already exists, UI only)                  │  │
│  │  - Message list                                      │  │
│  │  - Input field                                       │  │
│  │  - Streaming display                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/SSE
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes (/api/v1/documents/{id}/...)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AnalysisService (orchestrator)                      │  │
│  │  - Coordinates analysis pipeline                     │  │
│  │  - Manages caching                                   │  │
│  │  - Handles streaming                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│          ┌─────────────────┼─────────────────┐             │
│          ▼                 ▼                 ▼             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PromptBuilder│  │ContextSelector│  │CitationGenerator│  │
│  │ - Templates  │  │ - Chunk select│  │ - Chunk refs  │     │
│  │ - Variables  │  │ - Token budget│  │ - Page numbers│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LLMService (wrapper around Ollama)                  │  │
│  │  - Model selection                                   │  │
│  │  - Streaming support                                 │  │
│  │  - Error handling                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CacheManager (Redis or in-memory)                   │  │
│  │  - Key: document_id + analysis_type + prompt_hash    │  │
│  │  - TTL: 24 hours                                    │  │
│  │  - Invalidation on document update                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ollama (Local LLM)                        │
│  - Model: llama3.2:3b or mistral:7b                        │
│  - Endpoint: http://localhost:11434                         │
│  - Streaming: SSE (/api/chat)                               │
└─────────────────────────────────────────────────────────────┘
```

### Service Responsibilities

#### AnalysisService
**Purpose:** Orchestrate the analysis pipeline

**Methods:**
- `analyze_document(document_id, analysis_type, user_id, params)` — Main entry point
- `get_analysis_history(document_id, user_id)` — Retrieve past analyses
- `delete_analysis(analysis_id, user_id)` — Delete specific analysis
- `regenerate_analysis(analysis_id, user_id)` — Force regeneration

**Flow:**
1. Check cache for existing analysis
2. If cache miss:
   - Load document and chunks
   - Select relevant chunks (ContextSelector)
   - Build prompt (PromptBuilder)
   - Call LLM (LLMService)
   - Generate citations (CitationGenerator)
   - Save to database
   - Cache result
3. Return analysis

#### PromptBuilder
**Purpose:** Build prompts from templates

**Methods:**
- `build_prompt(analysis_type, document_text, chunks, question=None)` — Build final prompt
- `get_template(analysis_type)` — Get prompt template
- `validate_template(analysis_type)` — Ensure template exists

**Templates:**
- `SUMMARY` — Summarize document
- `EXPLANATION` — Explain medical terms
- `QA` — Answer specific question
- `LAB_REPORT` — Explain lab results
- `PRESCRIPTION` — Explain medications

#### ContextSelector
**Purpose:** Select relevant chunks for analysis

**Methods:**
- `select_chunks(document_id, analysis_type, max_tokens=4000)` — Select chunks
- `estimate_tokens(text)` — Estimate token count
- `fit_within_budget(chunks, max_tokens)` — Fit chunks within budget

**Algorithm:**
1. Load all chunks for document
2. For SUMMARY/EXPLANATION: Use first N chunks (chronological)
3. For QA: Search chunks for relevant keywords (simple TF-IDF or embedding similarity)
4. For LAB_REPORT/PRESCRIPTION: Use all chunks (documents are typically short)
5. Trim chunks to fit within token budget
6. Return selected chunks with metadata

#### CitationGenerator
**Purpose:** Generate citations from chunk metadata

**Methods:**
- `generate_citations(chunks, response_text)` — Map response to chunks
- `format_citation(chunk)` — Format citation as "(Page X, Paragraph Y)"

**Output:**
```json
{
  "citations": [
    {
      "chunk_index": 3,
      "page_number": 2,
      "text_preview": "Patient has elevated blood pressure...",
      "start_word": 150,
      "end_word": 200
    }
  ]
}
```

#### CacheManager
**Purpose:** Cache analysis results to avoid repeated LLM calls

**Methods:**
- `get(document_id, analysis_type, prompt_hash)` — Get cached analysis
- `set(document_id, analysis_type, prompt_hash, analysis)` — Cache analysis
- `invalidate(document_id)` — Invalidate all analyses for document
- `clear()` — Clear entire cache

**Cache Key:** `analysis:{document_id}:{analysis_type}:{prompt_hash}`

**Cache TTL:** 24 hours (configurable)

**Cache Invalidation:**
- Document update → invalidate all analyses for document
- Manual regenerate → bypass cache

#### LLMService
**Purpose:** Wrapper around Ollama API

**Methods:**
- `generate(prompt, model, stream=False)` — Generate response
- `stream(prompt, model)` — Stream response (SSE)
- `get_available_models()` — List available models
- `validate_model(model)` — Check if model is available

**Configuration:**
- Default model: `llama3.2:3b` (fast, good quality)
- Alternative: `mistral:7b` (better quality, slower)
- Endpoint: `http://localhost:11434`
- Timeout: 60 seconds
- Stream chunk size: 10 tokens

---

## 2. Features

### Document Summary
**Description:** Generate a concise summary of the document

**Use Cases:**
- Quick overview of long medical reports
- Understand document content without reading full text

**Prompt Template:**
```
Summarize the following medical document in 3-5 bullet points.
Focus on key findings, diagnoses, and recommendations.

Document:
{document_text}

Summary:
```

**Response Format:**
```json
{
  "type": "summary",
  "content": "• Patient presents with elevated blood pressure...\n• Lab results indicate...\n• Recommended treatment...",
  "citations": [...]
}
```

### Document Explanation
**Description:** Explain medical terms and concepts in plain language

**Use Cases:**
- Understand medical jargon
- Explain lab results to patients

**Prompt Template:**
```
Explain the following medical document in simple, patient-friendly language.
Avoid medical jargon and explain any necessary terms.

Document:
{document_text}

Explanation:
```

**Response Format:**
```json
{
  "type": "explanation",
  "content": "This document shows that your blood pressure is higher than normal...",
  "citations": [...]
}
```

### Question & Answer
**Description:** Answer specific questions about the document

**Use Cases:**
- Find specific information
- Clarify details

**Prompt Template:**
```
Answer the following question based on the document context.

Context:
{context_chunks}

Question: {question}

Answer:
```

**Response Format:**
```json
{
  "type": "qa",
  "content": "The patient's blood pressure is 140/90 mmHg...",
  "citations": [...]
}
```

### Streaming Responses
**Description:** Stream LLM responses in real-time

**Benefits:**
- Better UX (no waiting for full response)
- Lower perceived latency
- Progressive rendering

**Implementation:** Server-Sent Events (SSE)

### Analysis History
**Description:** Store all analyses for a document

**Database:** `document_analyses` table (already exists)

**Fields:**
- `id` — Primary key
- `document_id` — Foreign key to documents
- `type` — Analysis type (summary, explanation, qa, lab_report, prescription)
- `content` — Generated content
- `llm_model` — Model used
- `prompt_hash` — Hash of prompt (for cache invalidation)
- `citations` — JSON array of citations
- `generated_at` — Timestamp
- `user_id` — Foreign key to users (for multi-user support)

### Analysis Caching
**Description:** Cache analyses to avoid repeated LLM calls

**Cache Key:** `analysis:{document_id}:{analysis_type}:{prompt_hash}`

**Cache TTL:** 24 hours

**Invalidation:**
- Document update → invalidate all analyses
- Manual regenerate → bypass cache

### Regenerate Analysis
**Description:** Force regeneration of analysis

**Use Cases:**
- User wants fresh analysis
- LLM model updated
- Document updated

**Implementation:**
- Delete cached analysis
- Delete database record
- Generate new analysis

---

## 3. Context Strategy

### Chunk Selection Algorithm

#### For Summary/Explanation
**Strategy:** Use first N chunks (chronological)

**Rationale:** Summary should cover entire document, not just specific sections

**Algorithm:**
1. Load all chunks sorted by `chunk_index`
2. Select first N chunks until token budget reached
3. If document is short (< 2000 words), use all chunks
4. If document is long (> 2000 words), use first 50% of chunks

**Token Budget:** 4000 tokens (leaves room for response)

#### For Q&A
**Strategy:** Search chunks for relevant keywords

**Algorithm:**
1. Extract keywords from question (remove stop words)
2. Search chunks for keyword matches (simple TF-IDF)
3. Rank chunks by relevance score
4. Select top N chunks until token budget reached
5. If no matches, use first N chunks (fallback)

**Token Budget:** 3000 tokens (leaves room for question and response)

#### For Lab Report/Prescription
**Strategy:** Use all chunks (documents are typically short)

**Rationale:** Medical documents are usually < 5 pages, so all chunks fit within budget

**Token Budget:** 4000 tokens

### Context Window Management

**Token Budget Allocation:**
- System prompt: 200 tokens
- Document context: 3000-4000 tokens
- User question (QA only): 100 tokens
- Response: 500-1000 tokens
- **Total:** 4000-6000 tokens

**Token Estimation:**
- 1 token ≈ 4 characters (English)
- 1 token ≈ 0.75 words
- Use `tiktoken` library (if available) or rough estimate

**Truncation Strategy:**
- If chunks exceed budget, truncate from the end
- Preserve first chunks (most important for summary)
- Add note: "Document truncated due to length"

### Citation Mapping

**Source:** Chunk metadata (already stored in `text_chunks`)

**Chunk Metadata:**
```json
{
  "chunk_index": 3,
  "page_number": 2,
  "start_word": 150,
  "end_word": 200,
  "text": "Patient has elevated blood pressure..."
}
```

**Citation Format:**
- Inline: "(Page 2, Paragraph 3)"
- End of response: "Sources: Page 2, Paragraph 3"

**Mapping Algorithm:**
1. After LLM generates response, search for key phrases in chunks
2. Match response sentences to chunks (simple string matching)
3. Generate citations for matched chunks
4. If no matches, use all chunks as citations (conservative)

---

## 4. Prompt Design

### Template Structure

All templates follow this structure:
```
[System prompt]
[Context]
[User prompt]
[Instructions]
```

### SUMMARY Template

```
You are a medical document assistant. Summarize the following document in 3-5 bullet points.
Focus on key findings, diagnoses, medications, and recommendations.
Use clear, concise language.

Document:
{document_text}

Summary:
```

**Variables:**
- `{document_text}` — Full extracted text

**Expected Output:** 3-5 bullet points

---

### EXPLANATION Template

```
You are a medical document assistant. Explain the following document in simple, patient-friendly language.
Avoid medical jargon and explain any necessary terms in plain English.
Be empathetic and clear.

Document:
{document_text}

Explanation:
```

**Variables:**
- `{document_text}` — Full extracted text

**Expected Output:** 2-3 paragraphs

---

### QA Template

```
You are a medical document assistant. Answer the following question based on the document context.
If the answer is not in the context, say "I don't know" — do not make up information.
Be concise and accurate.

Context:
{context_chunks}

Question: {question}

Answer:
```

**Variables:**
- `{context_chunks}` — Selected chunks (with page numbers)
- `{question}` — User's question

**Expected Output:** 1-3 sentences

---

### LAB_REPORT Template

```
You are a medical document assistant. Explain the following lab report in simple terms.
For each test result:
1. State the value and normal range
2. Explain what it means if it's abnormal
3. Suggest possible causes (do not diagnose)

Lab Report:
{document_text}

Explanation:
```

**Variables:**
- `{document_text}` — Full extracted text

**Expected Output:** Structured explanation by test

---

### PRESCRIPTION Template

```
You are a medical document assistant. Explain the following prescription in simple terms.
For each medication:
1. Name and purpose
2. Dosage and frequency
3. Common side effects
4. Important warnings

Prescription:
{document_text}

Explanation:
```

**Variables:**
- `{document_text}` — Full extracted text

**Expected Output:** Structured explanation by medication

---

## 5. API Design

### Endpoints

#### POST /api/v1/documents/{id}/summary
**Description:** Generate document summary

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "analysis-uuid",
    "type": "summary",
    "content": "• Patient presents with...\n• Lab results indicate...",
    "citations": [
      {
        "chunk_index": 0,
        "page_number": 1,
        "text_preview": "Patient presents with..."
      }
    ],
    "llm_model": "llama3.2:3b",
    "generated_at": "2026-07-30T10:00:00+00:00",
    "cached": false
  }
}
```

**Status Codes:**
- 200: Success
- 404: Document not found
- 422: Analysis failed (LLM error)
- 500: Server error

---

#### POST /api/v1/documents/{id}/explanation
**Description:** Generate document explanation

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "analysis-uuid",
    "type": "explanation",
    "content": "This document shows that...",
    "citations": [...],
    "llm_model": "llama3.2:3b",
    "generated_at": "2026-07-30T10:00:00+00:00",
    "cached": false
  }
}
```

**Status Codes:**
- 200: Success
- 404: Document not found
- 422: Analysis failed
- 500: Server error

---

#### POST /api/v1/documents/{id}/question
**Description:** Answer question about document

**Request:**
```json
{
  "question": "What is the patient's blood pressure?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "analysis-uuid",
    "type": "qa",
    "content": "The patient's blood pressure is 140/90 mmHg...",
    "citations": [...],
    "llm_model": "llama3.2:3b",
    "generated_at": "2026-07-30T10:00:00+00:00",
    "cached": false
  }
}
```

**Status Codes:**
- 200: Success
- 400: Invalid request (missing question)
- 404: Document not found
- 422: Analysis failed
- 500: Server error

---

#### GET /api/v1/documents/{id}/analyses
**Description:** Get analysis history

**Request:**
```
GET /api/v1/documents/{id}/analyses?type=summary&page=1&per_page=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "analysis-uuid",
        "type": "summary",
        "content": "...",
        "llm_model": "llama3.2:3b",
        "generated_at": "2026-07-30T10:00:00+00:00"
      }
    ],
    "total": 5,
    "page": 1,
    "per_page": 20
  }
}
```

**Query Parameters:**
- `type` (optional): Filter by analysis type
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 20)

---

#### DELETE /api/v1/documents/{id}/analyses/{analysis_id}
**Description:** Delete specific analysis

**Request:**
```
DELETE /api/v1/documents/{id}/analyses/{analysis_id}
```

**Response:**
```json
{
  "success": true,
  "message": "Analysis deleted"
}
```

**Status Codes:**
- 200: Success
- 404: Analysis not found
- 403: Unauthorized (user doesn't own document)
- 500: Server error

---

## 6. Streaming: SSE vs WebSockets

### Recommendation: **Server-Sent Events (SSE)**

### Justification

| Criterion | SSE | WebSockets | Winner |
|-----------|-----|------------|--------|
| **Complexity** | Low (HTTP-based) | High (bidirectional) | SSE |
| **Ollama Support** | Native (`/api/chat` with `stream: true`) | Requires custom adapter | SSE |
| **Firewall/Proxy** | Works with HTTP/HTTPS | May be blocked | SSE |
| **Reconnection** | Built-in (HTTP retry) | Manual | SSE |
| **Use Case Fit** | Unidirectional (server → client) | Bidirectional | SSE |
| **Browser Support** | Excellent (EventSource API) | Excellent | Tie |
| **Backend Complexity** | Low (FastAPI StreamingResponse) | Medium (WebSocket manager) | SSE |

### Why SSE is Better for Ollama

1. **Native Support:** Ollama's `/api/chat` endpoint already supports streaming via SSE
2. **Simple Integration:** FastAPI's `StreamingResponse` works out of the box
3. **No State Management:** SSE is stateless (no connection state to manage)
4. **Easier Debugging:** Can test with `curl` or browser dev tools
5. **Lower Resource Usage:** No persistent connections

### SSE Implementation

**Backend (FastAPI):**
```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

@app.post("/api/v1/documents/{id}/question")
async def ask_question(document_id: int, request: QuestionRequest):
    async def generate():
        async for chunk in llm_service.stream(prompt, model):
            yield f"data: {json.dumps({'content': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

**Frontend (React):**
```javascript
const eventSource = new EventSource(url);
eventSource.onmessage = (e) => {
  if (e.data === '[DONE]') {
    eventSource.close();
    return;
  }
  const chunk = JSON.parse(e.data);
  setResponse(prev => prev + chunk.content);
};
```

### When to Use WebSockets Instead

- Bidirectional communication needed (client → server → client)
- Multiple concurrent streams
- Real-time collaboration features

**Not needed for Phase 2c.**

---

## 7. Analysis Cache

### Cache Design

**Technology:** In-memory LRU cache (or Redis for production)

**Rationale:**
- In-memory is sufficient for single-server deployments
- Redis provides persistence and multi-server support
- Cache is small (text analyses are ~1-5 KB each)

### Cache Key Format

```
analysis:{document_id}:{analysis_type}:{prompt_hash}
```

**Example:**
```
analysis:42:summary:a1b2c3d4e5f6
```

**Prompt Hash:** SHA-256 hash of prompt template + document text + question (if QA)

### Cache Entry Structure

```json
{
  "document_id": 42,
  "analysis_type": "summary",
  "prompt_hash": "a1b2c3d4e5f6",
  "content": "• Patient presents with...",
  "citations": [...],
  "llm_model": "llama3.2:3b",
  "generated_at": "2026-07-30T10:00:00+00:00",
  "hit_count": 3
}
```

### Cache TTL

**Default:** 24 hours

**Rationale:**
- Documents don't change frequently
- Users may re-read analyses
- Reduces LLM costs (even if local, saves time)

**Configuration:**
```python
CACHE_TTL = int(os.environ.get("ANALYSIS_CACHE_TTL", 86400))  # 24 hours
```

### Cache Invalidation

**Automatic Invalidation:**
- Document updated → invalidate all analyses for document
- Document deleted → delete all analyses

**Manual Invalidation:**
- User clicks "Regenerate" → bypass cache, delete old analysis

**Implementation:**
```python
def invalidate_document_cache(document_id: int):
    """Delete all cached analyses for a document."""
    pattern = f"analysis:{document_id}:*"
    keys = cache_manager.keys(pattern)
    cache_manager.delete_many(keys)
```

### Cache Bypass

**When to bypass cache:**
- User explicitly requests regeneration
- LLM model changed
- Document updated

**Implementation:**
```python
def analyze_document(document_id, analysis_type, user_id, force_regenerate=False):
    if force_regenerate:
        invalidate_document_cache(document_id)

    # Check cache
    cache_key = get_cache_key(document_id, analysis_type, prompt_hash)
    cached = cache_manager.get(cache_key)
    if cached and not force_regenerate:
        return cached

    # Generate analysis
    analysis = generate_analysis(...)
    cache_manager.set(cache_key, analysis, ttl=CACHE_TTL)
    return analysis
```

---

## 8. Verification Plan

### Functional Tests

| Test | Description | Expected Result |
|------|-------------|-----------------|
| **Summary Generation** | Generate summary for document | Returns 3-5 bullet points |
| **Explanation Generation** | Generate explanation for document | Returns plain-language explanation |
| **Q&A** | Ask question about document | Returns accurate answer with citations |
| **Lab Report** | Analyze lab report | Returns structured explanation |
| **Prescription** | Analyze prescription | Returns medication explanations |
| **Caching** | Generate same analysis twice | Second request returns cached result |
| **Cache Invalidation** | Update document, regenerate analysis | Returns new analysis |
| **Analysis History** | List analyses for document | Returns all past analyses |
| **Delete Analysis** | Delete specific analysis | Analysis removed from DB |
| **Regenerate Analysis** | Force regeneration | Returns new analysis, old one deleted |
| **Error Handling** | LLM unavailable | Returns 422 with error message |
| **Authorization** | User A accesses User B's analysis | Returns 403 |

### Performance Tests

| Test | Description | Target |
|------|-------------|--------|
| **Summary Latency** | Time to generate summary (cache miss) | < 10s |
| **Summary Latency (cached)** | Time to return cached summary | < 100ms |
| **Q&A Latency** | Time to answer question (cache miss) | < 10s |
| **Q&A Latency (cached)** | Time to return cached answer | < 100ms |
| **Streaming Latency** | Time to first chunk | < 2s |
| **Concurrent Requests** | 10 simultaneous analyses | All complete within 30s |
| **Cache Hit Rate** | % of requests served from cache | > 60% |

### Security Tests

| Test | Description | Expected Result |
|------|-------------|-----------------|
| **SQL Injection** | Inject SQL in analysis type | Rejected (parameterized queries) |
| **XSS** | Inject JavaScript in prompt | Escaped in response |
| **Authorization** | User A accesses User B's analysis | 403 Forbidden |
| **Prompt Injection** | Inject malicious prompt in document | LLM ignores (prompt hardening) |
| **Rate Limiting** | 100 requests in 1 minute | Throttled (future enhancement) |

### Regression Tests

| Test | Description | Expected Result |
|------|-------------|-----------------|
| **Document Upload** | Upload document | Works as before |
| **Document List** | List documents | Works as before |
| **Document Viewer** | View document | Works as before |
| **Extraction** | Extract text | Works as before |
| **Delete Document** | Delete document | Works as before |
| **Search** | Search documents | Works as before |
| **Pagination** | Paginate documents | Works as before |

---

## 9. Proposed File Structure

### Backend Files to Create

```
backend/
├── services/
│   ├── analysis_service.py          # Main orchestrator
│   ├── prompt_builder.py            # Prompt templates
│   ├── context_selector.py          # Chunk selection
│   ├── citation_generator.py        # Citation mapping
│   ├── cache_manager.py             # Analysis cache
│   └── llm_service.py               # Ollama wrapper
├── api/
│   └── routes/
│       └── analyses.py              # New API routes
└── tests/
    └── test_analyses.py              # Analysis tests
```

### Backend Files to Modify

| File | Changes |
|------|---------|
| `backend/api/main.py` | Register new routes |
| `backend/requirements.txt` | Add `tiktoken` (optional) |
| `backend/db/models.py` | No changes (table already exists) |

### Frontend Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/features/documents/components/AskAITab.jsx` | Implement actual AI calls, streaming display |
| `frontend/src/app/services/api.js` | Add analysis API methods |

### Database Changes

**No schema changes required.**

The `document_analyses` table already exists with all necessary columns:
- `id`
- `document_id` (FK)
- `type` (VARCHAR)
- `content` (TEXT)
- `llm_model` (VARCHAR)
- `prompt_hash` (VARCHAR) — **Add this column if missing**
- `citations` (JSON)
- `generated_at` (TIMESTAMP)
- `user_id` (FK)

**Migration (if needed):**
```sql
ALTER TABLE document_analyses
ADD COLUMN IF NOT EXISTS prompt_hash VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_analyses_document_type
ON document_analyses(document_id, type);
```

---

## 10. API Specification

### Base URL
```
/api/v1/documents/{document_id}
```

### Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/summary` | JWT | Generate summary |
| POST | `/explanation` | JWT | Generate explanation |
| POST | `/question` | JWT | Answer question |
| GET | `/analyses` | JWT | List analyses |
| DELETE | `/analyses/{id}` | JWT | Delete analysis |

### Standard Response Envelope

```json
{
  "success": true,
  "message": "Analysis generated",
  "data": { ... },
  "error_code": null,
  "timestamp": "2026-07-30T10:00:00+00:00"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `ANALYSIS_FAILED` | LLM generation failed |
| `DOCUMENT_NOT_FOUND` | Document doesn't exist |
| `ANALYSIS_NOT_FOUND` | Analysis doesn't exist |
| `INVALID_REQUEST` | Missing required fields |
| `LLM_UNAVAILABLE` | Ollama not running |
| `RATE_LIMIT_EXCEEDED` | Too many requests (future) |

---

## 11. Risks

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Ollama unavailable** | Medium | High | Check Ollama health on startup, return 422 if down |
| **Slow LLM response** | High | Medium | Implement streaming, set 60s timeout |
| **Token limit exceeded** | Medium | Medium | Implement token budgeting, truncate context |
| **Cache inconsistency** | Low | Medium | Invalidate cache on document update |
| **Memory usage** | Medium | Low | Limit cache size (LRU eviction) |

### Security Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Prompt injection** | Medium | High | Sanitize document text, use system prompts |
| **XSS in responses** | Low | Medium | Escape HTML in frontend |
| **Authorization bypass** | Low | High | Verify user_id on all endpoints |
| **Resource exhaustion** | Medium | Medium | Rate limiting (future) |

### UX Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Long wait times** | High | High | Streaming responses, loading indicators |
| **Poor analysis quality** | Medium | High | Prompt engineering, model selection |
| **User confusion** | Low | Medium | Clear UI, "Coming in Phase 2c" placeholders |

---

## 12. Estimated Implementation Effort

### Backend

| Component | Effort (hours) | Complexity |
|-----------|---------------|------------|
| LLMService | 4 | Low |
| PromptBuilder | 3 | Low |
| ContextSelector | 4 | Medium |
| CitationGenerator | 3 | Medium |
| CacheManager | 3 | Low |
| AnalysisService | 6 | Medium |
| API Routes | 3 | Low |
| Tests | 6 | Medium |
| **Total** | **32 hours** | |

### Frontend

| Component | Effort (hours) | Complexity |
|-----------|---------------|------------|
| Update AskAITab | 4 | Medium |
| Streaming display | 3 | Medium |
| Analysis history UI | 3 | Low |
| Regenerate button | 2 | Low |
| Error handling | 2 | Low |
| Tests | 4 | Medium |
| **Total** | **18 hours** | |

### Total Effort

**Backend:** 32 hours  
**Frontend:** 18 hours  
**Total:** 50 hours (~1.5 weeks)

---

## 13. Dependencies

### New Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `tiktoken` | 0.5.0 | Token counting (optional, can use rough estimate) |
| `redis` | 5.0.0 | Cache backend (optional, can use in-memory) |

### New Frontend Dependencies

**None.** Uses existing React, Lucide icons, and native `EventSource` API.

---

## 14. Configuration

### Environment Variables

```bash
# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_TIMEOUT=60

# Analysis
ANALYSIS_CACHE_TTL=86400  # 24 hours
ANALYSIS_MAX_TOKENS=4000
ANALYSIS_STREAM_CHUNK_SIZE=10

# Cache (optional)
REDIS_URL=redis://localhost:6379/0
```

---

## 15. Monitoring and Observability

### Metrics to Track

1. **Performance:**
   - Analysis latency (p50, p95, p99)
   - Cache hit rate
   - LLM response time
   - Streaming latency

2. **Usage:**
   - Analyses per day
   - Analysis types (summary, explanation, qa)
   - Cache hit/miss ratio
   - Error rate

3. **Quality:**
   - User feedback (thumbs up/down)
   - Regeneration rate
   - Citation accuracy

### Logging

```python
logger.info("Analysis generated: document_id=%d, type=%s, model=%s, cached=%s, latency=%.2f",
            document_id, analysis_type, model, cached, latency)
```

---

## 16. Future Enhancements

1. **Multi-language Support:** Translate analyses to user's language
2. **Custom Models:** Allow users to select different LLM models
3. **Batch Analysis:** Analyze multiple documents at once
4. **Export Analyses:** Download analyses as PDF/Word
5. **Share Analyses:** Share analyses with other users (with permissions)
6. **Analytics:** Track most asked questions, popular documents
7. **Fine-tuning:** Fine-tune LLM on medical documents (future)

---

## 17. Open Questions

1. **Model Selection:** Should we allow users to choose between `llama3.2:3b` and `mistral:7b`?
2. **Cache Persistence:** Should cache survive server restarts? (Redis vs in-memory)
3. **Rate Limiting:** Should we limit analyses per user per day?
4. **Citation Accuracy:** How to improve citation mapping? (Embedding similarity?)
5. **Prompt Engineering:** Should we A/B test different prompts?

---

## 18. Approval Checklist

Before implementation, confirm:

- [ ] LLM model selection approved (`llama3.2:3b` vs `mistral:7b`)
- [ ] Cache TTL approved (24 hours)
- [ ] Token budget approved (4000 tokens)
- [ ] Prompt templates reviewed and approved
- [ ] Streaming approach approved (SSE)
- [ ] Error handling strategy approved
- [ ] Monitoring requirements defined
- [ ] Security review completed
- [ ] Performance targets agreed upon

---

## Next Steps

**Awaiting approval before implementation.**

Once approved, Phase 2c will implement:
1. Backend services (LLMService, PromptBuilder, etc.)
2. API routes
3. Frontend updates (AskAITab)
4. Tests
5. Documentation