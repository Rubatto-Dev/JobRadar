"""Fake implementations for unit tests."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any
from uuid import UUID


class FakeUser:
    """Minimal fake User for unit tests."""

    def __init__(self, **kwargs: Any) -> None:
        self.id: UUID = kwargs.get("id", uuid.uuid4())
        self.email: str = kwargs.get("email", "test@example.com")
        self.name: str = kwargs.get("name", "Test User")
        self.password_hash: str | None = kwargs.get("password_hash")
        self.is_active: bool = kwargs.get("is_active", True)
        self.is_admin: bool = kwargs.get("is_admin", False)
        self.email_verified: bool = kwargs.get("email_verified", True)
        self.locale: str = kwargs.get("locale", "pt-br")
        self.lgpd_consent_at: datetime | None = kwargs.get("lgpd_consent_at")
        self.google_id: str | None = kwargs.get("google_id")
        self.avatar_url: str | None = kwargs.get("avatar_url")
        self.location: str | None = kwargs.get("location")
        self.created_at: datetime = kwargs.get("created_at", datetime.now(UTC))
        self.updated_at: datetime = kwargs.get("updated_at", datetime.now(UTC))


class FakeUserRepository:
    def __init__(self, users: list[FakeUser] | None = None) -> None:
        self._users: dict[UUID, FakeUser] = {}
        for user in users or []:
            self._users[user.id] = user

    async def get_by_email(self, email: str) -> FakeUser | None:
        for user in self._users.values():
            if user.email == email:
                return user
        return None

    async def get_by_id(self, user_id: UUID) -> FakeUser | None:
        return self._users.get(user_id)

    async def create(self, **kwargs: Any) -> FakeUser:
        user = FakeUser(**kwargs)
        self._users[user.id] = user
        return user

    async def update(self, user_id: UUID, **kwargs: Any) -> FakeUser:
        user = self._users[user_id]
        for key, value in kwargs.items():
            setattr(user, key, value)
        return user

    async def delete(self, user_id: UUID) -> None:
        self._users.pop(user_id, None)


class FakeRedis:
    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        self._store[key] = value

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def exists(self, key: str) -> bool:
        return key in self._store


class FakeEmail:
    def __init__(self) -> None:
        self.sent: list[dict[str, str]] = []

    async def send_verification_email(self, email: str, token: str) -> None:
        self.sent.append({"type": "verification", "email": email, "token": token})

    async def send_reset_password_email(self, email: str, token: str) -> None:
        self.sent.append({"type": "reset", "email": email, "token": token})


class FakeArea:
    """Minimal fake Area for unit tests."""

    def __init__(self, **kwargs: Any) -> None:
        self.id: UUID = kwargs.get("id", uuid.uuid4())
        self.name_pt: str = kwargs.get("name_pt", "Tecnologia")
        self.name_en: str | None = kwargs.get("name_en", "Technology")
        self.slug: str = kwargs.get("slug", "tecnologia")
        self.is_active: bool = kwargs.get("is_active", True)


class FakeAreaRepository:
    def __init__(self, areas: list[FakeArea] | None = None) -> None:
        self._areas: dict[UUID, FakeArea] = {}
        for area in areas or []:
            self._areas[area.id] = area

    async def list_active(self) -> list[FakeArea]:
        return [a for a in self._areas.values() if a.is_active]

    async def get_by_id(self, area_id: UUID) -> FakeArea | None:
        return self._areas.get(area_id)

    async def create(self, **kwargs: Any) -> FakeArea:
        area = FakeArea(**kwargs)
        self._areas[area.id] = area
        return area

    async def update(self, area_id: UUID, **kwargs: Any) -> FakeArea:
        area = self._areas[area_id]
        for key, value in kwargs.items():
            setattr(area, key, value)
        return area


class FakeJobSource:
    def __init__(self, **kwargs: Any) -> None:
        self.id: UUID = kwargs.get("id", uuid.uuid4())
        self.slug: str = kwargs.get("slug", "test-source")
        self.config: dict[str, Any] | None = kwargs.get("config")
        self.total_jobs: int = kwargs.get("total_jobs", 0)
        self.last_collected_at: datetime | None = kwargs.get("last_collected_at")


class FakeJob:
    def __init__(self, **kwargs: Any) -> None:
        self.id: UUID = kwargs.get("id", uuid.uuid4())
        self.fingerprint: str = kwargs.get("fingerprint", "")


class FakeJobRepository:
    def __init__(self) -> None:
        self._jobs: dict[str, FakeJob] = {}

    async def exists_by_fingerprint(self, fingerprint: str) -> bool:
        return fingerprint in self._jobs

    async def create(self, **kwargs: Any) -> FakeJob:
        job = FakeJob(**kwargs)
        self._jobs[kwargs.get("fingerprint", "")] = job
        return job


class FakeSourceRepository:
    def __init__(self, sources: list[FakeJobSource] | None = None) -> None:
        self._sources: dict[UUID, FakeJobSource] = {}
        for s in sources or []:
            self._sources[s.id] = s

    async def get_by_id(self, source_id: UUID) -> FakeJobSource | None:
        return self._sources.get(source_id)

    async def update(self, source_id: UUID, **kwargs: Any) -> FakeJobSource:
        source = self._sources[source_id]
        for key, value in kwargs.items():
            setattr(source, key, value)
        return source


class FakeAdapter:
    def __init__(self, slug: str, jobs: list[Any] | None = None) -> None:
        self.source_slug = slug
        self._jobs = jobs or []

    async def collect(self, config: dict[str, Any]) -> list[Any]:
        return self._jobs
