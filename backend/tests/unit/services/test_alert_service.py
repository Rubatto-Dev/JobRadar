"""Testes unitarios para AlertService."""

from __future__ import annotations

import uuid
from typing import Any
from uuid import UUID

from src.services.alert_service import AlertService
from tests.fakes import FakeEmail


class FakeJobObj:
    def __init__(self, **kwargs: Any) -> None:
        self.id: UUID = kwargs.get("id", uuid.uuid4())
        self.title: str = kwargs.get("title", "Job")
        self.modality: str | None = kwargs.get("modality")
        self.seniority: str | None = kwargs.get("seniority")


class FakePrefObj:
    def __init__(self, **kwargs: Any) -> None:
        self.alerts_enabled: bool = kwargs.get("alerts_enabled", True)
        self.modalities: list[str] | None = kwargs.get("modalities")
        self.seniority_levels: list[str] | None = kwargs.get("seniority_levels")
        self.keywords: list[str] | None = kwargs.get("keywords")
        self.alert_frequency: str = kwargs.get("alert_frequency", "daily")


class FakePrefRepo:
    def __init__(self, pref: FakePrefObj | None = None) -> None:
        self._pref = pref

    async def get_by_user_id(self, user_id: UUID) -> FakePrefObj | None:
        return self._pref


class FakeAlertLogRepo:
    def __init__(self) -> None:
        self.logs: list[dict[str, Any]] = []

    async def create(self, **kwargs: Any) -> Any:
        self.logs.append(kwargs)
        return kwargs


class TestAlertService:
    async def test_match_jobs_should_filter_by_modality(self) -> None:
        pref = FakePrefObj(modalities=["remoto"])
        service = AlertService(FakePrefRepo(pref), FakeAlertLogRepo(), FakeEmail())
        jobs = [FakeJobObj(modality="remoto"), FakeJobObj(modality="presencial")]
        matched = await service.match_jobs_to_user(uuid.uuid4(), jobs)
        assert len(matched) == 1

    async def test_match_jobs_should_filter_by_seniority(self) -> None:
        pref = FakePrefObj(seniority_levels=["senior"])
        service = AlertService(FakePrefRepo(pref), FakeAlertLogRepo(), FakeEmail())
        jobs = [FakeJobObj(seniority="senior"), FakeJobObj(seniority="junior")]
        matched = await service.match_jobs_to_user(uuid.uuid4(), jobs)
        assert len(matched) == 1

    async def test_match_jobs_should_filter_by_keywords(self) -> None:
        pref = FakePrefObj(keywords=["python"])
        service = AlertService(FakePrefRepo(pref), FakeAlertLogRepo(), FakeEmail())
        jobs = [FakeJobObj(title="Python Developer"), FakeJobObj(title="Java Developer")]
        matched = await service.match_jobs_to_user(uuid.uuid4(), jobs)
        assert len(matched) == 1

    async def test_send_alerts_should_skip_opted_out_users(self) -> None:
        pref = FakePrefObj(alerts_enabled=False)
        service = AlertService(FakePrefRepo(pref), FakeAlertLogRepo(), FakeEmail())
        matched = await service.match_jobs_to_user(uuid.uuid4(), [FakeJobObj()])
        assert len(matched) == 0

    async def test_send_alerts_should_log_in_alert_log(self) -> None:
        log_repo = FakeAlertLogRepo()
        service = AlertService(FakePrefRepo(), log_repo, FakeEmail())
        await service.send_alert(uuid.uuid4(), "test@example.com", [FakeJobObj()])
        assert len(log_repo.logs) == 1
        assert log_repo.logs[0]["channel"] == "email"

    async def test_send_alerts_should_not_send_when_no_jobs(self) -> None:
        log_repo = FakeAlertLogRepo()
        email = FakeEmail()
        service = AlertService(FakePrefRepo(), log_repo, email)
        await service.send_alert(uuid.uuid4(), "test@example.com", [])
        assert len(log_repo.logs) == 0
        assert len(email.sent) == 0
