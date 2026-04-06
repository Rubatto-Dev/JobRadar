from __future__ import annotations

from typing import Any, Protocol
from uuid import UUID


class SearchHistoryEntry:
    def __init__(self, **kwargs: Any) -> None:
        self.id = kwargs.get("id")
        self.query = kwargs.get("query", "")
        self.filters = kwargs.get("filters")
        self.created_at = kwargs.get("created_at")


class SearchHistoryRepoProtocol(Protocol):
    async def create(self, **kwargs: Any) -> Any: ...
    async def get_recent(self, user_id: UUID, limit: int = 10) -> list[Any]: ...
    async def clear(self, user_id: UUID) -> None: ...


class SearchHistoryService:
    def __init__(self, repo: SearchHistoryRepoProtocol) -> None:
        self._repo = repo

    async def save(self, user_id: UUID, query: str, filters: dict[str, Any] | None = None) -> None:
        await self._repo.create(user_id=user_id, query=query, filters=filters)

    async def get_recent(self, user_id: UUID, limit: int = 10) -> list[Any]:
        return await self._repo.get_recent(user_id, limit)

    async def clear(self, user_id: UUID) -> None:
        await self._repo.clear(user_id)
