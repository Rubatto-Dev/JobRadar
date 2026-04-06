from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from src.models.alert_log import AlertLog
    from src.models.application import Application
    from src.models.favorite import Favorite
    from src.models.preference import UserPreference
    from src.models.search_history import SearchHistory


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    locale: Mapped[str] = mapped_column(String(5), nullable=False, server_default="pt-br")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    lgpd_consent_at: Mapped[datetime | None] = mapped_column(nullable=True)
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

    preference: Mapped[UserPreference | None] = relationship(back_populates="user", uselist=False)
    favorites: Mapped[list[Favorite]] = relationship(back_populates="user")
    applications: Mapped[list[Application]] = relationship(back_populates="user")
    search_history: Mapped[list[SearchHistory]] = relationship(back_populates="user")
    alert_logs: Mapped[list[AlertLog]] = relationship(back_populates="user")

    __table_args__ = (
        Index("idx_user_email", "email", unique=True),
        Index("idx_user_google_id", "google_id", unique=True),
    )
