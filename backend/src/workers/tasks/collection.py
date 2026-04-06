from __future__ import annotations

import asyncio
from typing import Any

import structlog

from src.workers.celery_app import app

logger = structlog.get_logger()


@app.task(bind=True, queue="collection", max_retries=3)
def collect_jobs_from_source(self: Any, source_id: str) -> dict[str, Any]:  # noqa: ARG001
    """Collect jobs from a single source."""
    from src.adapters.gupy import GupyAdapter
    from src.adapters.remotive import RemotiveAdapter
    from src.core.database import async_session_factory
    from src.repositories.job_repository import JobRepository
    from src.repositories.source_repository import SourceRepository
    from src.services.collection_service import CollectionService

    async def _run() -> dict[str, Any]:
        async with async_session_factory() as session:
            job_repo = JobRepository(session)
            source_repo = SourceRepository(session)
            adapters: dict[str, Any] = {
                "gupy": GupyAdapter(),
                "remotive": RemotiveAdapter(),
            }
            service = CollectionService(job_repo, source_repo, adapters)
            try:
                from uuid import UUID

                result = await service.collect_from_source(UUID(source_id))
                await session.commit()
                return {
                    "source_slug": result.source_slug,
                    "total_fetched": result.total_fetched,
                    "new_jobs": result.new_jobs,
                    "duplicates_skipped": result.duplicates_skipped,
                    "errors": result.errors,
                }
            except Exception as e:
                await session.rollback()
                await source_repo.update(UUID(source_id), last_error=str(e))
                await session.commit()
                raise

    return asyncio.run(_run())


@app.task(queue="collection")
def collect_all_sources() -> dict[str, Any]:
    """Collect jobs from all active sources."""
    from src.core.database import async_session_factory
    from src.repositories.source_repository import SourceRepository

    async def _run() -> dict[str, Any]:
        async with async_session_factory() as session:
            source_repo = SourceRepository(session)
            sources = await source_repo.list_active()
            results: list[dict[str, Any]] = []
            for source in sources:
                try:
                    result = collect_jobs_from_source.delay(str(source.id))
                    results.append({"source": source.slug, "task_id": result.id})
                except Exception as e:  # noqa: BLE001
                    results.append({"source": source.slug, "error": str(e)})
            return {"dispatched": len(results), "sources": results}

    return asyncio.run(_run())
