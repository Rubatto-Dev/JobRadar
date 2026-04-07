from __future__ import annotations

import asyncio

import structlog

from src.workers.celery_app import app

logger = structlog.get_logger()


@app.task(name="src.workers.tasks.alerts.send_daily_alerts")
def send_daily_alerts() -> dict[str, int]:
    return asyncio.get_event_loop().run_until_complete(_send_daily_alerts())


async def _send_daily_alerts() -> dict[str, int]:
    from datetime import UTC, datetime, timedelta

    from src.core.database import async_session_factory
    from src.core.redis import RedisService, get_redis
    from src.repositories.job_repository import JobRepository
    from src.repositories.preference_repository import PreferenceRepository
    from src.services.alert_service import AlertService
    from src.services.email_service import ResendEmailService

    from sqlalchemy import select

    from src.models.user import User
    from src.repositories.alert_log_repository import AlertLogRepository
    from src.schemas.job import JobFilters

    sent = 0
    errors = 0

    async with async_session_factory() as session:
        # Get users with alerts enabled
        result = await session.execute(select(User).where(User.is_active.is_(True), User.email_verified.is_(True)))
        users = list(result.scalars().all())

        job_repo = JobRepository(session)
        pref_repo = PreferenceRepository(session)
        alert_log_repo = AlertLogRepository(session)
        email = ResendEmailService()
        alert_service = AlertService(pref_repo, alert_log_repo, email)

        # Get jobs from last 24h
        filters = JobFilters(published_after=datetime.now(UTC).date() - timedelta(days=1))
        new_jobs, _ = await job_repo.search(None, filters, "date", "desc", 0, 100)

        for user in users:
            try:
                matched = await alert_service.match_jobs_to_user(user.id, new_jobs)
                if matched:
                    await alert_service.send_alert(user.id, user.email, matched, user.locale)
                    sent += 1
            except Exception:  # noqa: BLE001
                errors += 1
                await logger.awarning("Failed to send alert", user_id=str(user.id))

        await session.commit()

    await logger.ainfo("Daily alerts completed", sent=sent, errors=errors)
    return {"sent": sent, "errors": errors}
