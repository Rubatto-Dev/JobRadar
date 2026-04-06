from __future__ import annotations

import asyncio
from typing import Any

import httpx
import structlog

from src.protocols.job_source import USER_AGENT, RawJob

logger = structlog.get_logger()

_BASE_URL = "https://portal.api.gupy.io/api/v1/jobs"
_PAGE_SIZE = 50
_MAX_RETRIES = 3
_RATE_LIMIT_DELAY = 1.0  # 1 req/sec


class GupyAdapter:
    source_slug = "gupy"

    async def collect(self, config: dict[str, Any]) -> list[RawJob]:
        jobs: list[RawJob] = []
        offset = 0
        base_url = config.get("base_url", _BASE_URL)

        async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}, timeout=30.0) as client:
            while True:
                data = await self._fetch_page(client, base_url, offset)
                if not data:
                    break

                for item in data:
                    try:
                        jobs.append(self._map_to_raw_job(item))
                    except Exception:  # noqa: BLE001, S110
                        await logger.awarning("Failed to map Gupy job", job_id=item.get("id"))

                if len(data) < _PAGE_SIZE:
                    break
                offset += _PAGE_SIZE
                await asyncio.sleep(_RATE_LIMIT_DELAY)

        await logger.ainfo("Gupy collection done", total=len(jobs))
        return jobs

    async def _fetch_page(self, client: httpx.AsyncClient, base_url: str, offset: int) -> list[dict[str, Any]]:
        for attempt in range(_MAX_RETRIES):
            try:
                response = await client.get(base_url, params={"offset": offset, "limit": _PAGE_SIZE})
                response.raise_for_status()
                result: list[dict[str, Any]] = response.json().get("data", [])
                return result
            except httpx.HTTPError:
                if attempt == _MAX_RETRIES - 1:
                    await logger.aerror("Gupy fetch failed after retries", offset=offset)
                    return []
                wait = 2**attempt
                await asyncio.sleep(wait)
        return []

    def _map_to_raw_job(self, item: dict[str, Any]) -> RawJob:
        workplace = item.get("workplaceType", "")
        modality_map = {
            "remote": "remoto",
            "hybrid": "hibrido",
            "on-site": "presencial",
        }
        return RawJob(
            external_id=str(item.get("id", "")),
            title=item.get("name", ""),
            company=item.get("careerPageName", ""),
            description=item.get("description", ""),
            requirements=item.get("prerequisites"),
            location=None,
            city=item.get("city"),
            state=item.get("state"),
            country=item.get("country", "Brasil"),
            modality=modality_map.get(workplace.lower(), workplace) if workplace else None,
            seniority=None,
            url=item.get("jobUrl", ""),
            published_at=None,
            raw_data=item,
        )
