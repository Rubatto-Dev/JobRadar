from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.job_source import JobSource


class SourceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, source_id: UUID) -> JobSource | None:
        result = await self._session.execute(select(JobSource).where(JobSource.id == source_id))
        return result.scalar_one_or_none()

    async def list_active(self) -> list[JobSource]:
        result = await self._session.execute(select(JobSource).where(JobSource.is_active.is_(True)))
        return list(result.scalars().all())

    async def update(self, source_id: UUID, **kwargs: Any) -> JobSource:
        source = await self.get_by_id(source_id)
        if source is None:
            msg = f"Source {source_id} not found"
            raise ValueError(msg)
        for key, value in kwargs.items():
            setattr(source, key, value)
        await self._session.flush()
        await self._session.refresh(source)
        return source
