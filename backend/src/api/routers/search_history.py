from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user_id
from src.repositories.search_history_repository import SearchHistoryRepository
from src.services.search_history_service import SearchHistoryService

router = APIRouter(prefix="/api/v1/users/me/search-history", tags=["search-history"])


def _get_service(db: AsyncSession = Depends(get_db)) -> SearchHistoryService:
    return SearchHistoryService(SearchHistoryRepository(db))


@router.get("")
async def get_recent(
    user_id: UUID = Depends(get_current_user_id),
    service: SearchHistoryService = Depends(_get_service),
) -> list[dict]:  # type: ignore[type-arg]
    entries = await service.get_recent(user_id)
    return [{"id": str(e.id), "query": e.query, "filters": e.filters, "created_at": str(e.created_at)} for e in entries]


@router.delete("", status_code=204)
async def clear_history(
    user_id: UUID = Depends(get_current_user_id),
    service: SearchHistoryService = Depends(_get_service),
) -> None:
    await service.clear(user_id)
