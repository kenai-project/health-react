"""
Local LLM service using Ollama.

Architecture
────────────
- Uses the official `ollama` Python package to communicate with a local Ollama instance.
- Prompt construction and context injection are handled here.
- Database queries (health records, user info) are NOT performed here.
  They are passed in as pre-built context strings from the route layer.
- Designed for future RAG integration:
    - rag_context: placeholder for vector search results (ChromaDB/FAISS).
    - document_context: placeholder for PDF/medical document content.
    - sentence_transformer_embeddings: placeholder for future embedding queries.

Usage
─────
    from services.llm_service import LLMService

    service = LLMService()
    reply = service.chat(
        message="What is a healthy BMI?",
        history=[{"role": "user", "content": "..."}],
        health_context="...",
    )

Endpoints using this service:
    GET  /api/llm/health   → service.check_health()
    POST /api/llm/chat     → service.chat()
    POST /api/llm/analyze  → service.analyze()
    POST /api/llm/suggestions → service.suggestions()
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Environment variables are loaded once through the existing backend startup path
# (for example, db.session) before services are used.

LLM_CONFIG: Dict[str, Any] = {
    "model": os.environ.get("OLLAMA_MODEL", "llama3.2:latest"),
    "host": os.environ.get("OLLAMA_HOST", "http://localhost:11434"),
    "timeout": int(os.environ.get("OLLAMA_TIMEOUT_SEC", "120")),
    "max_tokens": 2048,
    "temperature": 0.7,
}

MEDICAL_DISCLAIMER = (
    "⚠️ **Medical Disclaimer**: The information provided is for educational and informational purposes only "
    "and is not a substitute for professional medical advice, diagnosis, or treatment. "
    "Always consult a qualified healthcare provider with any questions regarding your health."
)

SYSTEM_PROMPTS = {
    "chat": (
        "You are a helpful health and wellness assistant. "
        "You provide general health education, lifestyle guidance, and explain health metrics like BMI, "
        "calories, water intake, sleep, and exercise. "
        "You are empathetic, clear, and encouraging. "
        "You do NOT diagnose conditions, prescribe medications, or replace doctor visits. "
        "Always include a disclaimer when discussing medical topics. "
        "Use the user's health records (if provided) to give personalized, contextual advice."
    ),
    "analyze": (
        "You are a health data analyst. "
        "Given the user's recent health records, provide a concise analysis of their trends, "
        "highlighting notable patterns in weight, BMI, water intake, sleep, calories, and exercise. "
        "Be supportive and factual. "
        "Do not diagnose. Always include a disclaimer."
    ),
    "suggestions": (
        "You are a wellness coach. "
        "Based on the user's health records, provide 3-6 actionable, evidence-based suggestions "
        "to improve their health. "
        "Focus on diet, hydration, sleep, exercise, and lifestyle habits. "
        "Be specific, encouraging, and realistic. "
        "Always include a disclaimer."
    ),
}


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class LLMService:
    """
    Service for interacting with a local Ollama LLM instance.

    Responsibilities:
        - Communicate with Ollama via the official Python package
        - Construct prompts with system instructions and user context
        - Return structured responses for chat, analysis, and suggestions

    Future RAG integration points (not implemented yet):
        - self._build_rag_context(query) → str  (ChromaDB/FAISS lookup)
        - self._embed_query(text) → List[float] (Sentence Transformers)
        - self._ingest_document(path) → None    (PDF upload parsing)
    """

    def __init__(self) -> None:
        self.model: str = LLM_CONFIG["model"]
        self.host: str = LLM_CONFIG["host"]
        self.timeout: int = LLM_CONFIG["timeout"]
        self.max_tokens: int = LLM_CONFIG["max_tokens"]
        self.temperature: float = LLM_CONFIG["temperature"]

        # Future: configure vector store clients here
        self._vector_store = None  # Placeholder for ChromaDB/FAISS client
        self._embedder = None  # Placeholder for Sentence Transformer model

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def check_health(self) -> Dict[str, Any]:
        """
        Check if Ollama is reachable and the model is available.

        Returns:
            Dict with status, model name, and error detail if applicable.
        """
        try:
            from ollama import Client

            client = Client(host=self.host, timeout=self.timeout)
            models_response = client.list()

            if hasattr(models_response, "models"):
                models = models_response.models
            elif isinstance(models_response, dict):
                models = models_response.get("models", [])
            else:
                models = []

            available_models = []
            for model in models:
                if isinstance(model, dict):
                    available_models.append((model.get("name") or model.get("model") or "").strip())
                elif hasattr(model, "model"):
                    available_models.append(str(getattr(model, "model", "")).strip())

            model_available = self.model in available_models

            return {
                "status": "ok" if model_available else "model_not_found",
                "model": self.model,
                "model_available": model_available,
                "available_models": available_models,
            }
        except Exception as exc:
            logger.warning("Ollama health check failed: %s", exc)
            return {
                "status": "error",
                "detail": f"Ollama not reachable at {self.host}. Ensure Ollama is running.",
                "model": self.model,
            }

    def chat(
        self,
        message: str,
        *,
        history: Optional[List[Dict[str, str]]] = None,
        health_context: Optional[str] = None,
        rag_context: Optional[str] = None,
        document_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        General health assistant chat.

        Args:
            message: The user's current message.
            history: Previous conversation turns [{"role": "user"|"assistant", "content": str}].
            health_context: Pre-built string of user's recent health records.
            rag_context: Future — vector search results.
            document_context: Future — extracted PDF/medical document text.

        Returns:
            Dict with "reply" (str) and "disclaimer" (str).
        """
        system = SYSTEM_PROMPTS["chat"]
        messages = self._build_messages(
            system=system,
            message=message,
            history=history or [],
            health_context=health_context,
            rag_context=rag_context,
            document_context=document_context,
        )

        reply = self._generate(messages)
        return {"reply": reply, "disclaimer": MEDICAL_DISCLAIMER}

    def analyze(
        self,
        *,
        health_context: Optional[str] = None,
        rag_context: Optional[str] = None,
        document_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyze the user's recent health records.

        Args:
            health_context: Pre-built string of user's recent health records.
            rag_context: Future — vector search results.
            document_context: Future — extracted PDF/medical document text.

        Returns:
            Dict with "analysis" (str) and "disclaimer" (str).
        """
        system = SYSTEM_PROMPTS["analyze"]
        messages = self._build_messages(
            system=system,
            message="Please analyze my recent health records and provide insights.",
            history=[],
            health_context=health_context,
            rag_context=rag_context,
            document_context=document_context,
        )

        analysis = self._generate(messages)
        return {"analysis": analysis, "disclaimer": MEDICAL_DISCLAIMER}

    def suggestions(
        self,
        *,
        health_context: Optional[str] = None,
        rag_context: Optional[str] = None,
        document_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate health suggestions based on user records.

        Args:
            health_context: Pre-built string of user's recent health records.
            rag_context: Future — vector search results.
            document_context: Future — extracted PDF/medical document text.

        Returns:
            Dict with "suggestions" (str) and "disclaimer" (str).
        """
        system = SYSTEM_PROMPTS["suggestions"]
        messages = self._build_messages(
            system=system,
            message="Based on my health data, what suggestions do you have for me?",
            history=[],
            health_context=health_context,
            rag_context=rag_context,
            document_context=document_context,
        )

        suggestions_text = self._generate(messages)
        return {"suggestions": suggestions_text, "disclaimer": MEDICAL_DISCLAIMER}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_messages(
        self,
        *,
        system: str,
        message: str,
        history: List[Dict[str, str]],
        health_context: Optional[str] = None,
        rag_context: Optional[str] = None,
        document_context: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        """
        Build the full message list for the LLM.

        Message structure:
            1. System prompt
            2. Health context (if provided)
            3. RAG context (future)
            4. Document context (future)
            5. Conversation history
            6. Current user message
        """
        messages: List[Dict[str, str]] = [{"role": "system", "content": system}]

        # Inject health context as a system-level detail block
        context_parts: List[str] = []
        if health_context:
            context_parts.append(f"User's health records:\n{health_context}")
        if rag_context:
            context_parts.append(f"Relevant information from knowledge base:\n{rag_context}")
        if document_context:
            context_parts.append(f"Information from uploaded documents:\n{document_context}")

        if context_parts:
            messages.append(
                {
                    "role": "system",
                    "content": "Here is additional context about the user:\n\n"
                    + "\n\n".join(context_parts),
                }
            )

        # Append conversation history (limited to last 20 turns for context window)
        for turn in history[-20:]:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            if role in ("user", "assistant"):
                messages.append({"role": role, "content": content})

        # Current user message
        messages.append({"role": "user", "content": message})

        return messages

    def _generate(self, messages: List[Dict[str, str]]) -> str:
        """
        Send messages to Ollama and return the response text.

        Args:
            messages: List of message dicts with "role" and "content".

        Returns:
            The model's response as a string.
        """
        try:
            from ollama import Client

            client = Client(host=self.host, timeout=self.timeout)
            response = client.chat(
                model=self.model,
                messages=messages,
                options={
                    "temperature": self.temperature,
                    "num_predict": self.max_tokens,
                },
            )

            if hasattr(response, "message"):
                message = response.message
                if hasattr(message, "content"):
                    return str(message.content).strip()

            if isinstance(response, dict):
                return str(response.get("message", {}).get("content", "")).strip()

            return ""

        except Exception as exc:
            logger.exception("Ollama chat failed for model %s", self.model)
            raise RuntimeError(
                f"Failed to communicate with Ollama. "
                f"Ensure Ollama is running (host={self.host}) and model '{self.model}' is pulled. "
                f"Error: {exc}"
            ) from exc

    # ------------------------------------------------------------------
    # Future RAG stubs (not implemented)
    # ------------------------------------------------------------------

    def _build_rag_context(self, query: str) -> str:
        """Future: retrieve relevant context from vector store (ChromaDB/FAISS)."""
        raise NotImplementedError("RAG context retrieval is not yet implemented.")

    def _embed_query(self, text: str) -> list[float]:
        """Future: generate embeddings using Sentence Transformers."""
        raise NotImplementedError("Embedding generation is not yet implemented.")

    def _ingest_document(self, path: str) -> None:
        """Future: parse and ingest a PDF/medical document."""
        raise NotImplementedError("Document ingestion is not yet implemented.")
