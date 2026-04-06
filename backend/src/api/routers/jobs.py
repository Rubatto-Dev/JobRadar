from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.schemas.job import JobDetail, JobFilters, JobSummary
from src.schemas.pagination import PaginatedResponse

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


@router.get("", response_model=PaginatedResponse[JobSummary])
async def search_jobs(
    q: str | None = Query(None, description="Full-text search query"),
    modality: list[str] | None = Query(None),
    seniority: list[str] | None = Query(None),
    location: str | None = Query(None),
    salary_min: int | None = Query(None, ge=0),
    salary_max: int | None = Query(None, ge=0),
    source: str | None = Query(None),
    published_after: date | None = Query(None),
    sort: str = Query("relevance", pattern=r"^(relevance|date|salary)$"),
    order: str = Query("desc", pattern=r"^(asc|desc)$"),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[JobSummary]:
    from src.repositories.job_repository import JobRepository
    from src.services.job_search_service import JobSearchService

    filters = JobFilters(
        modality=modality,
        seniority=seniority,
        location=location,
        salary_min=salary_min,
        salary_max=salary_max,
        source=source,
        published_after=published_after,
    )
    service = JobSearchService(JobRepository(db))
    return await service.search(q, filters, sort, order, offset, limit)


@router.get("/{job_id}", response_model=JobDetail)
async def get_job(job_id: UUID, db: AsyncSession = Depends(get_db)) -> JobDetail:
    from src.repositories.job_repository import JobRepository
    from src.services.job_search_service import JobSearchService

    service = JobSearchService(JobRepository(db))
    try:
        return await service.get_by_id(job_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
