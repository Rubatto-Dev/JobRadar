from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.area import Area


class AreaRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_active(self) -> list[Area]:
        result = await self._session.execute(select(Area).where(Area.is_active.is_(True)).order_by(Area.name_pt))
        return list(result.scalars().all())

    async def get_by_id(self, area_id: UUID) -> Area | None:
        result = await self._session.execute(select(Area).where(Area.id == area_id))
        return result.scalar_one_or_none()

    async def create(self, **kwargs: Any) -> Area:
        area = Area(**kwargs)
        self._session.add(area)
        await self._session.flush()
        await self._session.refresh(area)
        return area

    async def update(self, area_id: UUID, **kwargs: Any) -> Area:
        area = await self.get_by_id(area_id)
        if area is None:
            msg = f"Area {area_id} not found"
            raise ValueError(msg)
        for key, value in kwargs.items():
            setattr(area, key, value)
        await self._session.flush()
        await self._session.refresh(area)
        return area
