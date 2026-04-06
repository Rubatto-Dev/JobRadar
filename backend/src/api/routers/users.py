from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user_id
from src.core.exceptions import DomainError
from src.repositories.user_repository import UserRepository
from src.schemas.user import DeleteAccountRequest, UserExport, UserProfile, UserUpdate
from src.services.user_service import UserService

router = APIRouter(prefix="/api/v1/users", tags=["users"])


class _FakeRedis:
    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        pass

    async def get(self, key: str) -> str | None:
        return None

    async def exists(self, key: str) -> bool:
        return False


def _get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db), _FakeRedis())


@router.get("/me", response_model=UserProfile)
async def get_profile(
    user_id: UUID = Depends(get_current_user_id),
    service: UserService = Depends(_get_user_service),
) -> UserProfile:
    try:
        return await service.get_profile(user_id)
    except DomainError as e:
        raise HTTPException(status_code=404, detail=e.message) from e


@router.patch("/me", response_model=UserProfile)
async def update_profile(
    data: UserUpdate,
    user_id: UUID = Depends(get_current_user_id),
    service: UserService = Depends(_get_user_service),
) -> UserProfile:
    return await service.update_profile(user_id, data)


@router.delete("/me", status_code=204)
async def delete_account(
    data: DeleteAccountRequest,
    user_id: UUID = Depends(get_current_user_id),
    service: UserService = Depends(_get_user_service),
) -> None:
    try:
        await service.delete_account(user_id, data.password)
    except DomainError as e:
        raise HTTPException(status_code=401, detail=e.message) from e


@router.get("/me/export", response_model=UserExport)
async def export_data(
    user_id: UUID = Depends(get_current_user_id),
    service: UserService = Depends(_get_user_service),
) -> UserExport:
    return await service.export_data(user_id)
