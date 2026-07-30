"""Document API routes — /api/v1/documents"""

import os
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, BackgroundTasks
from pydantic import BaseModel

from api.deps import get_current_user
from api.middleware.rate_limiter import rate_limiter
from services.document_service import (
    upload_document,
    extract_document,
    get_document,
    list_documents,
    delete_document,
    DOCUMENT_STORAGE_PATH,
    MAX_UPLOAD_SIZE,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])


# ---------------------------------------------------------------------------
# Request/Response Models
# ---------------------------------------------------------------------------

class APIResponse(BaseModel):
    """Standard API response envelope."""
    success: bool
    message: str
    data: Optional[dict] = None
    error_code: Optional[str] = None
    timestamp: str


class ExtractRequest(BaseModel):
    document_id: int


class DocumentListResponse(BaseModel):
    items: list[dict]
    total: int
    page: int
    per_page: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now_iso() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/upload", response_model=APIResponse)
def upload_endpoint(
    files: list[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
    background_tasks: BackgroundTasks = None,
):
    """
    Upload one or more documents.

    Accepts multipart/form-data with files[].
    Returns list of uploaded documents.
    """
    user_id = current_user["id"]

    # Rate limit check
    allowed, retry_after, _ = rate_limiter.check("upload", user_id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    results = []

    for upload in files:
        try:
            # Read file content
            file_content = upload.file.read()

            # Determine MIME type (use provided or guess from extension)
            mime_type = upload.content_type or "application/octet-stream"

            # Upload
            result = upload_document(
                user_id=user_id,
                original_filename=upload.filename or "unnamed",
                file_content=file_content,
                mime_type=mime_type,
            )
            results.append(result)

        except Exception as e:
            logger.error("Upload failed for file %s: %s", upload.filename, e)
            results.append({
                "success": False,
                "message": f"Failed to upload {upload.filename}: {e}",
                "error_code": "UPLOAD_FAILED",
                "data": None,
            })

    # Check if all succeeded
    all_success = all(r["success"] for r in results)
    message = "All documents uploaded successfully" if all_success else "Some uploads failed"

    return APIResponse(
        success=all_success,
        message=message,
        data={"documents": results},
        timestamp=_now_iso(),
    )


@router.post("/extract", response_model=APIResponse)
def extract_endpoint(
    req: ExtractRequest,
    current_user: dict = Depends(get_current_user),
    background_tasks: BackgroundTasks = None,
):
    """
    Extract text from a document.

    Extraction runs in the background via TaskService.
    """
    user_id = current_user["id"]

    # Rate limit check
    allowed, retry_after, _ = rate_limiter.check("extract", user_id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    if background_tasks is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Background tasks not available",
        )

    result = extract_document(req.document_id, user_id, background_tasks)

    return APIResponse(
        success=result["success"],
        message=result["message"],
        data=result["data"],
        error_code=result.get("error_code"),
        timestamp=_now_iso(),
    )


@router.get("", response_model=APIResponse)
def list_endpoint(
    current_user: dict = Depends(get_current_user),
    search: str = Query(default="", description="Search in filename"),
    type: str = Query(default="", description="Filter by MIME type"),
    page: int = Query(default=1, ge=1, description="Page number"),
    per_page: int = Query(default=20, ge=1, le=100, description="Items per page"),
):
    """List user's documents with pagination."""
    user_id = current_user["id"]

    # Rate limit check
    allowed, retry_after, _ = rate_limiter.check("read", user_id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    result = list_documents(
        user_id=user_id,
        search=search,
        doc_type=type,
        page=page,
        per_page=per_page,
    )

    return APIResponse(
        success=True,
        message="Documents retrieved successfully",
        data=result,
        timestamp=_now_iso(),
    )


@router.get("/{document_id}", response_model=APIResponse)
def get_endpoint(
    document_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Get a single document by ID."""
    user_id = current_user["id"]

    # Rate limit check
    allowed, retry_after, _ = rate_limiter.check("read", user_id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    document = get_document(document_id, user_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return APIResponse(
        success=True,
        message="Document retrieved successfully",
        data=document,
        timestamp=_now_iso(),
    )


@router.delete("/{document_id}", response_model=APIResponse)
def delete_endpoint(
    document_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Delete a document and its files."""
    user_id = current_user["id"]

    # Rate limit check
    allowed, retry_after, _ = rate_limiter.check("read", user_id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )

    result = delete_document(document_id, user_id)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["message"],
        )

    return APIResponse(
        success=True,
        message=result["message"],
        timestamp=_now_iso(),
    )