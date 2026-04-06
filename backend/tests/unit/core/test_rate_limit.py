"""Testes unitarios para core/rate_limit.py."""

from __future__ import annotations

import pytest

from src.core.exceptions import RateLimitExceededError
from src.core.rate_limit import RateLimiter
from tests.fakes import FakeRedis


class TestRateLimiter:
    async def test_rate_limit_should_allow_under_limit(self) -> None:
        redis = FakeRedis()
        limiter = RateLimiter(redis)
        remaining = await limiter.check("test:key", limit=5, window=60)
        assert remaining == 4

    async def test_rate_limit_should_block_over_limit(self) -> None:
        redis = FakeRedis()
        limiter = RateLimiter(redis)
        for _ in range(5):
            await limiter.check("test:key", limit=5, window=60)
        with pytest.raises(RateLimitExceededError) as exc_info:
            await limiter.check("test:key", limit=5, window=60)
        assert exc_info.value.retry_after == 60

    async def test_rate_limit_should_track_per_key(self) -> None:
        redis = FakeRedis()
        limiter = RateLimiter(redis)
        await limiter.check("key:a", limit=1, window=60)
        remaining = await limiter.check("key:b", limit=1, window=60)
        assert remaining == 0

    async def test_login_should_block_after_5_attempts_per_email(self) -> None:
        redis = FakeRedis()
        limiter = RateLimiter(redis)
        for _ in range(5):
            await limiter.check("login:email:test@example.com", limit=5, window=900)
        with pytest.raises(RateLimitExceededError):
            await limiter.check("login:email:test@example.com", limit=5, window=900)

    async def test_login_should_block_after_20_attempts_per_ip(self) -> None:
        redis = FakeRedis()
        limiter = RateLimiter(redis)
        for _ in range(20):
            await limiter.check("login:ip:192.168.1.1", limit=20, window=900)
        with pytest.raises(RateLimitExceededError):
            await limiter.check("login:ip:192.168.1.1", limit=20, window=900)
