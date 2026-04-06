from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AdminMetrics(BaseModel):
    total_users: int = 0
    active_users_7d: int = 0
    new_users_24h: int = 0
    total_jobs_active: int = 0
    new_jobs_24h: int = 0
    total_sources: int = 0


class SourceStatus(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    is_active: bool
    last_collected_at: datetime | None
    last_error: str | None
    collection_interval_minutes: int
    total_jobs: int

    model_config = {"from_attributes": True}


class SourceUpdate(BaseModel):
    model_config = {"extra": "forbid"}

    is_active: bool | None = None
    collection_interval_minutes: int | None = Field(None, ge=30, le=1440)


class AdminUserView(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    is_active: bool
    is_admin: bool
    email_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserUpdate(BaseModel):
    model_config = {"extra": "forbid"}

    is_active: bool | None = None
    is_admin: bool | None = None
