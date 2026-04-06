from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user_id
from src.repositories.preference_repository import PreferenceRepository
from src.schemas.alert import AlertSettings, AlertSettingsUpdate

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


@router.get("/settings", response_model=AlertSettings)
async def get_alert_settings(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> AlertSettings:
    repo = PreferenceRepository(db)
    pref = await repo.get_by_user_id(user_id)
    if pref is None:
        return AlertSettings()
    return AlertSettings(alert_frequency=pref.alert_frequency, alerts_enabled=pref.alerts_enabled)


@router.put("/settings", response_model=AlertSettings)
async def update_alert_settings(
    data: AlertSettingsUpdate,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> AlertSettings:
    repo = PreferenceRepository(db)
    pref = await repo.get_by_user_id(user_id)
    if pref is None:
        pref = await repo.create(user_id=user_id, **data.model_dump(exclude_unset=True))
    else:
        update_data = data.model_dump(exclude_unset=True)
        if update_data:
            pref = await repo.update(pref.id, **update_data)
    return AlertSettings(alert_frequency=pref.alert_frequency, alerts_enabled=pref.alerts_enabled)
