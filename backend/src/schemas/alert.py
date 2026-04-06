from __future__ import annotations

from pydantic import BaseModel, Field


class AlertSettings(BaseModel):
    alert_frequency: str = "daily"
    alerts_enabled: bool = True

    model_config = {"from_attributes": True}


class AlertSettingsUpdate(BaseModel):
    model_config = {"extra": "forbid"}

    alert_frequency: str | None = Field(None, pattern=r"^(daily|weekly)$")
    alerts_enabled: bool | None = None
