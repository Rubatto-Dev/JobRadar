from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.search_history import SearchHistory


class SearchHistoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, **kwargs: Any) -> SearchHistory:
        entry = SearchHistory(**kwargs)
        self._session.add(entry)
        await self._session.flush()
        return entry

    async def get_recent(self, user_id: UUID, limit: int = 10) -> list[SearchHistory]:
        result = await self._session.execute(
            select(SearchHistory)
            .where(SearchHistory.user_id == user_id)
            .order_by(SearchHistory.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def clear(self, user_id: UUID) -> None:
        await self._session.execute(delete(SearchHistory).where(SearchHistory.user_id == user_id))
        await self._session.flush()
