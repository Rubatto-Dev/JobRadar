from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    offset: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=50)


class PaginationInfo(BaseModel):
    offset: int
    limit: int
    total: int


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    pagination: PaginationInfo
