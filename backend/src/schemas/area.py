from __future__ import annotations

import uuid

from pydantic import BaseModel, Field


class AreaResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    is_active: bool

    model_config = {"from_attributes": True}


class AreaCreate(BaseModel):
    name_pt: str = Field(..., min_length=2, max_length=100)
    name_en: str | None = Field(None, max_length=100)


class AreaUpdate(BaseModel):
    model_config = {"extra": "forbid"}

    name_pt: str | None = Field(None, min_length=2, max_length=100)
    name_en: str | None = None
    is_active: bool | None = None
