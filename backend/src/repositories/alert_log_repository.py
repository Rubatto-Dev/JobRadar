from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.alert_log import AlertLog


class AlertLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, **kwargs: Any) -> AlertLog:
        log = AlertLog(**kwargs)
        self._session.add(log)
        await self._session.flush()
        return log

    async def list_by_user(self, user_id: UUID, limit: int = 20) -> list[AlertLog]:
        result = await self._session.execute(
            select(AlertLog).where(AlertLog.user_id == user_id).order_by(AlertLog.sent_at.desc()).limit(limit)
        )
        return list(result.scalars().all())
