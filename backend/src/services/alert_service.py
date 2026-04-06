from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Protocol
from uuid import UUID

import structlog

from src.protocols.auth import EmailProtocol

logger = structlog.get_logger()


class PreferenceRepoProtocol(Protocol):
    async def get_by_user_id(self, user_id: UUID) -> Any: ...


class AlertLogRepoProtocol(Protocol):
    async def create(self, **kwargs: Any) -> Any: ...


class JobRepoProtocol(Protocol):
    async def get_by_id(self, job_id: UUID) -> Any: ...


class AlertService:
    def __init__(
        self,
        pref_repo: PreferenceRepoProtocol,
        alert_log_repo: AlertLogRepoProtocol,
        email: EmailProtocol,
    ) -> None:
        self._pref_repo = pref_repo
        self._alert_log_repo = alert_log_repo
        self._email = email

    async def match_jobs_to_user(self, user_id: UUID, jobs: list[Any]) -> list[Any]:
        pref = await self._pref_repo.get_by_user_id(user_id)
        if pref is None or not getattr(pref, "alerts_enabled", True):
            return []

        matched = []
        pref_modalities = set(getattr(pref, "modalities", None) or [])
        pref_seniorities = set(getattr(pref, "seniority_levels", None) or [])
        pref_keywords = [k.lower() for k in (getattr(pref, "keywords", None) or [])]

        for job in jobs:
            if pref_modalities and getattr(job, "modality", None) not in pref_modalities:
                continue
            if pref_seniorities and getattr(job, "seniority", None) not in pref_seniorities:
                continue
            if pref_keywords:
                title_lower = getattr(job, "title", "").lower()
                if not any(kw in title_lower for kw in pref_keywords):
                    continue
            matched.append(job)
        return matched

    async def send_alert(self, user_id: UUID, user_email: str, jobs: list[Any], locale: str = "pt-br") -> None:
        if not jobs:
            return

        job_list = "\n".join(f"- {getattr(j, 'title', 'Job')}" for j in jobs)
        subject = "JobRadar: Novas vagas para voce" if locale == "pt-br" else "JobRadar: New jobs for you"
        html = f"<h2>{subject}</h2><pre>{job_list}</pre>"

        await self._email.send_verification_email(user_email, html)
        await self._alert_log_repo.create(
            user_id=user_id,
            job_ids=[str(getattr(j, "id", "")) for j in jobs],
            channel="email",
            status="sent",
            sent_at=datetime.now(UTC),
        )
        await logger.ainfo("Alert sent", user_id=str(user_id), jobs_count=len(jobs))
