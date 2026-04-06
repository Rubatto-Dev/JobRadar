from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Protocol
from uuid import UUID

import structlog

from src.protocols.job_source import (
    CollectionResult,
    JobSourceAdapterProtocol,
    generate_fingerprint,
)

logger = structlog.get_logger()


class JobRepoProtocol(Protocol):
    async def exists_by_fingerprint(self, fingerprint: str) -> bool: ...
    async def create(self, **kwargs: Any) -> Any: ...


class SourceRepoProtocol(Protocol):
    async def get_by_id(self, source_id: UUID) -> Any: ...
    async def update(self, source_id: UUID, **kwargs: Any) -> Any: ...


class CollectionService:
    def __init__(
        self,
        job_repo: JobRepoProtocol,
        source_repo: SourceRepoProtocol,
        adapters: dict[str, JobSourceAdapterProtocol] | None = None,
    ) -> None:
        self._job_repo = job_repo
        self._source_repo = source_repo
        self._adapters = adapters or {}

    def register_adapter(self, adapter: JobSourceAdapterProtocol) -> None:
        self._adapters[adapter.source_slug] = adapter

    async def collect_from_source(self, source_id: UUID) -> CollectionResult:
        source = await self._source_repo.get_by_id(source_id)
        if source is None:
            msg = f"Source {source_id} not found"
            raise ValueError(msg)

        adapter = self._adapters.get(source.slug)
        if adapter is None:
            msg = f"No adapter registered for slug '{source.slug}'"
            raise ValueError(msg)

        config = source.config or {}
        raw_jobs = await adapter.collect(config)

        new_jobs = 0
        duplicates = 0
        errors = 0

        for raw_job in raw_jobs:
            try:
                fingerprint = generate_fingerprint(raw_job.title, raw_job.company, raw_job.location)
                if await self._job_repo.exists_by_fingerprint(fingerprint):
                    duplicates += 1
                    continue

                await self._job_repo.create(
                    external_id=raw_job.external_id,
                    source_id=source_id,
                    title=raw_job.title,
                    company=raw_job.company,
                    description=raw_job.description,
                    requirements=raw_job.requirements,
                    location=raw_job.location,
                    city=raw_job.city,
                    state=raw_job.state,
                    country=raw_job.country,
                    modality=raw_job.modality,
                    seniority=raw_job.seniority,
                    salary_min=raw_job.salary_min,
                    salary_max=raw_job.salary_max,
                    salary_text=raw_job.salary_text,
                    url=raw_job.url,
                    published_at=raw_job.published_at,
                    raw_data=raw_job.raw_data,
                    fingerprint=fingerprint,
                )
                new_jobs += 1
            except Exception:  # noqa: BLE001, S110
                errors += 1
                await logger.awarning("Failed to persist job", external_id=raw_job.external_id)

        await self._source_repo.update(
            source_id,
            last_collected_at=datetime.now(UTC),
            total_jobs=(source.total_jobs or 0) + new_jobs,
        )

        result = CollectionResult(
            source_slug=source.slug,
            total_fetched=len(raw_jobs),
            new_jobs=new_jobs,
            duplicates_skipped=duplicates,
            errors=errors,
        )
        await logger.ainfo("Collection complete", **vars(result))
        return result
