from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.repositories.area_repository import AreaRepository
from src.schemas.area import AreaCreate, AreaResponse, AreaUpdate
from src.services.area_service import AreaService

router = APIRouter(tags=["areas"])


def _get_area_service(db: AsyncSession = Depends(get_db)) -> AreaService:
    return AreaService(AreaRepository(db))


@router.get("/api/v1/areas", response_model=list[AreaResponse])
async def list_areas(
    locale: str = Query("pt-br", pattern=r"^(pt-br|en)$"),
    service: AreaService = Depends(_get_area_service),
) -> list[AreaResponse]:
    return await service.list_active(locale)


@router.post("/api/v1/admin/areas", response_model=AreaResponse, status_code=201)
async def create_area(
    data: AreaCreate,
    service: AreaService = Depends(_get_area_service),
) -> AreaResponse:
    return await service.create(data)


@router.patch("/api/v1/admin/areas/{area_id}", response_model=AreaResponse)
async def update_area(
    area_id: UUID,
    data: AreaUpdate,
    service: AreaService = Depends(_get_area_service),
) -> AreaResponse:
    return await service.update(area_id, data)
