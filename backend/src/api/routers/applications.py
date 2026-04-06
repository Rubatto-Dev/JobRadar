from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user_id
from src.repositories.application_repository import ApplicationRepository
from src.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationUpdate
from src.schemas.pagination import PaginatedResponse
from src.services.application_service import AlreadyAppliedError, ApplicationService

router = APIRouter(prefix="/api/v1/applications", tags=["applications"])


def _get_service(db: AsyncSession = Depends(get_db)) -> ApplicationService:
    return ApplicationService(ApplicationRepository(db))


@router.get("", response_model=PaginatedResponse[ApplicationResponse])
async def list_applications(
    status: str | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    user_id: UUID = Depends(get_current_user_id),
    service: ApplicationService = Depends(_get_service),
) -> PaginatedResponse[ApplicationResponse]:
    return await service.list(user_id, status, offset, limit)


@router.post("", response_model=ApplicationResponse, status_code=201)
async def create_application(
    data: ApplicationCreate,
    user_id: UUID = Depends(get_current_user_id),
    service: ApplicationService = Depends(_get_service),
) -> ApplicationResponse:
    try:
        return await service.create(user_id, data.job_id, data.notes)
    except AlreadyAppliedError as e:
        raise HTTPException(status_code=409, detail=e.message) from e


@router.patch("/{app_id}", response_model=ApplicationResponse)
async def update_application(
    app_id: UUID,
    data: ApplicationUpdate,
    user_id: UUID = Depends(get_current_user_id),
    service: ApplicationService = Depends(_get_service),
) -> ApplicationResponse:
    try:
        return await service.update(user_id, app_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.delete("/{app_id}", status_code=204)
async def delete_application(
    app_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: ApplicationService = Depends(_get_service),
) -> None:
    try:
        await service.delete(user_id, app_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/export/csv")
async def export_csv(
    user_id: UUID = Depends(get_current_user_id),
    service: ApplicationService = Depends(_get_service),
) -> StreamingResponse:
    csv_content = await service.export_csv(user_id)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=applications.csv"},
    )
