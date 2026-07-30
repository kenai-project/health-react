"""Tests for document analysis endpoints."""

import os
import sys
import json
import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from api.main import app
from api.deps import get_current_user
from api.middleware.rate_limiter import rate_limiter
from db.session import get_db_session
from db.models import User, Document, DocumentAnalysis


client = TestClient(app)


# Fake user returned by the auth dependency override.
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
    """Clear rate limiter state before each test to avoid cross-test interference."""
    rate_limiter._buckets.clear()
    yield
    rate_limiter._buckets.clear()


def test_generate_summary_success():
    """Test successful summary generation."""
    with patch('api.routes.analyses.analysis_service') as mock_service:
        mock_service.analyze_document = AsyncMock(return_value={
            "id": 1,
            "type": "SUMMARY",
            "content": "• Patient has high blood pressure.",
            "citations": [],
            "llm_model": "llama3.2:3b",
            "generated_at": "2026-07-30T10:00:00+00:00",
            "cached": False,
        })

        response = client.post(
            "/api/v1/documents/1/summary",
            headers={"Authorization": "Bearer testtoken"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["type"] == "SUMMARY"


def test_generate_summary_document_not_found():
    """Test summary generation when document not found."""
    with patch('api.routes.analyses.analysis_service') as mock_service:
        mock_service.analyze_document = AsyncMock(side_effect=ValueError("Document not found"))

        response = client.post(
            "/api/v1/documents/999/summary",
            headers={"Authorization": "Bearer testtoken"}
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data


def test_ask_question_success():
    """Test successful question answering."""
    with patch('api.routes.analyses.analysis_service') as mock_service:
        mock_service.analyze_document = AsyncMock(return_value={
            "id": 2,
            "type": "QA",
            "content": "The patient's blood pressure is high.",
            "citations": [{"chunk_index": 0, "page_number": 1, "text_preview": "Patient has high blood pressure."}],
            "llm_model": "llama3.2:3b",
            "generated_at": "2026-07-30T10:00:00+00:00",
            "cached": False,
        })

        response = client.post(
            "/api/v1/documents/1/question",
            headers={"Authorization": "Bearer testtoken"},
            json={"question": "What is the patient's blood pressure?"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["type"] == "QA"


def test_ask_question_missing_question():
    """Test question answering with missing question (Pydantic validation -> 422)."""
    response = client.post(
        "/api/v1/documents/1/question",
        headers={"Authorization": "Bearer testtoken"},
        json={}
    )

    # FastAPI/Pydantic rejects missing required field with 422 before route logic.
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data


def test_ask_question_blank_question():
    """Test question answering with whitespace-only question (route validation -> 400)."""
    response = client.post(
        "/api/v1/documents/1/question",
        headers={"Authorization": "Bearer testtoken"},
        json={"question": "   "}
    )

    # Pydantic min_length=1 passes, but route's explicit empty-check returns 400.
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "Question is required"


def test_get_analysis_history():
    """Test getting analysis history."""
    with patch('api.routes.analyses.analysis_service') as mock_service:
        mock_service.get_analysis_history = AsyncMock(return_value={
            "items": [
                {
                    "id": 1,
                    "type": "SUMMARY",
                    "content": "Summary content",
                    "citations": [],
                    "llm_model": "llama3.2:3b",
                    "generated_at": "2026-07-30T10:00:00+00:00",
                }
            ],
            "total": 1,
            "page": 1,
            "per_page": 20,
        })

        response = client.get(
            "/api/v1/documents/1/analyses",
            headers={"Authorization": "Bearer testtoken"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "items" in data["data"]
        assert "total" in data["data"]


def test_delete_analysis():
    """Test deleting analysis."""
    with patch('api.routes.analyses.analysis_service') as mock_service:
        mock_service.delete_analysis = AsyncMock(return_value=True)

        response = client.delete(
            "/api/v1/documents/1/analyses/1",
            headers={"Authorization": "Bearer testtoken"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "message" in data


def test_regenerate_analysis():
    """Test regenerating analysis."""
    with patch('api.routes.analyses.analysis_service') as mock_service:
        mock_service.regenerate_analysis = AsyncMock(return_value={
            "id": 2,
            "type": "SUMMARY",
            "content": "New summary content",
            "citations": [],
            "llm_model": "llama3.2:3b",
            "generated_at": "2026-07-30T10:01:00+00:00",
            "cached": False,
        })

        response = client.post(
            "/api/v1/documents/1/analyses/1/regenerate",
            headers={"Authorization": "Bearer testtoken"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Analysis regenerated"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])