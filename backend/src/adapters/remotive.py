from __future__ import annotations

import contextlib
import re
from datetime import datetime
from typing import Any

import httpx
import structlog

from src.protocols.job_source import USER_AGENT, RawJob

logger = structlog.get_logger()

_BASE_URL = "https://remotive.com/api/remote-jobs"
_MAX_RETRIES = 3


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text).strip()


class RemotiveAdapter:
    source_slug = "remotive"

    async def collect(self, config: dict[str, Any]) -> list[RawJob]:
        base_url = config.get("base_url", _BASE_URL)
        data = await self._fetch(base_url)
        jobs: list[RawJob] = []

        for item in data:
            try:
                jobs.append(self._map_to_raw_job(item))
            except Exception:  # noqa: BLE001, S110
                await logger.awarning("Failed to map Remotive job", job_id=item.get("id"))

        await logger.ainfo("Remotive collection done", total=len(jobs))
        return jobs

    async def _fetch(self, base_url: str) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}, timeout=30.0) as client:
            for attempt in range(_MAX_RETRIES):
                try:
                    response = await client.get(base_url)
                    response.raise_for_status()
                    result: list[dict[str, Any]] = response.json().get("jobs", [])
                    return result
                except httpx.HTTPError:
                    if attempt == _MAX_RETRIES - 1:
                        await logger.aerror("Remotive fetch failed after retries")
                        return []
                    import asyncio

                    await asyncio.sleep(2**attempt)
        return []

    def _map_to_raw_job(self, item: dict[str, Any]) -> RawJob:
        published = None
        if pub_date := item.get("publication_date"):
            with contextlib.suppress(ValueError, AttributeError):
                published = datetime.fromisoformat(pub_date.replace("Z", "+00:00"))

        return RawJob(
            external_id=str(item.get("id", "")),
            title=item.get("title", ""),
            company=item.get("company_name", ""),
            description=_strip_html(item.get("description", "")),
            requirements=None,
            location=item.get("candidate_required_location"),
            city=None,
            state=None,
            country=None,
            modality="remoto",
            seniority=None,
            salary_text=item.get("salary"),
            url=item.get("url", ""),
            published_at=published,
            raw_data=item,
        )
