from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse

from src.core.dependencies import require_admin
from src.schemas.admin import (
    AdminMetrics,
    AdminUserUpdate,
    AdminUserView,
    SourceStatus,
    SourceUpdate,
)
from src.schemas.pagination import PaginatedResponse, PaginationInfo

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/metrics", response_model=AdminMetrics)
async def get_metrics(
    admin_id: UUID = Depends(require_admin),
) -> AdminMetrics:
    return AdminMetrics()


@router.get("/sources", response_model=list[SourceStatus])
async def list_sources(
    admin_id: UUID = Depends(require_admin),
) -> list[SourceStatus]:
    return []


@router.patch("/sources/{source_id}", response_model=SourceStatus)
async def update_source(
    source_id: UUID,
    data: SourceUpdate,
    admin_id: UUID = Depends(require_admin),
) -> SourceStatus:
    raise HTTPException(status_code=501, detail="Not wired to repo yet")


@router.post("/sources/{source_id}/collect", status_code=202)
async def trigger_collection(
    source_id: UUID,
    admin_id: UUID = Depends(require_admin),
) -> JSONResponse:
    from src.services.admin_service import AdminService

    class _StubRepo:
        async def get_metrics(self) -> dict[str, int]:
            return {}

        async def list_sources(self) -> list:  # type: ignore[type-arg]
            return []

        async def update_source(self, source_id: UUID, **kwargs: object) -> None:
            pass

        async def list_users(
            self, search: str | None, is_active: bool | None, offset: int, limit: int
        ) -> tuple[list, int]:  # type: ignore[type-arg]
            return [], 0

        async def update_user(self, user_id: UUID, **kwargs: object) -> None:
            pass

    service = AdminService(_StubRepo())
    task_id = await service.trigger_collection(source_id)
    return JSONResponse(status_code=202, content={"task_id": task_id})


@router.get("/users", response_model=PaginatedResponse[AdminUserView])
async def list_users(
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    admin_id: UUID = Depends(require_admin),
) -> PaginatedResponse[AdminUserView]:
    return PaginatedResponse[AdminUserView](
        data=[],
        pagination=PaginationInfo(offset=offset, limit=limit, total=0),
    )


@router.patch("/users/{user_id}", response_model=AdminUserView)
async def update_user(
    user_id: UUID,
    data: AdminUserUpdate,
    admin_id: UUID = Depends(require_admin),
) -> AdminUserView:
    raise HTTPException(status_code=501, detail="Not wired to repo yet")
