from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from src.models.application import Application
    from src.models.favorite import Favorite
    from src.models.job_source import JobSource


class Job(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "jobs"

    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("job_sources.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    modality: Mapped[str | None] = mapped_column(String(20), nullable=True)
    seniority: Mapped[str | None] = mapped_column(String(20), nullable=True)
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_text: Mapped[str | None] = mapped_column(String(100), nullable=True)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    raw_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    fingerprint: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    search_vector: Mapped[str | None] = mapped_column(TSVECTOR, nullable=True)

    source: Mapped[JobSource] = relationship(back_populates="jobs")
    favorites: Mapped[list[Favorite]] = relationship(back_populates="job")
    applications: Mapped[list[Application]] = relationship(back_populates="job")

    __table_args__ = (
        Index("idx_job_search_vector", "search_vector", postgresql_using="gin"),
        Index("idx_job_fingerprint", "fingerprint", unique=True),
        Index("idx_job_source_active", "source_id", "is_active"),
        Index("idx_job_published", "published_at"),
        Index("idx_job_modality", "modality"),
        Index("idx_job_seniority", "seniority"),
        Index("idx_job_country_state_city", "country", "state", "city"),
    )
