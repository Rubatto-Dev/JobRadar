from __future__ import annotations

import hashlib
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Protocol, runtime_checkable

USER_AGENT = "JobRadar/0.1.0 (+https://github.com/rubatto-dev/JobRadar)"


@dataclass
class RawJob:
    external_id: str
    title: str
    company: str
    description: str
    url: str
    raw_data: dict[str, Any] = field(default_factory=dict)
    requirements: str | None = None
    location: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    modality: str | None = None
    seniority: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_text: str | None = None
    published_at: datetime | None = None


@dataclass
class CollectionResult:
    source_slug: str
    total_fetched: int
    new_jobs: int
    duplicates_skipped: int
    errors: int


@runtime_checkable
class JobSourceAdapterProtocol(Protocol):
    source_slug: str

    async def collect(self, config: dict[str, Any]) -> list[RawJob]: ...


def generate_fingerprint(title: str, company: str, location: str | None) -> str:
    def _normalize(text: str) -> str:
        text = unicodedata.normalize("NFKD", text.lower().strip())
        return "".join(c for c in text if not unicodedata.combining(c))

    raw = f"{_normalize(title)}|{_normalize(company)}|{_normalize(location or '')}"
    return hashlib.sha256(raw.encode()).hexdigest()
