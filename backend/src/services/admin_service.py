from __future__ import annotations

from typing import Any, Protocol
from uuid import UUID

from src.schemas.admin import AdminMetrics, AdminUserUpdate, AdminUserView, SourceStatus, SourceUpdate
from src.schemas.pagination import PaginatedResponse, PaginationInfo


class AdminRepoProtocol(Protocol):
    async def get_metrics(self) -> dict[str, int]: ...
    async def list_sources(self) -> list[Any]: ...
    async def update_source(self, source_id: UUID, **kwargs: Any) -> Any: ...
    async def list_users(
        self, search: str | None, is_active: bool | None, offset: int, limit: int
    ) -> tuple[list[Any], int]: ...
    async def update_user(self, user_id: UUID, **kwargs: Any) -> Any: ...


class AdminService:
    def __init__(self, repo: AdminRepoProtocol) -> None:
        self._repo = repo

    async def get_metrics(self) -> AdminMetrics:
        data = await self._repo.get_metrics()
        return AdminMetrics(**data)

    async def list_sources(self) -> list[SourceStatus]:
        sources = await self._repo.list_sources()
        return [SourceStatus.model_validate(s) for s in sources]

    async def update_source(self, source_id: UUID, data: SourceUpdate) -> SourceStatus:
        update_data = data.model_dump(exclude_unset=True)
        source = await self._repo.update_source(source_id, **update_data)
        return SourceStatus.model_validate(source)

    async def trigger_collection(self, source_id: UUID) -> str:
        from src.workers.tasks.collection import collect_jobs_from_source

        task = collect_jobs_from_source.delay(str(source_id))
        return task.id

    async def list_users(
        self, search: str | None = None, is_active: bool | None = None, offset: int = 0, limit: int = 20
    ) -> PaginatedResponse[AdminUserView]:
        users, total = await self._repo.list_users(search, is_active, offset, limit)
        data = [AdminUserView.model_validate(u) for u in users]
        return PaginatedResponse[AdminUserView](
            data=data, pagination=PaginationInfo(offset=offset, limit=limit, total=total)
        )

    async def update_user(self, user_id: UUID, data: AdminUserUpdate) -> AdminUserView:
        update_data = data.model_dump(exclude_unset=True)
        user = await self._repo.update_user(user_id, **update_data)
        return AdminUserView.model_validate(user)
