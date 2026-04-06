"""Testes unitarios para JobSearchService."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

import pytest

from src.schemas.job import JobFilters
from src.schemas.pagination import PaginationParams
from src.services.job_search_service import JobSearchService


class FakeJobForSearch:
    def __init__(self, **kwargs: Any) -> None:
        self.id: UUID = kwargs.get("id", uuid.uuid4())
        self.title: str = kwargs.get("title", "Job")
        self.company: str = kwargs.get("company", "Co")
        self.description: str = kwargs.get("description", "desc")
        self.requirements: str | None = kwargs.get("requirements")
        self.location: str | None = kwargs.get("location")
        self.city: str | None = kwargs.get("city")
        self.state: str | None = kwargs.get("state")
        self.country: str | None = kwargs.get("country")
        self.modality: str | None = kwargs.get("modality")
        self.seniority: str | None = kwargs.get("seniority")
        self.salary_min: int | None = kwargs.get("salary_min")
        self.salary_max: int | None = kwargs.get("salary_max")
        self.salary_text: str | None = kwargs.get("salary_text")
        self.url: str = kwargs.get("url", "https://example.com")
        self.published_at: datetime | None = kwargs.get("published_at")
        self.is_active: bool = kwargs.get("is_active", True)
        self.created_at: datetime = kwargs.get("created_at", datetime.now(UTC))


class FakeSearchRepo:
    def __init__(self, jobs: list[FakeJobForSearch] | None = None) -> None:
        self._jobs = jobs or []

    async def search(
        self,
        query: str | None,
        filters: JobFilters,
        sort: str,
        order: str,
        offset: int,
        limit: int,
    ) -> tuple[list[FakeJobForSearch], int]:
        result = self._jobs
        if filters.modality:
            result = [j for j in result if j.modality in filters.modality]
        return result[offset : offset + limit], len(result)

    async def get_by_id(self, job_id: UUID) -> FakeJobForSearch | None:
        for j in self._jobs:
            if j.id == job_id:
                return j
        return None


class TestJobSearchService:
    async def test_search_should_return_paginated_results(self) -> None:
        jobs = [FakeJobForSearch(title=f"Job {i}") for i in range(5)]
        service = JobSearchService(FakeSearchRepo(jobs))
        result = await service.search(None, JobFilters(), offset=0, limit=3)
        assert len(result.data) == 3
        assert result.pagination.total == 5

    async def test_search_with_filters_should_combine(self) -> None:
        jobs = [
            FakeJobForSearch(modality="remoto"),
            FakeJobForSearch(modality="presencial"),
            FakeJobForSearch(modality="remoto"),
        ]
        service = JobSearchService(FakeSearchRepo(jobs))
        result = await service.search(None, JobFilters(modality=["remoto"]))
        assert len(result.data) == 2

    async def test_get_by_id_should_return_detail(self) -> None:
        job = FakeJobForSearch(title="Specific Job", description="Details here")
        service = JobSearchService(FakeSearchRepo([job]))
        detail = await service.get_by_id(job.id)
        assert detail.title == "Specific Job"
        assert detail.description == "Details here"

    async def test_get_by_id_should_raise_when_not_found(self) -> None:
        service = JobSearchService(FakeSearchRepo())
        with pytest.raises(ValueError, match="not found"):
            await service.get_by_id(uuid.uuid4())


class TestPaginationParams:
    def test_pagination_params_should_enforce_limits(self) -> None:
        params = PaginationParams(offset=0, limit=50)
        assert params.limit == 50

        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            PaginationParams(limit=51)

        with pytest.raises(ValidationError):
            PaginationParams(offset=-1)
