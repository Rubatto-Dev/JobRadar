from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, UUIDMixin

if TYPE_CHECKING:
    from src.models.job import Job
    from src.models.user import User


class Favorite(UUIDMixin, Base):
    __tablename__ = "favorites"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now(), server_default=func.now())

    user: Mapped[User] = relationship(back_populates="favorites")
    job: Mapped[Job] = relationship(back_populates="favorites")

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_favorite_user_job"),
        Index("idx_favorite_user_job", "user_id", "job_id", unique=True),
    )
