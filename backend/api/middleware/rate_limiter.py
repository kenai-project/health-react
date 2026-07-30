"""Rate limiting middleware — token bucket per-user rate limiting.

Configurable via environment variables:
    RATE_LIMIT_ANALYSIS_REQUESTS   (default: 10)  — requests per window for analysis endpoints
    RATE_LIMIT_ANALYSIS_WINDOW      (default: 60)  — window in seconds
    RATE_LIMIT_UPLOAD_REQUESTS      (default: 5)   — requests per window for upload
    RATE_LIMIT_UPLOAD_WINDOW        (default: 60)  — window in seconds
    RATE_LIMIT_EXTRACT_REQUESTS     (default: 3)   — requests per window for extraction
    RATE_LIMIT_EXTRACT_WINDOW       (default: 60)  — window in seconds
    RATE_LIMIT_READ_REQUESTS        (default: 60)  — requests per window for read endpoints
    RATE_LIMIT_READ_WINDOW          (default: 60)  — window in seconds
    RATE_LIMIT_REGENERATE_REQUESTS  (default: 3)   — requests per window for regeneration
    RATE_LIMIT_REGENERATE_WINDOW    (default: 60)  — window in seconds
    RATE_LIMIT_BURST_MULTIPLIER     (default: 2)   — burst capacity multiplier
    RATE_LIMIT_ENABLED              (default: true)— master switch
"""

import os
import time
import logging
from typing import Optional
from collections import OrderedDict
from dataclasses import dataclass, field

from fastapi import HTTPException, status, Request, Depends
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

RATE_LIMIT_ENABLED = os.environ.get("RATE_LIMIT_ENABLED", "true").lower() == "true"
RATE_LIMIT_BURST_MULTIPLIER = float(os.environ.get("RATE_LIMIT_BURST_MULTIPLIER", "2"))

# Per-category limits (requests, window_seconds)
_LIMITS = {
    "analysis": (
        int(os.environ.get("RATE_LIMIT_ANALYSIS_REQUESTS", "10")),
        int(os.environ.get("RATE_LIMIT_ANALYSIS_WINDOW", "60")),
    ),
    "upload": (
        int(os.environ.get("RATE_LIMIT_UPLOAD_REQUESTS", "5")),
        int(os.environ.get("RATE_LIMIT_UPLOAD_WINDOW", "60")),
    ),
    "extract": (
        int(os.environ.get("RATE_LIMIT_EXTRACT_REQUESTS", "3")),
        int(os.environ.get("RATE_LIMIT_EXTRACT_WINDOW", "60")),
    ),
    "read": (
        int(os.environ.get("RATE_LIMIT_READ_REQUESTS", "60")),
        int(os.environ.get("RATE_LIMIT_READ_WINDOW", "60")),
    ),
    "regenerate": (
        int(os.environ.get("RATE_LIMIT_REGENERATE_REQUESTS", "3")),
        int(os.environ.get("RATE_LIMIT_REGENERATE_WINDOW", "60")),
    ),
}

# Max number of user buckets to keep in memory (LRU eviction)
_MAX_USER_BUCKETS = int(os.environ.get("RATE_LIMIT_MAX_BUCKETS", "10000"))


# ---------------------------------------------------------------------------
# Token Bucket
# ---------------------------------------------------------------------------

@dataclass
class TokenBucket:
    """Token bucket for rate limiting.

    Tokens refill at a steady rate. Burst capacity is multiplier × steady rate.
    """
    capacity: float
    refill_rate: float  # tokens per second
    tokens: float = 0
    last_refill: float = field(default_factory=time.time)

    def _refill(self) -> None:
        """Refill tokens based on elapsed time."""
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now

    def consume(self, tokens: float = 1.0) -> tuple[bool, float]:
        """Try to consume tokens.

        Returns:
            Tuple of (allowed, retry_after_seconds).
            If allowed is False, retry_after is the time until enough tokens refill.
        """
        self._refill()
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True, 0.0
        # Calculate retry-after: time needed to refill enough tokens
        needed = tokens - self.tokens
        retry_after = needed / self.refill_rate if self.refill_rate > 0 else float("inf")
        return False, retry_after


# ---------------------------------------------------------------------------
# Rate Limiter
# ---------------------------------------------------------------------------

class RateLimiter:
    """Per-user token bucket rate limiter with LRU eviction."""

    def __init__(self):
        # key: f"{category}:{user_id}" -> TokenBucket
        self._buckets: OrderedDict[str, TokenBucket] = OrderedDict()
        self._limits = _LIMITS
        self._burst_multiplier = RATE_LIMIT_BURST_MULTIPLIER
        self._max_buckets = _MAX_USER_BUCKETS

    def _get_bucket(self, category: str, user_id: int) -> TokenBucket:
        """Get or create a token bucket for a user + category."""
        key = f"{category}:{user_id}"

        if key in self._buckets:
            # Move to end (LRU)
            self._buckets.move_to_end(key)
            return self._buckets[key]

        # Create new bucket
        requests, window = self._limits.get(category, (10, 60))
        refill_rate = requests / window  # tokens per second
        capacity = requests * self._burst_multiplier  # burst capacity

        bucket = TokenBucket(capacity=capacity, refill_rate=refill_rate, tokens=capacity)
        self._buckets[key] = bucket

        # Evict oldest if at capacity
        if len(self._buckets) > self._max_buckets:
            self._buckets.popitem(last=False)
            logger.debug("Rate limit bucket evicted (LRU), total buckets: %d", len(self._buckets))

        return bucket

    def check(self, category: str, user_id: int) -> tuple[bool, float, dict]:
        """Check if request is allowed.

        Args:
            category: Rate limit category (e.g., "analysis", "upload")
            user_id: User ID from JWT

        Returns:
            Tuple of (allowed, retry_after_seconds, rate_limit_info).
            rate_limit_info contains headers to include in response.
        """
        if not RATE_LIMIT_ENABLED:
            return True, 0.0, {}

        bucket = self._get_bucket(category, user_id)
        allowed, retry_after = bucket.consume()

        requests, window = self._limits.get(category, (10, 60))
        info = {
            "X-RateLimit-Limit": str(requests),
            "X-RateLimit-Window": str(window),
            "X-RateLimit-Remaining": str(int(bucket.tokens)),
        }

        if not allowed:
            info["Retry-After"] = str(int(retry_after) + 1)  # Round up
            logger.warning(
                "Rate limit exceeded: category=%s, user_id=%d, retry_after=%.1fs",
                category, user_id, retry_after,
            )

        return allowed, retry_after, info

    def get_stats(self) -> dict:
        """Get rate limiter statistics."""
        return {
            "enabled": RATE_LIMIT_ENABLED,
            "total_buckets": len(self._buckets),
            "max_buckets": self._max_buckets,
            "categories": {
                cat: {"requests": req, "window": win, "burst": int(req * self._burst_multiplier)}
                for cat, (req, win) in self._limits.items()
            },
        }


# Global instance
rate_limiter = RateLimiter()


# ---------------------------------------------------------------------------
# FastAPI Dependency
# ---------------------------------------------------------------------------

def create_rate_limit_dependency(category: str):
    """Create a FastAPI dependency for rate limiting a specific category.

    Usage:
        analysis_rate_limit = create_rate_limit_dependency("analysis")

        @router.post("/summary", dependencies=[Depends(analysis_rate_limit)])
        async def generate_summary(...):
            ...
    """
    async def _rate_limit_dependency(request: Request, user=Depends(_get_user_for_rate_limit)):
        if not RATE_LIMIT_ENABLED:
            return

        user_id = user["id"] if user else 0  # 0 = anonymous (shouldn't happen with auth)
        allowed, retry_after, headers = rate_limiter.check(category, user_id)

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {int(retry_after) + 1} seconds.",
                headers={
                    "Retry-After": str(int(retry_after) + 1),
                    "X-RateLimit-Limit": headers.get("X-RateLimit-Limit", ""),
                    "X-RateLimit-Remaining": "0",
                },
            )

    return _rate_limit_dependency


async def _get_user_for_rate_limit(request: Request):
    """Extract user from request state (set by auth middleware/dependency).

    Falls back to None if no auth — rate limiter uses user_id=0 for anonymous.
    """
    # Try to get user from request state (set by get_current_user dependency)
    user = getattr(request.state, "user", None)
    if user:
        return user

    # Fallback: try to get from auth dependency directly
    # This is a soft dependency — if auth fails, rate limit still applies with user_id=0
    return None


# Pre-configured dependencies for each category
analysis_rate_limit = create_rate_limit_dependency("analysis")
upload_rate_limit = create_rate_limit_dependency("upload")
extract_rate_limit = create_rate_limit_dependency("extract")
read_rate_limit = create_rate_limit_dependency("read")
regenerate_rate_limit = create_rate_limit_dependency("regenerate")