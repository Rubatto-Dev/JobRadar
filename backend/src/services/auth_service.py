from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

import structlog

from src.core.exceptions import (
    AccountDeactivatedError,
    EmailAlreadyExistsError,
    EmailNotVerifiedError,
    InvalidCredentialsError,
    InvalidTokenError,
    LGPDConsentRequiredError,
    TokenBlacklistedError,
    WeakPasswordError,
)
from src.core.security import (
    create_access_token,
    create_refresh_token,
    create_verification_token,
    decode_token,
    hash_password,
    verify_password,
)
from src.protocols.auth import EmailProtocol, RedisProtocol, UserRepositoryProtocol
from src.schemas.auth import RegisterRequest, TokenPair

logger = structlog.get_logger()


class AuthService:
    def __init__(
        self,
        user_repo: UserRepositoryProtocol,
        redis: RedisProtocol,
        email: EmailProtocol,
    ) -> None:
        self._user_repo = user_repo
        self._redis = redis
        self._email = email

    async def register(self, data: RegisterRequest) -> dict[str, str | UUID]:
        if not data.lgpd_consent:
            raise LGPDConsentRequiredError

        _validate_password_strength(data.password)

        existing = await self._user_repo.get_by_email(data.email)
        if existing is not None:
            raise EmailAlreadyExistsError

        user = await self._user_repo.create(
            email=data.email,
            name=data.name,
            password_hash=hash_password(data.password),
            locale=data.locale,
            lgpd_consent_at=datetime.now(UTC).replace(tzinfo=None),
        )

        token = create_verification_token(user.id, "email_verify", expires_hours=24)
        await self._email.send_verification_email(data.email, token)

        await logger.ainfo("User registered", user_id=str(user.id), email=data.email)
        return {"id": user.id, "email": user.email, "name": user.name}

    async def login(self, email: str, password: str) -> TokenPair:
        user = await self._user_repo.get_by_email(email)
        if user is None or user.password_hash is None:
            raise InvalidCredentialsError

        if not verify_password(password, user.password_hash):
            raise InvalidCredentialsError

        if not user.is_active:
            raise AccountDeactivatedError

        if not user.email_verified:
            raise EmailNotVerifiedError

        access_token = create_access_token(user.id, is_admin=user.is_admin)
        refresh_token = create_refresh_token(user.id)

        await logger.ainfo("User logged in", user_id=str(user.id))
        return TokenPair(access_token=access_token, refresh_token=refresh_token)

    async def refresh_token(self, refresh_token: str) -> str:
        payload = decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise InvalidTokenError("Not a refresh token")

        jti = payload.get("jti", "")
        is_blacklisted = await self._redis.exists(f"blacklist:{jti}")
        if is_blacklisted:
            raise TokenBlacklistedError

        user_id = UUID(payload["sub"])
        user = await self._user_repo.get_by_id(user_id)
        if user is None:
            raise InvalidTokenError("User not found")
        if not user.is_active:
            raise AccountDeactivatedError
        return create_access_token(user_id, is_admin=user.is_admin)

    async def verify_email(self, token: str) -> None:
        payload = decode_token(token)

        if payload.get("type") != "email_verify":
            raise InvalidTokenError("Not a verification token")

        user_id = UUID(payload["sub"])
        user = await self._user_repo.get_by_id(user_id)
        if user is None:
            raise InvalidTokenError("User not found")

        await self._user_repo.update(user_id, email_verified=True)
        await logger.ainfo("Email verified", user_id=str(user_id))

    async def resend_verification(self, email: str) -> None:
        user = await self._user_repo.get_by_email(email)
        if user is None or user.email_verified:
            return  # Generic response to prevent enumeration

        token = create_verification_token(user.id, "email_verify", expires_hours=24)
        await self._email.send_verification_email(email, token)

    async def forgot_password(self, email: str) -> None:
        user = await self._user_repo.get_by_email(email)
        if user is None:
            return  # Generic response to prevent user enumeration

        reset_token = create_verification_token(user.id, "reset_password", expires_hours=1)
        await self._email.send_reset_password_email(email, reset_token)

    async def reset_password(self, token: str, password: str) -> None:
        payload = decode_token(token)

        if payload.get("type") != "reset_password":
            raise InvalidTokenError("Not a reset password token")

        _validate_password_strength(password)

        user_id = UUID(payload["sub"])
        await self._user_repo.update(user_id, password_hash=hash_password(password))
        await logger.ainfo("Password reset", user_id=str(user_id))

    async def google_auth(self, google_id: str, email: str, name: str) -> TokenPair:
        user = await self._user_repo.get_by_email(email)

        if user is None:
            user = await self._user_repo.create(
                email=email,
                name=name,
                google_id=google_id,
                email_verified=True,
                lgpd_consent_at=datetime.now(UTC).replace(tzinfo=None),
            )
            await logger.ainfo("Google OAuth: new user created", user_id=str(user.id))
        else:
            if not user.is_active:
                raise AccountDeactivatedError
            if user.google_id is None:
                await self._user_repo.update(user.id, google_id=google_id, email_verified=True)
                await logger.ainfo("Google OAuth: linked to existing user", user_id=str(user.id))

        access_token = create_access_token(user.id, is_admin=user.is_admin)
        refresh_token = create_refresh_token(user.id)
        return TokenPair(access_token=access_token, refresh_token=refresh_token)

    async def blacklist_refresh_token(self, refresh_token: str) -> None:
        payload = decode_token(refresh_token)
        jti = payload.get("jti", "")
        exp = payload.get("exp", 0)
        ttl = max(int(exp - datetime.now(UTC).timestamp()), 0)
        await self._redis.set(f"blacklist:{jti}", "1", ex=ttl)


def _validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise WeakPasswordError("Password must be at least 8 characters")
    if not any(c.isupper() for c in password):
        raise WeakPasswordError("Password must contain at least one uppercase letter")
    if not any(c.isdigit() for c in password):
        raise WeakPasswordError("Password must contain at least one digit")
