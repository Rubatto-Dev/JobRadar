"""Testes unitarios para CollectionService."""

from __future__ import annotations

from src.protocols.job_source import RawJob
from src.services.collection_service import CollectionService
from tests.fakes import FakeAdapter, FakeJobRepository, FakeJobSource, FakeSourceRepository


def _make_raw_job(**overrides: object) -> RawJob:
    defaults = {
        "external_id": "ext-1",
        "title": "Software Engineer",
        "company": "Acme Corp",
        "description": "Build stuff",
        "url": "https://example.com/job/1",
        "raw_data": {},
    }
    defaults.update(overrides)
    return RawJob(**defaults)  # type: ignore[arg-type]


class TestCollectionService:
    async def test_collection_service_should_persist_new_jobs(self) -> None:
        source = FakeJobSource(slug="test")
        adapter = FakeAdapter("test", [_make_raw_job()])
        job_repo = FakeJobRepository()
        source_repo = FakeSourceRepository([source])

        service = CollectionService(job_repo, source_repo, {"test": adapter})
        result = await service.collect_from_source(source.id)

        assert result.new_jobs == 1
        assert result.total_fetched == 1

    async def test_collection_service_should_skip_duplicates(self) -> None:
        source = FakeJobSource(slug="test")
        jobs = [_make_raw_job(), _make_raw_job()]  # Same title/company = same fingerprint
        adapter = FakeAdapter("test", jobs)
        job_repo = FakeJobRepository()
        source_repo = FakeSourceRepository([source])

        service = CollectionService(job_repo, source_repo, {"test": adapter})
        result = await service.collect_from_source(source.id)

        assert result.new_jobs == 1
        assert result.duplicates_skipped == 1

    async def test_collection_service_should_return_result_summary(self) -> None:
        source = FakeJobSource(slug="test")
        jobs = [
            _make_raw_job(external_id="1", title="Job A"),
            _make_raw_job(external_id="2", title="Job B"),
            _make_raw_job(external_id="3", title="Job A"),  # duplicate of first
        ]
        adapter = FakeAdapter("test", jobs)
        job_repo = FakeJobRepository()
        source_repo = FakeSourceRepository([source])

        service = CollectionService(job_repo, source_repo, {"test": adapter})
        result = await service.collect_from_source(source.id)

        assert result.source_slug == "test"
        assert result.total_fetched == 3
        assert result.new_jobs == 2
        assert result.duplicates_skipped == 1
        assert result.errors == 0

    async def test_collection_service_should_update_source_after_collection(self) -> None:
        source = FakeJobSource(slug="test", total_jobs=5)
        adapter = FakeAdapter("test", [_make_raw_job()])
        job_repo = FakeJobRepository()
        source_repo = FakeSourceRepository([source])

        service = CollectionService(job_repo, source_repo, {"test": adapter})
        await service.collect_from_source(source.id)

        assert source.total_jobs == 6
        assert source.last_collected_at is not None
