from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user_id
from src.core.exceptions import DomainError
from src.repositories.user_repository import UserRepository
from src.schemas.user import DeleteAccountRequest, UserExport, UserProfile, UserUpdate
from src.services.user_service import UserService

router = APIRouter(prefix="/api/v1/users", tags=["users"])


def _get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    from src.core.redis import RedisService, get_redis

    return UserService(UserRepository(db), RedisService(get_redis()))


@router.get("/me", response_model=UserProfile)
async def get_profile(
    user_id: UUID = Depends(get_current_user_id),
    service: UserService = Depends(_get_user_service),
) -> UserProfile:
    try:
        return await service.get_profile(user_id)
    except DomainError as e:
        raise HTTPException(status_code=404, detail=e.message) from e


@router.patch("/me", response_model=UserProfile)
async def update_profile(
    data: UserUpdate,
    user_id: UUID = Depends(get_current_user_id),
    service: UserService = Depends(_get_user_service),
) -> UserProfile:
    return await service.update_profile(user_id, data)


@router.delete("/me", status_code=204)
async def delete_account(
    data: DeleteAccountRequest,
    user_id: UUID = Depends(get_current_user_id),
    service: UserService = Depends(_get_user_service),
) -> None:
    try:
        await service.delete_account(user_id, data.password)
    except DomainError as e:
        raise HTTPException(status_code=401, detail=e.message) from e


@router.get("/me/export", response_model=UserExport)
async def export_data(
    user_id: UUID = Depends(get_current_user_id),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
) -> UserExport:
    from sqlalchemy import func, select

    from src.models.application import Application
    from src.models.favorite import Favorite
    from src.models.search_history import SearchHistory
    from src.repositories.preference_repository import PreferenceRepository

    profile = await service.get_profile(user_id)

    pref_repo = PreferenceRepository(db)
    pref = await pref_repo.get_by_user_id(user_id)
    pref_data = None
    if pref:
        pref_data = {
            "modalities": pref.modalities or [],
            "locations": pref.locations or [],
            "seniority_levels": pref.seniority_levels or [],
            "keywords": pref.keywords or [],
            "alert_frequency": pref.alert_frequency,
            "alerts_enabled": pref.alerts_enabled,
        }

    fav_count = (await db.execute(select(func.count()).select_from(Favorite).where(Favorite.user_id == user_id))).scalar() or 0
    app_count = (await db.execute(select(func.count()).select_from(Application).where(Application.user_id == user_id))).scalar() or 0
    search_count = (await db.execute(select(func.count()).select_from(SearchHistory).where(SearchHistory.user_id == user_id))).scalar() or 0

    return UserExport(
        profile=profile,
        preferences=pref_data,
        favorites_count=fav_count,
        applications_count=app_count,
        search_history_count=search_count,
    )
