from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import require_admin
from src.repositories.admin_repository import AdminRepository
from src.schemas.admin import (
    AdminMetrics,
    AdminUserUpdate,
    AdminUserView,
    SourceStatus,
    SourceUpdate,
)
from src.schemas.pagination import PaginatedResponse
from src.services.admin_service import AdminService

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


def _get_admin_service(db: AsyncSession = Depends(get_db)) -> AdminService:
    return AdminService(AdminRepository(db))


@router.get("/metrics", response_model=AdminMetrics)
async def get_metrics(
    admin_id: UUID = Depends(require_admin),
    service: AdminService = Depends(_get_admin_service),
) -> AdminMetrics:
    return await service.get_metrics()


@router.get("/sources", response_model=list[SourceStatus])
async def list_sources(
    admin_id: UUID = Depends(require_admin),
    service: AdminService = Depends(_get_admin_service),
) -> list[SourceStatus]:
    return await service.list_sources()


@router.patch("/sources/{source_id}", response_model=SourceStatus)
async def update_source(
    source_id: UUID,
    data: SourceUpdate,
    admin_id: UUID = Depends(require_admin),
    service: AdminService = Depends(_get_admin_service),
) -> SourceStatus:
    return await service.update_source(source_id, data)


@router.post("/sources/{source_id}/collect", status_code=202)
async def trigger_collection(
    source_id: UUID,
    admin_id: UUID = Depends(require_admin),
    service: AdminService = Depends(_get_admin_service),
) -> JSONResponse:
    task_id = await service.trigger_collection(source_id)
    return JSONResponse(status_code=202, content={"task_id": task_id})


@router.get("/users", response_model=PaginatedResponse[AdminUserView])
async def list_users(
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    admin_id: UUID = Depends(require_admin),
    service: AdminService = Depends(_get_admin_service),
) -> PaginatedResponse[AdminUserView]:
    return await service.list_users(search, is_active, offset, limit)


@router.patch("/users/{user_id}", response_model=AdminUserView)
async def update_user(
    user_id: UUID,
    data: AdminUserUpdate,
    admin_id: UUID = Depends(require_admin),
    service: AdminService = Depends(_get_admin_service),
) -> AdminUserView:
    return await service.update_user(user_id, data)
