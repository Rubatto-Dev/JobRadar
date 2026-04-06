from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.preference import UserPreference


class PreferenceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_user_id(self, user_id: UUID) -> UserPreference | None:
        result = await self._session.execute(select(UserPreference).where(UserPreference.user_id == user_id))
        return result.scalar_one_or_none()

    async def create(self, **kwargs: Any) -> UserPreference:
        pref = UserPreference(**kwargs)
        self._session.add(pref)
        await self._session.flush()
        await self._session.refresh(pref)
        return pref

    async def update(self, pref_id: UUID, **kwargs: Any) -> UserPreference:
        result = await self._session.execute(select(UserPreference).where(UserPreference.id == pref_id))
        pref = result.scalar_one()
        for key, value in kwargs.items():
            setattr(pref, key, value)
        await self._session.flush()
        await self._session.refresh(pref)
        return pref
