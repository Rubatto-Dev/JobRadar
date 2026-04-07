from __future__ import annotations

from celery import Celery
from celery.schedules import crontab

from src.core.config import get_settings

settings = get_settings()

app = Celery("jobradar", broker=settings.REDIS_URL, backend=settings.REDIS_URL)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_routes={
        "src.workers.tasks.collection.*": {"queue": "collection"},
        "src.workers.tasks.maintenance.*": {"queue": "maintenance"},
        "src.workers.tasks.alerts.*": {"queue": "maintenance"},
    },
    beat_schedule={
        "collect-all-sources-every-2h": {
            "task": "src.workers.tasks.collection.collect_all_sources",
            "schedule": crontab(minute=0, hour="*/2"),
        },
        "expire-stale-jobs-daily": {
            "task": "src.workers.tasks.maintenance.expire_stale_jobs",
            "schedule": crontab(minute=0, hour=3),  # 3 AM daily
        },
        "send-daily-alerts": {
            "task": "src.workers.tasks.alerts.send_daily_alerts",
            "schedule": crontab(minute=0, hour=8),  # 8 AM daily
        },
    },
)

app.autodiscover_tasks(["src.workers.tasks"])
