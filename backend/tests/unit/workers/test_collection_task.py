"""Testes para logica de coleta (testando CollectionService, nao Celery diretamente)."""

from __future__ import annotations

from src.protocols.job_source import RawJob
from src.services.collection_service import CollectionService
from tests.fakes import FakeAdapter, FakeJobRepository, FakeJobSource, FakeSourceRepository


def _raw_job(title: str = "Job", company: str = "Co") -> RawJob:
    return RawJob(external_id="1", title=title, company=company, description="d", url="u", raw_data={})


class TestCollectionTask:
    async def test_collect_task_should_call_adapter_and_persist(self) -> None:
        source = FakeJobSource(slug="gupy")
        adapter = FakeAdapter("gupy", [_raw_job()])
        job_repo = FakeJobRepository()
        source_repo = FakeSourceRepository([source])
        service = CollectionService(job_repo, source_repo, {"gupy": adapter})

        result = await service.collect_from_source(source.id)
        assert result.new_jobs == 1

    async def test_collect_all_should_iterate_active_sources(self) -> None:
        s1 = FakeJobSource(slug="gupy")
        s2 = FakeJobSource(slug="remotive")
        a1 = FakeAdapter("gupy", [_raw_job(title="A")])
        a2 = FakeAdapter("remotive", [_raw_job(title="B")])
        job_repo = FakeJobRepository()
        source_repo = FakeSourceRepository([s1, s2])
        service = CollectionService(job_repo, source_repo, {"gupy": a1, "remotive": a2})

        r1 = await service.collect_from_source(s1.id)
        r2 = await service.collect_from_source(s2.id)
        assert r1.new_jobs == 1
        assert r2.new_jobs == 1

    async def test_collect_task_should_update_source_metadata(self) -> None:
        source = FakeJobSource(slug="test", total_jobs=10)
        adapter = FakeAdapter("test", [_raw_job(title="New")])
        job_repo = FakeJobRepository()
        source_repo = FakeSourceRepository([source])
        service = CollectionService(job_repo, source_repo, {"test": adapter})

        await service.collect_from_source(source.id)
        assert source.total_jobs == 11
        assert source.last_collected_at is not None
