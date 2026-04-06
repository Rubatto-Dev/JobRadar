from __future__ import annotations

import uuid

from pydantic import BaseModel, Field, model_validator


class PreferenceResponse(BaseModel):
    id: uuid.UUID | None = None
    modalities: list[str] = []
    locations: list[str] = []
    seniority_levels: list[str] = []
    keywords: list[str] = []
    area_ids: list[uuid.UUID] = []
    salary_min: int | None = None
    salary_max: int | None = None
    alert_frequency: str = "daily"
    alerts_enabled: bool = True

    model_config = {"from_attributes": True}


class PreferenceUpdate(BaseModel):
    model_config = {"extra": "forbid"}

    modalities: list[str] | None = None
    locations: list[str] | None = None
    seniority_levels: list[str] | None = None
    keywords: list[str] | None = None
    area_ids: list[uuid.UUID] | None = None
    salary_min: int | None = Field(None, ge=0)
    salary_max: int | None = Field(None, ge=0)
    alert_frequency: str | None = Field(None, pattern=r"^(daily|weekly)$")
    alerts_enabled: bool | None = None

    @model_validator(mode="after")
    def validate_salary_range(self) -> PreferenceUpdate:
        if self.salary_min is not None and self.salary_max is not None and self.salary_min > self.salary_max:
            msg = "salary_min must be <= salary_max"
            raise ValueError(msg)
        return self
