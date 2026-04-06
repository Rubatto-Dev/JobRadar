from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from src.models.area import Area
    from src.models.user import User

user_preference_areas = Table(
    "user_preference_areas",
    Base.metadata,
    Column("preference_id", UUID(as_uuid=True), ForeignKey("user_preferences.id"), primary_key=True),
    Column("area_id", UUID(as_uuid=True), ForeignKey("areas.id"), primary_key=True),
)


class UserPreference(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    modalities: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    locations: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    seniority_levels: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    keywords: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    alert_frequency: Mapped[str] = mapped_column(String(20), nullable=False, server_default="daily")
    alerts_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    user: Mapped[User] = relationship(back_populates="preference")
    areas: Mapped[list[Area]] = relationship(secondary=user_preference_areas)
