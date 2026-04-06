from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.job import Job
from src.models.job_source import JobSource
from src.models.user import User


class AdminRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_metrics(self) -> dict[str, int]:
        now = datetime.now(UTC)
        day_ago = now - timedelta(days=1)
        week_ago = now - timedelta(days=7)

        total_users = (await self._session.execute(select(func.count()).select_from(User))).scalar() or 0
        active_7d = (
            await self._session.execute(select(func.count()).select_from(User).where(User.updated_at >= week_ago))
        ).scalar() or 0
        new_24h = (
            await self._session.execute(select(func.count()).select_from(User).where(User.created_at >= day_ago))
        ).scalar() or 0
        total_jobs = (
            await self._session.execute(select(func.count()).select_from(Job).where(Job.is_active.is_(True)))
        ).scalar() or 0
        new_jobs_24h = (
            await self._session.execute(select(func.count()).select_from(Job).where(Job.created_at >= day_ago))
        ).scalar() or 0
        total_sources = (await self._session.execute(select(func.count()).select_from(JobSource))).scalar() or 0

        return {
            "total_users": int(total_users),
            "active_users_7d": int(active_7d),
            "new_users_24h": int(new_24h),
            "total_jobs_active": int(total_jobs),
            "new_jobs_24h": int(new_jobs_24h),
            "total_sources": int(total_sources),
        }

    async def list_sources(self) -> list[JobSource]:
        result = await self._session.execute(select(JobSource).order_by(JobSource.name))
        return list(result.scalars().all())

    async def update_source(self, source_id: UUID, **kwargs: Any) -> JobSource:
        result = await self._session.execute(select(JobSource).where(JobSource.id == source_id))
        source = result.scalar_one()
        for key, value in kwargs.items():
            setattr(source, key, value)
        await self._session.flush()
        await self._session.refresh(source)
        return source

    async def list_users(
        self, search: str | None, is_active: bool | None, offset: int, limit: int
    ) -> tuple[list[User], int]:
        stmt = select(User)
        count_stmt = select(func.count()).select_from(User)

        if search:
            like = f"%{search}%"
            stmt = stmt.where(User.name.ilike(like) | User.email.ilike(like))
            count_stmt = count_stmt.where(User.name.ilike(like) | User.email.ilike(like))
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)  # noqa: E712
            count_stmt = count_stmt.where(User.is_active == is_active)  # noqa: E712

        total = (await self._session.execute(count_stmt)).scalar() or 0
        result = await self._session.execute(stmt.order_by(User.created_at.desc()).offset(offset).limit(limit))
        return list(result.scalars().all()), int(total)

    async def update_user(self, user_id: UUID, **kwargs: Any) -> User:
        result = await self._session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        for key, value in kwargs.items():
            setattr(user, key, value)
        await self._session.flush()
        await self._session.refresh(user)
        return user
