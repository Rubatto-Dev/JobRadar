from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import date, datetime

from pydantic import BaseModel


class JobSummary(BaseModel):
    id: uuid.UUID
    title: str
    company: str
    location: str | None
    modality: str | None
    seniority: str | None
    salary_text: str | None
    url: str
    published_at: datetime | None
    is_active: bool
    source_slug: str | None = None
    is_favorited: bool = False
    application_status: str | None = None

    model_config = {"from_attributes": True}


class JobDetail(JobSummary):
    description: str
    requirements: str | None
    city: str | None
    state: str | None
    country: str | None
    salary_min: int | None
    salary_max: int | None
    created_at: datetime


@dataclass
class JobFilters:
    modality: list[str] | None = None
    seniority: list[str] | None = None
    location: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    source: str | None = None
    published_after: date | None = None
