from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.job import Job


class JobRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_fingerprint(self, fingerprint: str) -> Job | None:
        result = await self._session.execute(select(Job).where(Job.fingerprint == fingerprint))
        return result.scalar_one_or_none()

    async def create(self, **kwargs: Any) -> Job:
        job = Job(**kwargs)
        self._session.add(job)
        await self._session.flush()
        await self._session.refresh(job)
        return job

    async def exists_by_fingerprint(self, fingerprint: str) -> bool:
        result = await self._session.execute(select(Job.id).where(Job.fingerprint == fingerprint))
        return result.scalar_one_or_none() is not None
