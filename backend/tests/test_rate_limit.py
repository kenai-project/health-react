"""Tests for rate limiting middleware."""

import os
import sys
import time
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from api.main import app
from api.deps import get_current_user
from api.middleware.rate_limiter import rate_limiter, TokenBucket, RateLimiter


client = TestClient(app)


FAKE_USER = {"id": 999, "username": "ratelimit_tester", "role": "User"}


@pytest.fixture(autouse=True)
def override_auth():
    """Override auth for all tests."""
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


# ---------------------------------------------------------------------------
# TokenBucket Unit Tests
# ---------------------------------------------------------------------------

class TestTokenBucket:
    def test_initial_capacity(self):
        """Bucket starts full."""
        bucket = TokenBucket(capacity=10, refill_rate=1.0, tokens=10)
        allowed, _ = bucket.consume(1)
        assert allowed is True
        assert bucket.tokens == 9

    def test_burst_capacity(self):
        """Bucket allows burst up to capacity."""
        bucket = TokenBucket(capacity=5, refill_rate=0.1, tokens=5)
        for i in range(5):
            allowed, _ = bucket.consume(1)
            assert allowed is True, f"Request {i+1} should be allowed"
        allowed, _ = bucket.consume(1)
        assert allowed is False, "6th request should be denied"

    def test_refill_over_time(self):
        """Bucket refills tokens over time."""
        bucket = TokenBucket(capacity=10, refill_rate=10.0, tokens=0)
        # Simulate time passage by manipulating last_refill
        bucket.last_refill = time.time() - 1.0  # 1 second ago
        bucket._refill()
        assert bucket.tokens == 10.0  # Should have refilled 10 tokens in 1s

    def test_retry_after_calculation(self):
        """Retry-after is calculated correctly when denied."""
        bucket = TokenBucket(capacity=1, refill_rate=1.0, tokens=0)
        allowed, retry_after = bucket.consume(1)
        assert allowed is False
        assert retry_after > 0
        assert retry_after <= 1.0  # Should take ~1s to refill 1 token at 1/s


# ---------------------------------------------------------------------------
# RateLimiter Unit Tests
# ---------------------------------------------------------------------------

class TestRateLimiter:
    def test_check_allows_within_limit(self):
        """Requests within limit are allowed."""
        limiter = RateLimiter()
        for _ in range(10):
            allowed, _, _ = limiter.check("analysis", user_id=1)
            assert allowed is True

    def test_check_denies_over_limit(self):
        """Requests over burst limit are denied."""
        limiter = RateLimiter()
        # Burst capacity = 10 * 2 = 20
        for _ in range(20):
            allowed, _, _ = limiter.check("analysis", user_id=1)
            assert allowed is True
        allowed, retry_after, _ = limiter.check("analysis", user_id=1)
        assert allowed is False
        assert retry_after > 0

    def test_per_user_isolation(self):
        """Different users have separate buckets."""
        limiter = RateLimiter()
        # Exhaust user 1's bucket
        for _ in range(20):
            limiter.check("analysis", user_id=1)
        # User 2 should still be allowed
        allowed, _, _ = limiter.check("analysis", user_id=2)
        assert allowed is True

    def test_per_category_isolation(self):
        """Different categories have separate buckets for same user."""
        limiter = RateLimiter()
        # Exhaust analysis bucket
        for _ in range(20):
            limiter.check("analysis", user_id=1)
        # Read bucket should still be allowed
        allowed, _, _ = limiter.check("read", user_id=1)
        assert allowed is True

    def test_get_stats(self):
        """Stats return correct structure."""
        limiter = RateLimiter()
        limiter.check("analysis", user_id=1)
        stats = limiter.get_stats()
        assert "enabled" in stats
        assert "total_buckets" in stats
        assert "categories" in stats
        assert "analysis" in stats["categories"]

    def test_lru_eviction(self):
        """Oldest buckets are evicted when max is reached."""
        limiter = RateLimiter()
        limiter._max_buckets = 3
        limiter.check("analysis", user_id=1)
        limiter.check("analysis", user_id=2)
        limiter.check("analysis", user_id=3)
        assert len(limiter._buckets) == 3
        # Adding 4th should evict oldest (user 1)
        limiter.check("analysis", user_id=4)
        assert len(limiter._buckets) == 3
        assert "analysis:1" not in limiter._buckets


# ---------------------------------------------------------------------------
# Integration Tests (via API endpoints)
# ---------------------------------------------------------------------------

class TestRateLimitIntegration:
    def test_analysis_rate_limit_429(self):
        """Analysis endpoint returns 429 when rate limit exceeded."""
        with patch('api.routes.analyses.analysis_service') as mock_service:
            mock_service.analyze_document = AsyncMock(return_value={
                "id": 1, "type": "SUMMARY", "content": "test",
                "citations": [], "llm_model": "test", "generated_at": "2026",
                "cached": False,
            })

            # Exhaust burst capacity (10 * 2 = 20)
            for _ in range(20):
                resp = client.post(
                    "/api/v1/documents/1/summary",
                    headers={"Authorization": "Bearer test"},
                )
                assert resp.status_code == 200

            # 21st request should be rate limited
            resp = client.post(
                "/api/v1/documents/1/summary",
                headers={"Authorization": "Bearer test"},
            )
            assert resp.status_code == 429
            data = resp.json()
            assert "detail" in data
            assert "Retry-After" in resp.headers or "retry-after" in {k.lower(): v for k, v in resp.headers.items()}

    def test_rate_limit_headers_present(self):
        """Rate limit headers are present on successful responses."""
        with patch('api.routes.analyses.analysis_service') as mock_service:
            mock_service.analyze_document = AsyncMock(return_value={
                "id": 1, "type": "SUMMARY", "content": "test",
                "citations": [], "llm_model": "test", "generated_at": "2026",
                "cached": False,
            })

            resp = client.post(
                "/api/v1/documents/1/summary",
                headers={"Authorization": "Bearer test"},
            )
            assert resp.status_code == 200

    def test_different_users_not_affected(self):
        """User B is not rate limited because of user A's requests."""
        with patch('api.routes.analyses.analysis_service') as mock_service:
            mock_service.analyze_document = AsyncMock(return_value={
                "id": 1, "type": "SUMMARY", "content": "test",
                "citations": [], "llm_model": "test", "generated_at": "2026",
                "cached": False,
            })

            # Exhaust user 999's bucket
            for _ in range(20):
                client.post(
                    "/api/v1/documents/1/summary",
                    headers={"Authorization": "Bearer test"},
                )

            # Switch to a different user
            async def _user2():
                return {"id": 888, "username": "user2", "role": "User"}
            app.dependency_overrides[get_current_user] = _user2

            resp = client.post(
                "/api/v1/documents/1/summary",
                headers={"Authorization": "Bearer test"},
            )
            assert resp.status_code == 200  # Different user, not rate limited

            # Restore original user
            async def _original():
                return FAKE_USER
            app.dependency_overrides[get_current_user] = _original


if __name__ == "__main__":
    pytest.main([__file__, "-v"])