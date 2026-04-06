from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user_id
from src.repositories.favorite_repository import FavoriteRepository
from src.schemas.favorite import FavoriteCreate, FavoriteResponse
from src.schemas.pagination import PaginatedResponse
from src.services.favorite_service import AlreadyFavoritedError, FavoriteService

router = APIRouter(prefix="/api/v1/favorites", tags=["favorites"])


def _get_service(db: AsyncSession = Depends(get_db)) -> FavoriteService:
    return FavoriteService(FavoriteRepository(db))


@router.get("", response_model=PaginatedResponse[FavoriteResponse])
async def list_favorites(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    user_id: UUID = Depends(get_current_user_id),
    service: FavoriteService = Depends(_get_service),
) -> PaginatedResponse[FavoriteResponse]:
    return await service.list(user_id, offset, limit)


@router.post("", response_model=FavoriteResponse, status_code=201)
async def add_favorite(
    data: FavoriteCreate,
    user_id: UUID = Depends(get_current_user_id),
    service: FavoriteService = Depends(_get_service),
) -> FavoriteResponse:
    try:
        return await service.add(user_id, data.job_id)
    except AlreadyFavoritedError as e:
        raise HTTPException(status_code=409, detail=e.message) from e


@router.delete("/{job_id}", status_code=204)
async def remove_favorite(
    job_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: FavoriteService = Depends(_get_service),
) -> None:
    try:
        await service.remove(user_id, job_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
