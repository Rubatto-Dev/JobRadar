"""Testes unitarios para DashboardService."""

from __future__ import annotations

import uuid
from typing import Any
from uuid import UUID

from src.services.dashboard_service import DashboardService


class FakeJobObj:
    def __init__(self, **kwargs: Any) -> None:
        self.id: UUID = kwargs.get("id", uuid.uuid4())
        self.title: str = kwargs.get("title", "Job")
        self.company: str = kwargs.get("company", "Co")


class FakeDashboardRepo:
    def __init__(
        self,
        new_jobs: int = 0,
        favs: int = 0,
        apps_by_status: dict[str, int] | None = None,
        recommended: list[FakeJobObj] | None = None,
    ) -> None:
        self._new_jobs = new_jobs
        self._favs = favs
        self._apps = apps_by_status or {}
        self._recommended = recommended or []

    async def count_new_jobs_24h(self) -> int:
        return self._new_jobs

    async def count_favorites(self, user_id: UUID) -> int:
        return self._favs

    async def count_applications_by_status(self, user_id: UUID) -> dict[str, int]:
        return self._apps

    async def get_recommended_jobs(self, user_id: UUID, limit: int = 5) -> list[FakeJobObj]:
        return self._recommended[:limit]


class TestDashboardService:
    async def test_dashboard_should_return_new_jobs_count_24h(self) -> None:
        repo = FakeDashboardRepo(new_jobs=42)
        service = DashboardService(repo)
        result = await service.get_dashboard(uuid.uuid4())
        assert result.new_jobs_24h == 42

    async def test_dashboard_should_return_applications_by_status(self) -> None:
        repo = FakeDashboardRepo(apps_by_status={"applied": 3, "interview": 1, "rejected": 2})
        service = DashboardService(repo)
        result = await service.get_dashboard(uuid.uuid4())
        assert result.applications_by_status == {"applied": 3, "interview": 1, "rejected": 2}
        assert result.active_applications == 4

    async def test_dashboard_should_return_recommended_jobs(self) -> None:
        jobs = [FakeJobObj(title=f"Job {i}") for i in range(3)]
        repo = FakeDashboardRepo(recommended=jobs)
        service = DashboardService(repo)
        result = await service.get_dashboard(uuid.uuid4())
        assert len(result.recommended_jobs) == 3
