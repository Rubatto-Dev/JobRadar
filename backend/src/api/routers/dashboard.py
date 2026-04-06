from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends

from src.core.dependencies import get_current_user_id
from src.services.dashboard_service import DashboardResponse

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(user_id: UUID = Depends(get_current_user_id)) -> DashboardResponse:
    # Placeholder - will wire to real repo when DB integration tests are ready
    return DashboardResponse()
