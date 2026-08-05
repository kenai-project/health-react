import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict

from api.deps import get_current_user
from services.analytics import get_user_scope_user_ids
from services.llm_service import LLMService
from services.records import list_records

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_service() -> LLMService:
    return LLMService()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: Optional[List[dict]] = None
    language: Optional[str] = Field(default=None, max_length=10)


class AnalyzeRequest(BaseModel):
    limit: int = Field(default=10, ge=1, le=20)
    language: Optional[str] = Field(default=None, max_length=10)


class SuggestionsRequest(BaseModel):
    limit: int = Field(default=10, ge=1, le=20)
    language: Optional[str] = Field(default=None, max_length=10)


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    status: str
    model: str
    model_available: Optional[bool] = None
    available_models: Optional[List[str]] = None
    detail: Optional[str] = None


class ChatResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    reply: str
    disclaimer: str


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    analysis: str
    disclaimer: str


class SuggestionsResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    suggestions: str
    disclaimer: str


@router.get("/health", response_model=HealthResponse, summary="Check local Ollama availability")
def health_check(current_user=Depends(get_current_user)):
    try:
        return HealthResponse(**_get_service().check_health())
    except Exception as exc:
        logger.exception("LLM health check failed")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="LLM service unavailable") from exc


@router.post("/chat", response_model=ChatResponse, summary="Chat with the local health assistant")
def chat(req: ChatRequest, current_user=Depends(get_current_user)):
    try:
        validated_history = _validate_history(req.history)
        message = req.message.strip()
        if not message:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message is required")

        health_context = _build_health_context(current_user, limit=10)
        result = _get_service().chat(
            message=message,
            history=validated_history,
            health_context=health_context,
            preferred_language=req.language,
        )
        return ChatResponse(**result)
    except HTTPException:
        raise
    except RuntimeError as exc:
        logger.exception("LLM chat failed")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("LLM chat failed unexpectedly")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="LLM request failed") from exc


@router.post("/analyze", response_model=AnalysisResponse, summary="Analyze recent health data")
def analyze(req: AnalyzeRequest, current_user=Depends(get_current_user)):
    try:
        health_context = _build_health_context(current_user, limit=req.limit)
        result = _get_service().analyze(
            health_context=health_context,
            preferred_language=req.language,
        )
        return AnalysisResponse(**result)
    except HTTPException:
        raise
    except RuntimeError as exc:
        logger.exception("LLM analysis failed")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("LLM analysis failed unexpectedly")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="LLM request failed") from exc


@router.post("/suggestions", response_model=SuggestionsResponse, summary="Generate wellness suggestions")
def suggestions(req: SuggestionsRequest, current_user=Depends(get_current_user)):
    try:
        health_context = _build_health_context(current_user, limit=req.limit)
        result = _get_service().suggestions(
            health_context=health_context,
            preferred_language=req.language,
        )
        return SuggestionsResponse(**result)
    except HTTPException:
        raise
    except RuntimeError as exc:
        logger.exception("LLM suggestions failed")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("LLM suggestions failed unexpectedly")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="LLM request failed") from exc


def _build_health_context(current_user: dict, limit: int = 10) -> str:
    user_ids = get_user_scope_user_ids(current_user)
    rows = list_records(user_ids, search="", sort="record_date desc", filters={})

    if not rows:
        return "No health records available for this user."

    recent_rows = rows[: max(1, min(limit, 20))]
    lines: List[str] = []
    for row in recent_rows:
        record_date = str(row.get("record_date", "unknown"))
        weight = row.get("weight_kg")
        bmi = row.get("bmi")
        calories = row.get("calories")
        water = row.get("water_liters")
        sleep = row.get("sleep_hours")
        food = str(row.get("food") or "").strip()
        exercise = str(row.get("exercise") or "").strip()

        parts = [f"Date: {record_date}"]
        if weight is not None:
            parts.append(f"Weight: {weight} kg")
        if bmi is not None:
            parts.append(f"BMI: {bmi}")
        if calories is not None:
            parts.append(f"Calories: {calories}")
        if water is not None:
            parts.append(f"Water: {water} L")
        if sleep is not None:
            parts.append(f"Sleep: {sleep} h")
        if food:
            parts.append(f"Food: {food}")
        if exercise:
            parts.append(f"Exercise: {exercise}")

        lines.append(" | ".join(parts))

    return "\n".join(lines)


def _validate_history(history: Optional[List[dict]]) -> List[Dict[str, str]]:
    if not history:
        return []

    validated: List[Dict[str, str]] = []
    for item in history[-20:]:
        if not isinstance(item, dict):
            continue
        role = str(item.get("role", "user")).strip().lower()
        content = str(item.get("content", "")).strip()
        if role not in {"user", "assistant"} or not content:
            continue
        validated.append({"role": role, "content": content})

    return validated
