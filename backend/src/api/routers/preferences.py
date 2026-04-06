from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user_id
from src.repositories.area_repository import AreaRepository
from src.repositories.preference_repository import PreferenceRepository
from src.schemas.preference import PreferenceResponse, PreferenceUpdate
from src.services.preference_service import PreferenceService

router = APIRouter(prefix="/api/v1/users/me/preferences", tags=["preferences"])


def _get_pref_service(db: AsyncSession = Depends(get_db)) -> PreferenceService:
    return PreferenceService(PreferenceRepository(db), AreaRepository(db))


@router.get("", response_model=PreferenceResponse)
async def get_preferences(
    user_id: UUID = Depends(get_current_user_id),
    service: PreferenceService = Depends(_get_pref_service),
) -> PreferenceResponse:
    return await service.get(user_id)


@router.put("", response_model=PreferenceResponse)
async def upsert_preferences(
    data: PreferenceUpdate,
    user_id: UUID = Depends(get_current_user_id),
    service: PreferenceService = Depends(_get_pref_service),
) -> PreferenceResponse:
    try:
        return await service.upsert(user_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
