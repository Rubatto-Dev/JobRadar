from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    avatar_url: str | None
    location: str | None
    locale: str
    is_active: bool
    is_admin: bool
    email_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    model_config = {"extra": "forbid"}

    name: str | None = Field(None, min_length=3, max_length=150)
    location: str | None = None
    avatar_url: str | None = None
    locale: str | None = Field(None, pattern=r"^(pt-br|en)$")


class DeleteAccountRequest(BaseModel):
    password: str


class UserExport(BaseModel):
    profile: UserProfile
    preferences: dict[str, Any] | None = None
    favorites_count: int = 0
    applications_count: int = 0
    search_history_count: int = 0
