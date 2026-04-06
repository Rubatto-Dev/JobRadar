"""Testes unitarios para ApplicationService."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

import pytest

from src.schemas.application import ApplicationUpdate
from src.services.application_service import AlreadyAppliedError, ApplicationService


class FakeApp:
    def __init__(self, **kwargs: Any) -> None:
        self.id: UUID = kwargs.get("id", uuid.uuid4())
        self.user_id: UUID = kwargs.get("user_id", uuid.uuid4())
        self.job_id: UUID = kwargs.get("job_id", uuid.uuid4())
        self.status: str = kwargs.get("status", "applied")
        self.notes: str | None = kwargs.get("notes")
        self.applied_at: datetime = kwargs.get("applied_at", datetime.now(UTC))
        self.updated_at: datetime = kwargs.get("updated_at", datetime.now(UTC))


class FakeAppRepo:
    def __init__(self) -> None:
        self._apps: list[FakeApp] = []

    async def list_by_user(
        self, user_id: UUID, status: str | None = None, offset: int = 0, limit: int = 20
    ) -> tuple[list[FakeApp], int]:
        user_apps = [a for a in self._apps if a.user_id == user_id]
        if status:
            user_apps = [a for a in user_apps if a.status == status]
        return user_apps[offset : offset + limit], len(user_apps)

    async def get_by_user_and_job(self, user_id: UUID, job_id: UUID) -> FakeApp | None:
        for a in self._apps:
            if a.user_id == user_id and a.job_id == job_id:
                return a
        return None

    async def get_by_id_and_user(self, app_id: UUID, user_id: UUID) -> FakeApp | None:
        for a in self._apps:
            if a.id == app_id and a.user_id == user_id:
                return a
        return None

    async def create(self, **kwargs: Any) -> FakeApp:
        app = FakeApp(**kwargs)
        self._apps.append(app)
        return app

    async def update(self, app_id: UUID, user_id: UUID, **kwargs: Any) -> FakeApp | None:
        app = await self.get_by_id_and_user(app_id, user_id)
        if app is None:
            return None
        for k, v in kwargs.items():
            setattr(app, k, v)
        return app

    async def delete(self, app_id: UUID, user_id: UUID) -> bool:
        for i, a in enumerate(self._apps):
            if a.id == app_id and a.user_id == user_id:
                self._apps.pop(i)
                return True
        return False

    async def list_all_by_user(self, user_id: UUID) -> list[FakeApp]:
        return [a for a in self._apps if a.user_id == user_id]


class TestApplicationService:
    async def test_create_application_should_set_status_applied(self) -> None:
        service = ApplicationService(FakeAppRepo())
        result = await service.create(uuid.uuid4(), uuid.uuid4())
        assert result.status == "applied"

    async def test_create_application_when_duplicate_should_raise(self) -> None:
        repo = FakeAppRepo()
        service = ApplicationService(repo)
        user_id, job_id = uuid.uuid4(), uuid.uuid4()
        await service.create(user_id, job_id)
        with pytest.raises(AlreadyAppliedError):
            await service.create(user_id, job_id)

    async def test_update_application_should_change_status(self) -> None:
        repo = FakeAppRepo()
        service = ApplicationService(repo)
        user_id = uuid.uuid4()
        created = await service.create(user_id, uuid.uuid4())
        updated = await service.update(user_id, created.id, ApplicationUpdate(status="interview"))
        assert updated.status == "interview"

    async def test_list_applications_should_filter_by_status(self) -> None:
        repo = FakeAppRepo()
        service = ApplicationService(repo)
        user_id = uuid.uuid4()
        await service.create(user_id, uuid.uuid4())
        created2 = await service.create(user_id, uuid.uuid4())
        await service.update(user_id, created2.id, ApplicationUpdate(status="interview"))
        result = await service.list(user_id, status="interview")
        assert len(result.data) == 1

    async def test_export_csv_should_return_valid_csv(self) -> None:
        repo = FakeAppRepo()
        service = ApplicationService(repo)
        user_id = uuid.uuid4()
        await service.create(user_id, uuid.uuid4(), notes="First app")
        csv = await service.export_csv(user_id)
        assert "status" in csv
        assert "applied" in csv
        assert "First app" in csv

    async def test_update_when_other_user_should_raise(self) -> None:
        repo = FakeAppRepo()
        service = ApplicationService(repo)
        user_id = uuid.uuid4()
        created = await service.create(user_id, uuid.uuid4())
        with pytest.raises(ValueError, match="not found"):
            await service.update(uuid.uuid4(), created.id, ApplicationUpdate(status="interview"))

    async def test_delete_when_other_user_should_raise(self) -> None:
        repo = FakeAppRepo()
        service = ApplicationService(repo)
        user_id = uuid.uuid4()
        created = await service.create(user_id, uuid.uuid4())
        with pytest.raises(ValueError, match="not found"):
            await service.delete(uuid.uuid4(), created.id)
