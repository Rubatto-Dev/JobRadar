from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

VALID_STATUSES = {"applied", "in_progress", "interview", "approved", "rejected"}


class ApplicationCreate(BaseModel):
    job_id: uuid.UUID
    notes: str | None = None


class ApplicationUpdate(BaseModel):
    model_config = {"extra": "forbid"}

    status: str | None = Field(None, pattern=r"^(applied|in_progress|interview|approved|rejected)$")
    notes: str | None = None


class ApplicationResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    status: str
    notes: str | None
    applied_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
