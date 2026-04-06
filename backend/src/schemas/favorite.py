from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class FavoriteCreate(BaseModel):
    job_id: uuid.UUID


class FavoriteResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
