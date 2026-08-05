"""Analysis API routes."""

import os
import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from db.session import get_db_session
from db.models import Document, DocumentAnalysis
from services.analysis_service import analysis_service
from api.deps import get_current_user
from api.middleware.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["analyses"])


# Request/Response models
class QuestionRequest(BaseModel):
    question: str = Field(..., min_length=1)
    language: Optional[str] = Field(default=None, max_length=10)


class AnalysisResponse(BaseModel):
    id: int
    type: str
    content: str
    citations: list[dict]
    llm_model: str
    generated_at: str
    cached: bool
    latency: Optional[float] = None


class AnalysisHistoryResponse(BaseModel):
    items: list[dict]
    total: int
    page: int
    per_page: int


@router.post("/{document_id}/summary", response_model=dict)
async def generate_summary(
    document_id: int,
    user=Depends(get_current_user),
    language: Optional[str] = None,
):
    """
    Generate document summary.

    Args:
        document_id: Document ID
        user: Current user (from JWT)
        language: Optional preferred language code

    Returns:
        Analysis result
    """
    # Rate limit check
    allowed, retry_after, _ = rate_limiter.check("analysis", user["id"])
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    try:
        result = await analysis_service.analyze_document(
            document_id=document_id,
            analysis_type="summary",
            user_id=user["id"],
            preferred_language=language,
        )
        return {
            "success": True,
            "message": "Summary generated",
            "data": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        logger.error(f"Summary generation failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/{document_id}/explanation", response_model=dict)
async def generate_explanation(
    document_id: int,
    user=Depends(get_current_user),
    language: Optional[str] = None,
):
    """
    Generate document explanation.

    Args:
        document_id: Document ID
        user: Current user (from JWT)
        language: Optional preferred language code

    Returns:
        Analysis result
    """
    # Rate limit check
    allowed, retry_after, _ = rate_limiter.check("analysis", user["id"])
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    try:
        result = await analysis_service.analyze_document(
            document_id=document_id,
            analysis_type="explanation",
            user_id=user["id"],
            preferred_language=language,
        )
        return {
            "success": True,
            "message": "Explanation generated",
            "data": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        logger.error(f"Explanation generation failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/{document_id}/question", response_model=dict)
async def ask_question(
    document_id: int,
    request: QuestionRequest,
    user=Depends(get_current_user),
):
    """
    Answer question about document.

    Args:
        document_id: Document ID
        request: Question request
        user: Current user (from JWT)

    Returns:
        Analysis result
    """
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question is required")

    # Rate limit check
    allowed, retry_after, _ = rate_limiter.check("analysis", user["id"])
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    try:
        result = await analysis_service.analyze_document(
            document_id=document_id,
            analysis_type="qa",
            user_id=user["id"],
            question=request.question.strip(),
            preferred_language=request.language,
        )
        return {
            "success": True,
            "message": "Question answered",
            "data": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        logger.error(f"Question answering failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/{document_id}/analyses", response_model=dict)
async def get_analysis_history(
    document_id: int,
    user=Depends(get_current_user),
    analysis_type: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
):
    """
    Get analysis history for document.

    Args:
        document_id: Document ID
        user: Current user (from JWT)
        analysis_type: Filter by type (optional)
        page: Page number
        per_page: Items per page

    Returns:
        Analysis history
    """
    # Rate limit check
    allowed, retry_after, _ = rate_limiter.check("read", user["id"])
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    try:
        result = await analysis_service.get_analysis_history(
            document_id=document_id,
            user_id=user["id"],
            analysis_type=analysis_type,
            page=page,
            per_page=per_page,
        )
        return {
            "success": True,
            "data": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get analysis history: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.delete("/{document_id}/analyses/{analysis_id}", response_model=dict)
async def delete_analysis(
    document_id: int,
    analysis_id: int,
    user=Depends(get_current_user),
):
    """
    Delete specific analysis.

    Args:
        document_id: Document ID
        analysis_id: Analysis ID
        user: Current user (from JWT)

    Returns:
        Success message
    """
    # Rate limit check
    allowed, retry_after, _ = rate_limiter.check("read", user["id"])
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    try:
        deleted = await analysis_service.delete_analysis(
            analysis_id=analysis_id,
            document_id=document_id,
            user_id=user["id"],
        )

        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

        return {
            "success": True,
            "message": "Analysis deleted",
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to delete analysis: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/{document_id}/analyses/{analysis_id}/regenerate", response_model=dict)
async def regenerate_analysis(
    document_id: int,
    analysis_id: int,
    user=Depends(get_current_user),
):
    """
    Regenerate analysis (force new analysis).

    Args:
        document_id: Document ID
        analysis_id: Analysis ID to regenerate
        user: Current user (from JWT)

    Returns:
        New analysis result
    """
    # Rate limit check
    allowed, retry_after, _ = rate_limiter.check("regenerate", user["id"])
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    try:
        result = await analysis_service.regenerate_analysis(
            analysis_id=analysis_id,
            document_id=document_id,
            user_id=user["id"],
        )
        return {
            "success": True,
            "message": "Analysis regenerated",
            "data": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        logger.error(f"Analysis regeneration failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


# ------------------------------------------------------------------
# SSE Streaming Endpoints
# ------------------------------------------------------------------

@router.post("/{document_id}/summary/stream")
async def stream_summary(
    document_id: int,
    http_request: Request,
    user=Depends(get_current_user),
    language: Optional[str] = None,
):
    """
    Generate document summary as a streaming SSE response.

    Yields SSE events:
    - data: {"type": "chunk", "content": "..."}\n\n
    - data: {"type": "citations", "citations": [...]}\n\n
    - data: {"type": "done", "analysis_id": 42}\n\n
    - data: {"type": "error", "message": "..."}\n\n
    """
    # Rate limit check
    allowed, retry_after, _ = rate_limiter.check("analysis", user["id"])
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    async def event_stream():
        async for event in analysis_service.analyze_document_stream(
            document_id=document_id,
            analysis_type="summary",
            user_id=user["id"],
            request=http_request,
            preferred_language=language,
        ):
            yield event

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.post("/{document_id}/explanation/stream")
async def stream_explanation(
    document_id: int,
    http_request: Request,
    user=Depends(get_current_user),
    language: Optional[str] = None,
):
    """
    Generate document explanation as a streaming SSE response.

    Yields SSE events:
    - data: {"type": "chunk", "content": "..."}\n\n
    - data: {"type": "citations", "citations": [...]}\n\n
    - data: {"type": "done", "analysis_id": 42}\n\n
    - data: {"type": "error", "message": "..."}\n\n
    """
    # Rate limit check
    allowed, retry_after, _ = rate_limiter.check("analysis", user["id"])
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    async def event_stream():
        async for event in analysis_service.analyze_document_stream(
            document_id=document_id,
            analysis_type="explanation",
            user_id=user["id"],
            request=http_request,
            preferred_language=language,
        ):
            yield event

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.post("/{document_id}/question/stream")
async def stream_question(
    document_id: int,
    body: QuestionRequest,
    http_request: Request,
    user=Depends(get_current_user),
):
    """
    Answer question about document as a streaming SSE response.

    Yields SSE events:
    - data: {"type": "chunk", "content": "..."}\n\n
    - data: {"type": "citations", "citations": [...]}\n\n
    - data: {"type": "done", "analysis_id": 42}\n\n
    - data: {"type": "error", "message": "..."}\n\n
    """
    if not body.question or not body.question.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question is required")

    # Rate limit check
    allowed, retry_after, _ = rate_limiter.check("analysis", user["id"])
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    async def event_stream():
        async for event in analysis_service.analyze_document_stream(
            document_id=document_id,
            analysis_type="qa",
            user_id=user["id"],
            question=body.question.strip(),
            request=http_request,
            preferred_language=body.language,
        ):
            yield event

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
