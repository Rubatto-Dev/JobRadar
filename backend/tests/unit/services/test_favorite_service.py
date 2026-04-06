"""Testes unitarios para FavoriteService."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

import pytest

from src.services.favorite_service import AlreadyFavoritedError, FavoriteService


class FakeFav:
    def __init__(self, **kwargs: Any) -> None:
        self.id: UUID = kwargs.get("id", uuid.uuid4())
        self.user_id: UUID = kwargs.get("user_id", uuid.uuid4())
        self.job_id: UUID = kwargs.get("job_id", uuid.uuid4())
        self.created_at: datetime = kwargs.get("created_at", datetime.now(UTC))


class FakeFavRepo:
    def __init__(self) -> None:
        self._favs: list[FakeFav] = []

    async def list_by_user(self, user_id: UUID, offset: int = 0, limit: int = 20) -> tuple[list[FakeFav], int]:
        user_favs = [f for f in self._favs if f.user_id == user_id]
        return user_favs[offset : offset + limit], len(user_favs)

    async def get_by_user_and_job(self, user_id: UUID, job_id: UUID) -> FakeFav | None:
        for f in self._favs:
            if f.user_id == user_id and f.job_id == job_id:
                return f
        return None

    async def create(self, **kwargs: Any) -> FakeFav:
        fav = FakeFav(**kwargs)
        self._favs.append(fav)
        return fav

    async def delete_by_user_and_job(self, user_id: UUID, job_id: UUID) -> bool:
        for i, f in enumerate(self._favs):
            if f.user_id == user_id and f.job_id == job_id:
                self._favs.pop(i)
                return True
        return False


class TestFavoriteService:
    async def test_add_favorite_should_create_record(self) -> None:
        repo = FakeFavRepo()
        service = FavoriteService(repo)
        result = await service.add(uuid.uuid4(), uuid.uuid4())
        assert result.id is not None

    async def test_add_favorite_when_duplicate_should_raise(self) -> None:
        repo = FakeFavRepo()
        service = FavoriteService(repo)
        user_id, job_id = uuid.uuid4(), uuid.uuid4()
        await service.add(user_id, job_id)
        with pytest.raises(AlreadyFavoritedError):
            await service.add(user_id, job_id)

    async def test_remove_favorite_should_delete_record(self) -> None:
        repo = FakeFavRepo()
        service = FavoriteService(repo)
        user_id, job_id = uuid.uuid4(), uuid.uuid4()
        await service.add(user_id, job_id)
        await service.remove(user_id, job_id)
        result = await service.list(user_id)
        assert len(result.data) == 0

    async def test_list_favorites_should_paginate(self) -> None:
        repo = FakeFavRepo()
        service = FavoriteService(repo)
        user_id = uuid.uuid4()
        for _ in range(5):
            await service.add(user_id, uuid.uuid4())
        result = await service.list(user_id, offset=0, limit=3)
        assert len(result.data) == 3
        assert result.pagination.total == 5

    async def test_delete_favorite_when_not_found_should_raise(self) -> None:
        service = FavoriteService(FakeFavRepo())
        with pytest.raises(ValueError, match="not found"):
            await service.remove(uuid.uuid4(), uuid.uuid4())
