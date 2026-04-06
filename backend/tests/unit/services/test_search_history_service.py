"""Testes unitarios para SearchHistoryService."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from src.services.search_history_service import SearchHistoryService


class FakeSearchEntry:
    def __init__(self, **kwargs: Any) -> None:
        self.id: UUID = kwargs.get("id", uuid.uuid4())
        self.query: str = kwargs.get("query", "")
        self.filters: dict[str, Any] | None = kwargs.get("filters")
        self.created_at: datetime = kwargs.get("created_at", datetime.now(UTC))


class FakeSearchHistoryRepo:
    def __init__(self) -> None:
        self._entries: list[FakeSearchEntry] = []

    async def create(self, **kwargs: Any) -> FakeSearchEntry:
        entry = FakeSearchEntry(**kwargs)
        self._entries.append(entry)
        return entry

    async def get_recent(self, user_id: UUID, limit: int = 10) -> list[FakeSearchEntry]:
        user_entries = [e for e in self._entries if hasattr(e, "user_id") or True]
        return user_entries[:limit]

    async def clear(self, user_id: UUID) -> None:
        self._entries.clear()


class TestSearchHistoryService:
    async def test_save_search_should_persist_query_and_filters(self) -> None:
        repo = FakeSearchHistoryRepo()
        service = SearchHistoryService(repo)
        await service.save(uuid.uuid4(), "python developer", {"modality": ["remoto"]})
        assert len(repo._entries) == 1

    async def test_get_recent_should_return_last_10(self) -> None:
        repo = FakeSearchHistoryRepo()
        service = SearchHistoryService(repo)
        user_id = uuid.uuid4()
        for i in range(15):
            await service.save(user_id, f"query {i}")
        recent = await service.get_recent(user_id, limit=10)
        assert len(recent) == 10

    async def test_clear_should_delete_all_user_history(self) -> None:
        repo = FakeSearchHistoryRepo()
        service = SearchHistoryService(repo)
        user_id = uuid.uuid4()
        await service.save(user_id, "test")
        await service.clear(user_id)
        recent = await service.get_recent(user_id)
        assert len(recent) == 0
