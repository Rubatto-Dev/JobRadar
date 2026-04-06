"""Testes unitarios para AdminService."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from src.schemas.admin import SourceUpdate
from src.services.admin_service import AdminService


class FakeSource:
    def __init__(self, **kwargs: Any) -> None:
        self.id: UUID = kwargs.get("id", uuid.uuid4())
        self.name: str = kwargs.get("name", "Gupy")
        self.slug: str = kwargs.get("slug", "gupy")
        self.is_active: bool = kwargs.get("is_active", True)
        self.last_collected_at: datetime | None = kwargs.get("last_collected_at")
        self.last_error: str | None = kwargs.get("last_error")
        self.collection_interval_minutes: int = kwargs.get("collection_interval_minutes", 120)
        self.total_jobs: int = kwargs.get("total_jobs", 0)


class FakeAdminUser:
    def __init__(self, **kwargs: Any) -> None:
        self.id: UUID = kwargs.get("id", uuid.uuid4())
        self.email: str = kwargs.get("email", "user@example.com")
        self.name: str = kwargs.get("name", "User")
        self.is_active: bool = kwargs.get("is_active", True)
        self.is_admin: bool = kwargs.get("is_admin", False)
        self.email_verified: bool = kwargs.get("email_verified", True)
        self.created_at: datetime = kwargs.get("created_at", datetime.now(UTC))


class FakeAdminRepo:
    def __init__(
        self,
        metrics: dict[str, int] | None = None,
        sources: list[FakeSource] | None = None,
        users: list[FakeAdminUser] | None = None,
    ) -> None:
        self._metrics = metrics or {}
        self._sources = {s.id: s for s in (sources or [])}
        self._users = {u.id: u for u in (users or [])}

    async def get_metrics(self) -> dict[str, int]:
        return self._metrics

    async def list_sources(self) -> list[FakeSource]:
        return list(self._sources.values())

    async def update_source(self, source_id: UUID, **kwargs: Any) -> FakeSource:
        s = self._sources[source_id]
        for k, v in kwargs.items():
            setattr(s, k, v)
        return s

    async def list_users(
        self, search: str | None, is_active: bool | None, offset: int, limit: int
    ) -> tuple[list[FakeAdminUser], int]:
        users = list(self._users.values())
        return users[offset : offset + limit], len(users)

    async def update_user(self, user_id: UUID, **kwargs: Any) -> FakeAdminUser:
        u = self._users[user_id]
        for k, v in kwargs.items():
            setattr(u, k, v)
        return u


class TestAdminService:
    async def test_admin_metrics_should_return_aggregated_data(self) -> None:
        repo = FakeAdminRepo(metrics={"total_users": 100, "total_jobs_active": 500})
        service = AdminService(repo)
        result = await service.get_metrics()
        assert result.total_users == 100
        assert result.total_jobs_active == 500

    async def test_admin_sources_should_show_status(self) -> None:
        sources = [FakeSource(name="Gupy", is_active=True), FakeSource(name="Remotive", is_active=False)]
        repo = FakeAdminRepo(sources=sources)
        service = AdminService(repo)
        result = await service.list_sources()
        assert len(result) == 2
        assert result[0].name == "Gupy"

    async def test_update_source_should_toggle_active(self) -> None:
        source = FakeSource(is_active=True)
        repo = FakeAdminRepo(sources=[source])
        service = AdminService(repo)
        result = await service.update_source(source.id, SourceUpdate(is_active=False))
        assert result.is_active is False

    async def test_update_source_should_change_interval(self) -> None:
        source = FakeSource(collection_interval_minutes=120)
        repo = FakeAdminRepo(sources=[source])
        service = AdminService(repo)
        result = await service.update_source(source.id, SourceUpdate(collection_interval_minutes=60))
        assert result.collection_interval_minutes == 60

    async def test_admin_list_users_should_paginate(self) -> None:
        users = [FakeAdminUser(name=f"User {i}") for i in range(5)]
        repo = FakeAdminRepo(users=users)
        service = AdminService(repo)
        result = await service.list_users(offset=0, limit=3)
        assert len(result.data) == 3
        assert result.pagination.total == 5
