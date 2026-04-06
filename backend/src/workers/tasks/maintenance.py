from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog

from src.workers.celery_app import app

logger = structlog.get_logger()


@app.task(queue="maintenance")
def expire_stale_jobs(days: int = 30) -> dict[str, Any]:
    """Mark jobs not updated in N days as inactive."""
    from sqlalchemy import update

    from src.core.database import async_session_factory
    from src.models.job import Job

    async def _run() -> dict[str, Any]:
        cutoff = datetime.now(UTC) - timedelta(days=days)
        async with async_session_factory() as session:
            result = await session.execute(
                update(Job).where(Job.is_active.is_(True), Job.updated_at < cutoff).values(is_active=False)
            )
            count: int = result.rowcount  # type: ignore[attr-defined]
            await session.commit()
            await logger.ainfo("Expired stale jobs", count=count, cutoff_days=days)
            return {"expired_count": count, "cutoff_days": days}

    return asyncio.run(_run())
