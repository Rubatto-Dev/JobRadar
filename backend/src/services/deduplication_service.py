from __future__ import annotations

from typing import Protocol

from src.protocols.job_source import generate_fingerprint


class JobRepoProtocol(Protocol):
    async def exists_by_fingerprint(self, fingerprint: str) -> bool: ...


class DeduplicationService:
    def __init__(self, job_repo: JobRepoProtocol) -> None:
        self._job_repo = job_repo

    def generate_fingerprint(self, title: str, company: str, location: str | None) -> str:
        return generate_fingerprint(title, company, location)

    async def is_duplicate(self, fingerprint: str) -> bool:
        return await self._job_repo.exists_by_fingerprint(fingerprint)
