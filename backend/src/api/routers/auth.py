from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.exceptions import (
    AccountDeactivatedError,
    DomainError,
    EmailAlreadyExistsError,
    EmailNotVerifiedError,
    InvalidCredentialsError,
    InvalidTokenError,
    LGPDConsentRequiredError,
    TokenBlacklistedError,
    WeakPasswordError,
)
from src.repositories.user_repository import UserRepository
from src.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    TokenPair,
)
from src.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


_EXCEPTION_MAP: dict[type[DomainError], tuple[int, str | None]] = {
    InvalidCredentialsError: (401, None),
    EmailNotVerifiedError: (403, None),
    AccountDeactivatedError: (423, None),
    EmailAlreadyExistsError: (409, None),
    WeakPasswordError: (400, None),
    InvalidTokenError: (400, None),
    TokenBlacklistedError: (401, None),
    LGPDConsentRequiredError: (400, None),
}


class _FakeRedis:
    """Placeholder until Redis dependency is wired."""

    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        pass

    async def get(self, key: str) -> str | None:
        return None

    async def exists(self, key: str) -> bool:
        return False


class _FakeEmail:
    """Placeholder until Resend adapter is wired."""

    async def send_verification_email(self, email: str, token: str) -> None:
        pass

    async def send_reset_password_email(self, email: str, token: str) -> None:
        pass


def _get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(UserRepository(db), _FakeRedis(), _FakeEmail())


def _handle(e: DomainError) -> HTTPException:
    status, msg = _EXCEPTION_MAP.get(type(e), (400, None))
    return HTTPException(status_code=status, detail=msg or e.message)


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(data: RegisterRequest, service: AuthService = Depends(_get_auth_service)) -> RegisterResponse:
    try:
        result = await service.register(data)
    except DomainError as e:
        raise _handle(e) from e
    return RegisterResponse(**result)


@router.post("/login", response_model=TokenPair)
async def login(data: LoginRequest, service: AuthService = Depends(_get_auth_service)) -> TokenPair:
    try:
        return await service.login(data.email, data.password)
    except DomainError as e:
        raise _handle(e) from e


@router.post("/refresh", response_model=TokenPair)
async def refresh(data: RefreshRequest, service: AuthService = Depends(_get_auth_service)) -> TokenPair:
    try:
        access_token = await service.refresh_token(data.refresh_token)
    except DomainError as e:
        raise _handle(e) from e
    return TokenPair(access_token=access_token, refresh_token=data.refresh_token)


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(token: str, service: AuthService = Depends(_get_auth_service)) -> MessageResponse:
    try:
        await service.verify_email(token)
    except DomainError as e:
        raise _handle(e) from e
    return MessageResponse(message="Email verified successfully")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    data: ForgotPasswordRequest, service: AuthService = Depends(_get_auth_service)
) -> MessageResponse:
    await service.forgot_password(data.email)
    return MessageResponse(message="If the email exists, a reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    data: ResetPasswordRequest, service: AuthService = Depends(_get_auth_service)
) -> MessageResponse:
    try:
        await service.reset_password(data.token, data.password)
    except DomainError as e:
        raise _handle(e) from e
    return MessageResponse(message="Password reset successfully")
