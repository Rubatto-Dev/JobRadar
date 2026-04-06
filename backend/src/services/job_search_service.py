from __future__ import annotations

from typing import Any, Protocol
from uuid import UUID

from src.schemas.job import JobDetail, JobFilters, JobSummary
from src.schemas.pagination import PaginatedResponse, PaginationInfo


class JobSearchRepoProtocol(Protocol):
    async def search(
        self,
        query: str | None,
        filters: JobFilters,
        sort: str,
        order: str,
        offset: int,
        limit: int,
    ) -> tuple[list[Any], int]: ...

    async def get_by_id(self, job_id: UUID) -> Any: ...


class JobSearchService:
    def __init__(self, job_repo: JobSearchRepoProtocol) -> None:
        self._job_repo = job_repo

    async def search(
        self,
        query: str | None,
        filters: JobFilters,
        sort: str = "relevance",
        order: str = "desc",
        offset: int = 0,
        limit: int = 20,
        user_id: UUID | None = None,
    ) -> PaginatedResponse[JobSummary]:
        jobs, total = await self._job_repo.search(query, filters, sort, order, offset, limit)

        summaries = [
            JobSummary(
                id=j.id,
                title=j.title,
                company=j.company,
                location=j.location,
                modality=j.modality,
                seniority=j.seniority,
                salary_text=j.salary_text,
                url=j.url,
                published_at=j.published_at,
                is_active=j.is_active,
            )
            for j in jobs
        ]

        return PaginatedResponse[JobSummary](
            data=summaries,
            pagination=PaginationInfo(offset=offset, limit=limit, total=total),
        )

    async def get_by_id(self, job_id: UUID, user_id: UUID | None = None) -> JobDetail:
        job = await self._job_repo.get_by_id(job_id)
        if job is None:
            msg = f"Job {job_id} not found"
            raise ValueError(msg)

        return JobDetail(
            id=job.id,
            title=job.title,
            company=job.company,
            description=job.description,
            requirements=job.requirements,
            location=job.location,
            city=job.city,
            state=job.state,
            country=job.country,
            modality=job.modality,
            seniority=job.seniority,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            salary_text=job.salary_text,
            url=job.url,
            published_at=job.published_at,
            is_active=job.is_active,
            created_at=job.created_at,
        )
