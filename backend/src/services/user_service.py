from __future__ import annotations

from uuid import UUID

import structlog

from src.core.exceptions import InvalidCredentialsError
from src.core.security import verify_password
from src.protocols.auth import RedisProtocol, UserRepositoryProtocol
from src.schemas.user import UserExport, UserProfile, UserUpdate

logger = structlog.get_logger()


class UserService:
    def __init__(self, user_repo: UserRepositoryProtocol, redis: RedisProtocol) -> None:
        self._user_repo = user_repo
        self._redis = redis

    async def get_profile(self, user_id: UUID) -> UserProfile:
        user = await self._user_repo.get_by_id(user_id)
        if user is None:
            raise InvalidCredentialsError
        return UserProfile.model_validate(user)

    async def update_profile(self, user_id: UUID, data: UserUpdate) -> UserProfile:
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return await self.get_profile(user_id)
        user = await self._user_repo.update(user_id, **update_data)
        return UserProfile.model_validate(user)

    async def delete_account(self, user_id: UUID, password: str, refresh_token: str | None = None) -> None:
        user = await self._user_repo.get_by_id(user_id)
        if user is None:
            raise InvalidCredentialsError

        if user.password_hash is not None and not verify_password(password, user.password_hash):
            raise InvalidCredentialsError

        if refresh_token:
            from src.core.security import decode_token

            try:
                payload = decode_token(refresh_token)
                jti = payload.get("jti", "")
                exp = payload.get("exp", 0)
                from datetime import UTC, datetime

                ttl = max(int(exp - datetime.now(UTC).timestamp()), 0)
                await self._redis.set(f"blacklist:{jti}", "1", ex=ttl)
            except Exception:  # noqa: BLE001, S110
                pass  # Best-effort blacklist; don't block account deletion

        await self._user_repo.delete(user_id)
        await logger.ainfo("Account deleted (LGPD)", user_id=str(user_id))

    async def export_data(self, user_id: UUID) -> UserExport:
        user = await self._user_repo.get_by_id(user_id)
        if user is None:
            raise InvalidCredentialsError
        profile = UserProfile.model_validate(user)
        return UserExport(profile=profile)
