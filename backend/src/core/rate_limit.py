from __future__ import annotations

from src.core.exceptions import RateLimitExceededError
from src.protocols.auth import RedisProtocol


class RateLimiter:
    def __init__(self, redis: RedisProtocol) -> None:
        self._redis = redis

    async def check(self, key: str, limit: int, window: int) -> int:
        """Check rate limit. Returns remaining requests. Raises RateLimitExceededError if exceeded."""
        counter_key = f"ratelimit:{key}"
        current = await self._redis.get(counter_key)
        count = int(current) if current else 0

        if count >= limit:
            raise RateLimitExceededError(retry_after=window)

        await self._redis.set(counter_key, str(count + 1), ex=window)
        return limit - count - 1


# Preset configurations
GLOBAL_AUTH_LIMIT = 100
GLOBAL_AUTH_WINDOW = 60  # 1 min
GLOBAL_ANON_LIMIT = 30
GLOBAL_ANON_WINDOW = 60  # 1 min
LOGIN_EMAIL_LIMIT = 5
LOGIN_EMAIL_WINDOW = 900  # 15 min
LOGIN_IP_LIMIT = 20
LOGIN_IP_WINDOW = 900  # 15 min
