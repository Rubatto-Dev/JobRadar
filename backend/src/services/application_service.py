from __future__ import annotations

import csv
import io
from typing import Any, Protocol
from uuid import UUID

from src.core.exceptions import DomainError
from src.schemas.application import ApplicationResponse, ApplicationUpdate
from src.schemas.pagination import PaginatedResponse, PaginationInfo


class ApplicationRepoProtocol(Protocol):
    async def list_by_user(
        self, user_id: UUID, status: str | None = None, offset: int = 0, limit: int = 20
    ) -> tuple[list[Any], int]: ...
    async def get_by_user_and_job(self, user_id: UUID, job_id: UUID) -> Any: ...
    async def get_by_id_and_user(self, app_id: UUID, user_id: UUID) -> Any: ...
    async def create(self, **kwargs: Any) -> Any: ...
    async def update(self, app_id: UUID, user_id: UUID, **kwargs: Any) -> Any: ...
    async def delete(self, app_id: UUID, user_id: UUID) -> bool: ...
    async def list_all_by_user(self, user_id: UUID) -> list[Any]: ...


class AlreadyAppliedError(DomainError):
    def __init__(self) -> None:
        super().__init__("Already applied to this job")


class ApplicationService:
    def __init__(self, repo: ApplicationRepoProtocol) -> None:
        self._repo = repo

    async def list(
        self, user_id: UUID, status: str | None = None, offset: int = 0, limit: int = 20
    ) -> PaginatedResponse[ApplicationResponse]:
        apps, total = await self._repo.list_by_user(user_id, status, offset, limit)
        data = [ApplicationResponse.model_validate(a) for a in apps]
        return PaginatedResponse[ApplicationResponse](
            data=data, pagination=PaginationInfo(offset=offset, limit=limit, total=total)
        )

    async def create(self, user_id: UUID, job_id: UUID, notes: str | None = None) -> ApplicationResponse:
        existing = await self._repo.get_by_user_and_job(user_id, job_id)
        if existing is not None:
            raise AlreadyAppliedError
        app = await self._repo.create(user_id=user_id, job_id=job_id, notes=notes)
        return ApplicationResponse.model_validate(app)

    async def update(self, user_id: UUID, app_id: UUID, data: ApplicationUpdate) -> ApplicationResponse:
        update_data = data.model_dump(exclude_unset=True)
        app = await self._repo.update(app_id, user_id, **update_data)
        if app is None:
            msg = "Application not found"
            raise ValueError(msg)
        return ApplicationResponse.model_validate(app)

    async def delete(self, user_id: UUID, app_id: UUID) -> None:
        deleted = await self._repo.delete(app_id, user_id)
        if not deleted:
            msg = "Application not found"
            raise ValueError(msg)

    async def export_csv(self, user_id: UUID) -> str:
        apps = await self._repo.list_all_by_user(user_id)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["status", "notes", "applied_at"])
        for app in apps:
            writer.writerow([app.status, app.notes or "", str(app.applied_at)])
        return output.getvalue()
