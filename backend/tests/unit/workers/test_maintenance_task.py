"""Testes para logica de expiracao de vagas."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any


class FakeJobRepositoryWithExpiry:
    """Fake que simula expire via update."""

    def __init__(self) -> None:
        self._jobs: list[dict[str, Any]] = []

    def add(self, is_active: bool, updated_at: datetime) -> None:
        self._jobs.append({"is_active": is_active, "updated_at": updated_at})

    def count_active(self) -> int:
        return sum(1 for j in self._jobs if j["is_active"])

    def expire_stale(self, days: int = 30) -> int:
        cutoff = datetime.now(UTC) - timedelta(days=days)
        count = 0
        for job in self._jobs:
            if job["is_active"] and job["updated_at"] < cutoff:
                job["is_active"] = False
                count += 1
        return count


class TestExpireStaleJobs:
    def test_expire_stale_jobs_should_deactivate_old_jobs(self) -> None:
        repo = FakeJobRepositoryWithExpiry()
        repo.add(is_active=True, updated_at=datetime.now(UTC) - timedelta(days=45))
        repo.add(is_active=True, updated_at=datetime.now(UTC) - timedelta(days=31))

        count = repo.expire_stale(days=30)
        assert count == 2
        assert repo.count_active() == 0

    def test_expire_stale_jobs_should_keep_recent_jobs(self) -> None:
        repo = FakeJobRepositoryWithExpiry()
        repo.add(is_active=True, updated_at=datetime.now(UTC) - timedelta(days=5))
        repo.add(is_active=True, updated_at=datetime.now(UTC) - timedelta(days=29))
        repo.add(is_active=True, updated_at=datetime.now(UTC) - timedelta(days=45))

        count = repo.expire_stale(days=30)
        assert count == 1
        assert repo.count_active() == 2
