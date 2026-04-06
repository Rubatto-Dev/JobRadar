from __future__ import annotations

from typing import Any, Protocol
from uuid import UUID

from src.core.exceptions import DomainError
from src.schemas.favorite import FavoriteResponse
from src.schemas.pagination import PaginatedResponse, PaginationInfo


class FavoriteRepoProtocol(Protocol):
    async def list_by_user(self, user_id: UUID, offset: int = 0, limit: int = 20) -> tuple[list[Any], int]: ...
    async def get_by_user_and_job(self, user_id: UUID, job_id: UUID) -> Any: ...
    async def create(self, **kwargs: Any) -> Any: ...
    async def delete_by_user_and_job(self, user_id: UUID, job_id: UUID) -> bool: ...


class AlreadyFavoritedError(DomainError):
    def __init__(self) -> None:
        super().__init__("Job already favorited")


class FavoriteService:
    def __init__(self, repo: FavoriteRepoProtocol) -> None:
        self._repo = repo

    async def list(self, user_id: UUID, offset: int = 0, limit: int = 20) -> PaginatedResponse[FavoriteResponse]:
        favs, total = await self._repo.list_by_user(user_id, offset, limit)
        data = [FavoriteResponse(id=f.id, job_id=f.job_id, created_at=f.created_at) for f in favs]
        return PaginatedResponse[FavoriteResponse](
            data=data, pagination=PaginationInfo(offset=offset, limit=limit, total=total)
        )

    async def add(self, user_id: UUID, job_id: UUID) -> FavoriteResponse:
        existing = await self._repo.get_by_user_and_job(user_id, job_id)
        if existing is not None:
            raise AlreadyFavoritedError
        fav = await self._repo.create(user_id=user_id, job_id=job_id)
        return FavoriteResponse(id=fav.id, job_id=fav.job_id, created_at=fav.created_at)

    async def remove(self, user_id: UUID, job_id: UUID) -> None:
        deleted = await self._repo.delete_by_user_and_job(user_id, job_id)
        if not deleted:
            msg = "Favorite not found"
            raise ValueError(msg)
