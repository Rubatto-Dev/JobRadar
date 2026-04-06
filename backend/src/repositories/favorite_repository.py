from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.favorite import Favorite


class FavoriteRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_user(self, user_id: UUID, offset: int = 0, limit: int = 20) -> tuple[list[Favorite], int]:
        count_result = await self._session.execute(
            select(func.count()).select_from(Favorite).where(Favorite.user_id == user_id)
        )
        total = count_result.scalar() or 0
        result = await self._session.execute(
            select(Favorite)
            .where(Favorite.user_id == user_id)
            .order_by(Favorite.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), int(total)

    async def get_by_user_and_job(self, user_id: UUID, job_id: UUID) -> Favorite | None:
        result = await self._session.execute(
            select(Favorite).where(Favorite.user_id == user_id, Favorite.job_id == job_id)
        )
        return result.scalar_one_or_none()

    async def create(self, **kwargs: Any) -> Favorite:
        fav = Favorite(**kwargs)
        self._session.add(fav)
        await self._session.flush()
        await self._session.refresh(fav)
        return fav

    async def delete_by_user_and_job(self, user_id: UUID, job_id: UUID) -> bool:
        result = await self._session.execute(
            delete(Favorite).where(Favorite.user_id == user_id, Favorite.job_id == job_id)
        )
        await self._session.flush()
        return (result.rowcount or 0) > 0  # type: ignore[attr-defined]
