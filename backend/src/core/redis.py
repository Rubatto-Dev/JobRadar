from __future__ import annotations

from typing import Any

from redis.asyncio import Redis

from src.core.config import get_settings


def get_redis() -> Any:
    settings = get_settings()
    return Redis.from_url(settings.REDIS_URL, decode_responses=True)


class RedisService:
    def __init__(self, redis: Any) -> None:
        self._redis = redis

    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        await self._redis.set(key, value, ex=ex)

    async def get(self, key: str) -> str | None:
        result = await self._redis.get(key)
        return str(result) if result is not None else None

    async def exists(self, key: str) -> bool:
        return bool(await self._redis.exists(key))
