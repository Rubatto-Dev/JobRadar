from __future__ import annotations

from typing import Any, Protocol
from uuid import UUID

from pydantic import BaseModel


class DashboardResponse(BaseModel):
    new_jobs_24h: int = 0
    favorites_count: int = 0
    active_applications: int = 0
    applications_by_status: dict[str, int] = {}
    recommended_jobs: list[dict[str, Any]] = []


class DashboardRepoProtocol(Protocol):
    async def count_new_jobs_24h(self) -> int: ...
    async def count_favorites(self, user_id: UUID) -> int: ...
    async def count_applications_by_status(self, user_id: UUID) -> dict[str, int]: ...
    async def get_recommended_jobs(self, user_id: UUID, limit: int = 5) -> list[Any]: ...


class DashboardService:
    def __init__(self, repo: DashboardRepoProtocol) -> None:
        self._repo = repo

    async def get_dashboard(self, user_id: UUID) -> DashboardResponse:
        new_jobs = await self._repo.count_new_jobs_24h()
        favs = await self._repo.count_favorites(user_id)
        app_by_status = await self._repo.count_applications_by_status(user_id)
        active_apps = sum(v for k, v in app_by_status.items() if k not in ("approved", "rejected"))
        recommended = await self._repo.get_recommended_jobs(user_id, limit=5)

        return DashboardResponse(
            new_jobs_24h=new_jobs,
            favorites_count=favs,
            active_applications=active_apps,
            applications_by_status=app_by_status,
            recommended_jobs=[{"id": str(j.id), "title": j.title, "company": j.company} for j in recommended],
        )
