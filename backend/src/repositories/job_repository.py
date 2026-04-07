from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.job import Job
from src.schemas.job import JobFilters


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

    async def get_by_id(self, job_id: UUID) -> Job | None:
        result = await self._session.execute(select(Job).where(Job.id == job_id))
        return result.scalar_one_or_none()

    async def search(
        self,
        query: str | None,
        filters: JobFilters,
        sort: str,
        order: str,
        offset: int,
        limit: int,
    ) -> tuple[list[Job], int]:
        stmt = select(Job).where(Job.is_active.is_(True))

        if query:
            ts_query_pt = func.plainto_tsquery("portuguese", query)
            ts_query_en = func.plainto_tsquery("english", query)
            stmt = stmt.where(
                Job.search_vector.op("@@")(ts_query_pt)
                | Job.search_vector.op("@@")(ts_query_en)
            )

        if filters.modality:
            stmt = stmt.where(Job.modality.in_(filters.modality))
        if filters.seniority:
            stmt = stmt.where(Job.seniority.in_(filters.seniority))
        if filters.location:
            stmt = stmt.where(
                Job.location.ilike(f"%{filters.location}%")
                | Job.city.ilike(f"%{filters.location}%")
                | Job.state.ilike(f"%{filters.location}%")
                | Job.country.ilike(f"%{filters.location}%")
            )
        if filters.salary_min is not None:
            stmt = stmt.where(Job.salary_min >= filters.salary_min)
        if filters.salary_max is not None:
            stmt = stmt.where(Job.salary_max <= filters.salary_max)
        if filters.published_after:
            stmt = stmt.where(Job.published_at >= filters.published_after)

        count_result = await self._session.execute(select(func.count()).select_from(stmt.subquery()))
        total = count_result.scalar() or 0

        order_col: Any
        if sort == "date":
            order_col = Job.published_at
        elif sort == "salary":
            order_col = Job.salary_max
        else:
            order_col = Job.created_at

        stmt = stmt.order_by(order_col.asc()) if order == "asc" else stmt.order_by(order_col.desc())

        stmt = stmt.offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        return list(result.scalars().all()), int(total)
