"""Tests for SSE streaming analysis endpoints."""

import os
import sys
import json
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from api.main import app
from api.deps import get_current_user
from api.middleware.rate_limiter import rate_limiter

client = TestClient(app)

FAKE_USER = {"id": 1, "username": "testuser", "role": "User"}


@pytest.fixture(autouse=True)
def override_auth():
    """Override the get_current_user dependency for all tests."""
    async def _override():
        return FAKE_USER

    app.dependency_overrides[get_current_user] = _override
    yield
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Clear rate limiter state before each test."""
    rate_limiter._buckets.clear()
    yield
    rate_limiter._buckets.clear()


async def _mock_stream_generator(*args, **kwargs):
    """Mock async generator that yields SSE events."""
    yield 'data: {"type": "chunk", "content": "Hello"}\n\n'
    yield 'data: {"type": "chunk", "content": " World"}\n\n'
    yield 'data: {"type": "citations", "citations": []}\n\n'
    yield 'data: {"type": "done", "analysis_id": 1}\n\n'


def test_stream_summary_success():
    """Test successful streaming summary generation."""
    with patch('api.routes.analyses.analysis_service') as mock_service:
        mock_service.analyze_document_stream = _mock_stream_generator

        response = client.post(
            "/api/v1/documents/1/summary/stream",
            headers={"Authorization": "Bearer testtoken"},
        )

        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")

        # Parse SSE events
        events = []
        for line in response.iter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        # Verify at least one chunk event and one done event
        chunk_events = [e for e in events if e["type"] == "chunk"]
        done_events = [e for e in events if e["type"] == "done"]

        assert len(chunk_events) >= 1
        assert len(done_events) == 1
        assert done_events[0]["analysis_id"] == 1


def test_stream_explanation_success():
    """Test successful streaming explanation generation."""
    with patch('api.routes.analyses.analysis_service') as mock_service:
        mock_service.analyze_document_stream = _mock_stream_generator

        response = client.post(
            "/api/v1/documents/1/explanation/stream",
            headers={"Authorization": "Bearer testtoken"},
        )

        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")

        events = []
        for line in response.iter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        chunk_events = [e for e in events if e["type"] == "chunk"]
        done_events = [e for e in events if e["type"] == "done"]

        assert len(chunk_events) >= 1
        assert len(done_events) == 1


def test_stream_question_success():
    """Test successful streaming question answering."""
    with patch('api.routes.analyses.analysis_service') as mock_service:
        mock_service.analyze_document_stream = _mock_stream_generator

        response = client.post(
            "/api/v1/documents/1/question/stream",
            headers={"Authorization": "Bearer testtoken"},
            json={"question": "What is the patient's blood pressure?"},
        )

        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")

        events = []
        for line in response.iter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        chunk_events = [e for e in events if e["type"] == "chunk"]
        done_events = [e for e in events if e["type"] == "done"]

        assert len(chunk_events) >= 1
        assert len(done_events) == 1


def test_stream_question_missing_question():
    """Test streaming question with missing question (Pydantic validation -> 422)."""
    response = client.post(
        "/api/v1/documents/1/question/stream",
        headers={"Authorization": "Bearer testtoken"},
        json={},
    )

    assert response.status_code == 422


def test_stream_question_blank_question():
    """Test streaming question with whitespace-only question (route validation -> 400)."""
    response = client.post(
        "/api/v1/documents/1/question/stream",
        headers={"Authorization": "Bearer testtoken"},
        json={"question": "   "},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Question is required"


# ------------------------------------------------------------------
# Advanced streaming tests
# ------------------------------------------------------------------

async def _mock_citations_generator(*args, **kwargs):
    """Mock async generator that yields chunks, citations, and done."""
    yield 'data: {"type": "chunk", "content": "The patient has"}\n\n'
    yield 'data: {"type": "chunk", "content": " high blood pressure."}\n\n'
    yield 'data: {"type": "citations", "citations": [{"chunk_index": 0, "page_number": 1, "text_preview": "Patient has high blood pressure."}]}\n\n'
    yield 'data: {"type": "done", "analysis_id": 99}\n\n'


def test_stream_citations_received():
    """Test that citations event is received during streaming."""
    with patch('api.routes.analyses.analysis_service') as mock_service:
        mock_service.analyze_document_stream = _mock_citations_generator

        response = client.post(
            "/api/v1/documents/1/summary/stream",
            headers={"Authorization": "Bearer testtoken"},
        )

        assert response.status_code == 200

        events = []
        for line in response.iter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        citation_events = [e for e in events if e["type"] == "citations"]
        assert len(citation_events) == 1
        assert len(citation_events[0]["citations"]) == 1
        assert citation_events[0]["citations"][0]["page_number"] == 1


async def _mock_error_generator(*args, **kwargs):
    """Mock async generator that yields an error event."""
    yield 'data: {"type": "error", "message": "Document not found"}\n\n'


def test_stream_error_event():
    """Test streaming with error event."""
    with patch('api.routes.analyses.analysis_service') as mock_service:
        mock_service.analyze_document_stream = _mock_error_generator

        response = client.post(
            "/api/v1/documents/1/summary/stream",
            headers={"Authorization": "Bearer testtoken"},
        )

        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")

        events = []
        for line in response.iter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        error_events = [e for e in events if e["type"] == "error"]
        assert len(error_events) == 1
        assert "Document not found" in error_events[0]["message"]


async def _mock_cache_hit_generator(*args, **kwargs):
    """Mock async generator that yields a cached result (single chunk + done)."""
    yield 'data: {"type": "chunk", "content": "Cached summary content"}\n\n'
    yield 'data: {"type": "citations", "citations": []}\n\n'
    yield 'data: {"type": "done", "analysis_id": 42}\n\n'


def test_stream_cache_hit():
    """Test streaming with cache hit (single chunk + done)."""
    with patch('api.routes.analyses.analysis_service') as mock_service:
        mock_service.analyze_document_stream = _mock_cache_hit_generator

        response = client.post(
            "/api/v1/documents/1/summary/stream",
            headers={"Authorization": "Bearer testtoken"},
        )

        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")

        events = []
        for line in response.iter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        chunk_events = [e for e in events if e["type"] == "chunk"]
        done_events = [e for e in events if e["type"] == "done"]

        assert len(chunk_events) == 1
        assert chunk_events[0]["content"] == "Cached summary content"
        assert len(done_events) == 1
        assert done_events[0]["analysis_id"] == 42


def test_stream_passes_request_for_disconnect():
    """Test that the FastAPI Request object is passed to analyze_document_stream for disconnect detection."""
    captured_kwargs = {}

    async def _recording_generator(*args, **kwargs):
        captured_kwargs.update(kwargs)
        yield 'data: {"type": "chunk", "content": "test"}\n\n'
        yield 'data: {"type": "done", "analysis_id": 1}\n\n'

    with patch('api.routes.analyses.analysis_service') as mock_service:
        mock_service.analyze_document_stream = _recording_generator

        response = client.post(
            "/api/v1/documents/1/summary/stream",
            headers={"Authorization": "Bearer testtoken"},
        )

        assert response.status_code == 200
        assert 'request' in captured_kwargs
        assert captured_kwargs['request'] is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
