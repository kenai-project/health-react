# TODO - Enforce Preferred Language Across All AI Responses

## Backend
- [x] Rewrite `backend/services/multilingual_system_prompt.py` with a single reusable language-enforcement helper + mandatory instruction block.
- [x] Update `backend/services/prompt_builder.py` `get_system_prompt()` to accept and inject `preferred_language`.
- [x] Thread `preferred_language` through `backend/services/analysis_service.py` `analyze_document()` and `analyze_document_stream()`.
- [x] Update `backend/api/routes/analyses.py` to accept `language` in request bodies and pass to analysis_service (incl. streaming).
- [x] Update `backend/api/routes/llm.py` to accept `language` and pass to LLMService (chat/analyze/suggestions).
- [x] Update `backend/services/llm_service.py` to thread `preferred_language` into system prompt building.

## Frontend
- [x] Update `frontend/src/app/services/api.js` documentService to include `language` in all analysis/stream requests (non-streaming via query param, QA via body, streaming via query param/body).
- [x] Update `frontend/src/features/documents/components/AskAITab.jsx` to pass `language` (fixed qa-case argument-shift bug).

## Tests
- [x] Add `backend/tests/test_multilingual_prompt.py` for language enforcement (name mapping, front-loading, empty, with context, prompt_builder integration).

## Verification
- [x] Run the backend test suite once (121 passed, 1 skipped).
- [x] Run frontend production build (vite build succeeded, 2357 modules transformed).
