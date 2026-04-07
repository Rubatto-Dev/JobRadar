from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.models.application import Application


class ApplicationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_user(
        self, user_id: UUID, status: str | None = None, offset: int = 0, limit: int = 20
    ) -> tuple[list[Application], int]:
        stmt = select(Application).where(Application.user_id == user_id)
        count_stmt = select(func.count()).select_from(Application).where(Application.user_id == user_id)
        if status:
            stmt = stmt.where(Application.status == status)
            count_stmt = count_stmt.where(Application.status == status)
        count_result = await self._session.execute(count_stmt)
        total = count_result.scalar() or 0
        result = await self._session.execute(stmt.order_by(Application.applied_at.desc()).offset(offset).limit(limit))
        return list(result.scalars().all()), int(total)

    async def get_by_user_and_job(self, user_id: UUID, job_id: UUID) -> Application | None:
        result = await self._session.execute(
            select(Application).where(Application.user_id == user_id, Application.job_id == job_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id_and_user(self, app_id: UUID, user_id: UUID) -> Application | None:
        result = await self._session.execute(
            select(Application).where(Application.id == app_id, Application.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(self, **kwargs: Any) -> Application:
        app = Application(**kwargs)
        self._session.add(app)
        await self._session.flush()
        await self._session.refresh(app)
        return app

    async def update(self, app_id: UUID, user_id: UUID, **kwargs: Any) -> Application | None:
        app = await self.get_by_id_and_user(app_id, user_id)
        if app is None:
            return None
        for key, value in kwargs.items():
            setattr(app, key, value)
        await self._session.flush()
        await self._session.refresh(app)
        return app

    async def delete(self, app_id: UUID, user_id: UUID) -> bool:
        result = await self._session.execute(
            delete(Application).where(Application.id == app_id, Application.user_id == user_id)
        )
        await self._session.flush()
        return (result.rowcount or 0) > 0  # type: ignore[attr-defined]

    async def list_all_by_user(self, user_id: UUID) -> list[Application]:
        result = await self._session.execute(
            select(Application)
            .options(joinedload(Application.job))
            .where(Application.user_id == user_id)
            .order_by(Application.applied_at.desc())
        )
        return list(result.scalars().all())
