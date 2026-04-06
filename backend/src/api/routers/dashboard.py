from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user_id
from src.repositories.dashboard_repository import DashboardRepository
from src.services.dashboard_service import DashboardResponse, DashboardService

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


def _get_dashboard_service(db: AsyncSession = Depends(get_db)) -> DashboardService:
    return DashboardService(DashboardRepository(db))


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    user_id: UUID = Depends(get_current_user_id),
    service: DashboardService = Depends(_get_dashboard_service),
) -> DashboardResponse:
    return await service.get_dashboard(user_id)
