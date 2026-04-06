"""Testes unitarios para PreferenceService."""

from __future__ import annotations

import uuid
from typing import Any
from uuid import UUID

import pytest

from src.schemas.preference import PreferenceUpdate
from src.services.preference_service import PreferenceService
from tests.fakes import FakeArea, FakeAreaRepository


class FakePreference:
    def __init__(self, **kwargs: Any) -> None:
        self.id: UUID = kwargs.get("id", uuid.uuid4())
        self.user_id: UUID = kwargs.get("user_id", uuid.uuid4())
        self.modalities: list[str] | None = kwargs.get("modalities")
        self.locations: list[str] | None = kwargs.get("locations")
        self.seniority_levels: list[str] | None = kwargs.get("seniority_levels")
        self.keywords: list[str] | None = kwargs.get("keywords")
        self.salary_min: int | None = kwargs.get("salary_min")
        self.salary_max: int | None = kwargs.get("salary_max")
        self.alert_frequency: str = kwargs.get("alert_frequency", "daily")
        self.alerts_enabled: bool = kwargs.get("alerts_enabled", True)


class FakePreferenceRepository:
    def __init__(self, prefs: list[FakePreference] | None = None) -> None:
        self._prefs: dict[UUID, FakePreference] = {}
        for p in prefs or []:
            self._prefs[p.user_id] = p

    async def get_by_user_id(self, user_id: UUID) -> FakePreference | None:
        return self._prefs.get(user_id)

    async def create(self, **kwargs: Any) -> FakePreference:
        pref = FakePreference(**kwargs)
        self._prefs[pref.user_id] = pref
        return pref

    async def update(self, pref_id: UUID, **kwargs: Any) -> FakePreference:
        for p in self._prefs.values():
            if p.id == pref_id:
                for k, v in kwargs.items():
                    setattr(p, k, v)
                return p
        msg = "Not found"
        raise ValueError(msg)


class TestPreferenceService:
    async def test_get_preferences_should_return_defaults_when_none(self) -> None:
        service = PreferenceService(FakePreferenceRepository(), FakeAreaRepository())
        result = await service.get(uuid.uuid4())
        assert result.modalities == []
        assert result.alerts_enabled is True

    async def test_upsert_preferences_should_create_when_new(self) -> None:
        user_id = uuid.uuid4()
        service = PreferenceService(FakePreferenceRepository(), FakeAreaRepository())
        data = PreferenceUpdate(modalities=["remoto"], keywords=["python"])
        result = await service.upsert(user_id, data)
        assert result.modalities == ["remoto"]
        assert result.keywords == ["python"]

    async def test_upsert_preferences_should_update_when_existing(self) -> None:
        user_id = uuid.uuid4()
        existing = FakePreference(user_id=user_id, modalities=["presencial"])
        service = PreferenceService(FakePreferenceRepository([existing]), FakeAreaRepository())
        data = PreferenceUpdate(modalities=["remoto"])
        result = await service.upsert(user_id, data)
        assert result.modalities == ["remoto"]

    async def test_upsert_preferences_should_validate_area_ids(self) -> None:
        active_area = FakeArea(name_pt="Tech", is_active=True)
        service = PreferenceService(FakePreferenceRepository(), FakeAreaRepository([active_area]))
        bad_id = uuid.uuid4()
        data = PreferenceUpdate(area_ids=[bad_id])
        with pytest.raises(ValueError, match="Invalid area IDs"):
            await service.upsert(uuid.uuid4(), data)
