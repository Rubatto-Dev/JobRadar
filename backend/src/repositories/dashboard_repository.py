from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.application import Application
from src.models.favorite import Favorite
from src.models.job import Job


class DashboardRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def count_new_jobs_24h(self) -> int:
        day_ago = datetime.now(UTC) - timedelta(days=1)
        result = await self._session.execute(
            select(func.count()).select_from(Job).where(Job.is_active.is_(True), Job.created_at >= day_ago)
        )
        return int(result.scalar() or 0)

    async def count_favorites(self, user_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count()).select_from(Favorite).where(Favorite.user_id == user_id)
        )
        return int(result.scalar() or 0)

    async def count_applications_by_status(self, user_id: UUID) -> dict[str, int]:
        result = await self._session.execute(
            select(Application.status, func.count()).where(Application.user_id == user_id).group_by(Application.status)
        )
        return {str(row[0]): int(row[1]) for row in result.all()}

    async def get_recommended_jobs(self, user_id: UUID, limit: int = 5) -> list[Job]:
        result = await self._session.execute(
            select(Job).where(Job.is_active.is_(True)).order_by(Job.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())
