"""Testes unitarios para AuthService."""

from __future__ import annotations

import pytest

from src.core.exceptions import (
    EmailAlreadyExistsError,
    EmailNotVerifiedError,
    InvalidCredentialsError,
    LGPDConsentRequiredError,
    TokenBlacklistedError,
)
from src.core.security import create_refresh_token, hash_password
from src.schemas.auth import RegisterRequest
from src.services.auth_service import AuthService
from tests.fakes import FakeEmail, FakeRedis, FakeUser, FakeUserRepository


def _make_service(
    users: list[FakeUser] | None = None,
    redis: FakeRedis | None = None,
    email: FakeEmail | None = None,
) -> AuthService:
    return AuthService(
        user_repo=FakeUserRepository(users),
        redis=redis or FakeRedis(),
        email=email or FakeEmail(),
    )


def _make_register_data(**overrides: object) -> RegisterRequest:
    defaults = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "StrongPass1",
        "lgpd_consent": True,
        "locale": "pt-br",
    }
    defaults.update(overrides)
    return RegisterRequest(**defaults)  # type: ignore[arg-type]


class TestRegister:
    async def test_register_should_create_user_with_hashed_password(self) -> None:
        service = _make_service()
        result = await service.register(_make_register_data())
        assert "id" in result
        assert result["email"] == "test@example.com"
        assert result["name"] == "Test User"

    async def test_register_when_duplicate_email_should_raise(self) -> None:
        existing = FakeUser(email="test@example.com")
        service = _make_service(users=[existing])
        with pytest.raises(EmailAlreadyExistsError):
            await service.register(_make_register_data())

    async def test_register_when_weak_password_should_raise(self) -> None:
        from pydantic import ValidationError

        with pytest.raises(ValidationError, match="Password must be at least 8 characters"):
            _make_register_data(password="weak")

    async def test_register_when_no_lgpd_consent_should_raise(self) -> None:
        service = _make_service()
        with pytest.raises(LGPDConsentRequiredError):
            await service.register(_make_register_data(lgpd_consent=False))

    async def test_register_should_send_verification_email(self) -> None:
        email_svc = FakeEmail()
        service = _make_service(email=email_svc)
        await service.register(_make_register_data())
        assert len(email_svc.sent) == 1
        assert email_svc.sent[0]["type"] == "verification"


class TestLogin:
    async def test_login_should_return_token_pair(self) -> None:
        user = FakeUser(
            email="test@example.com",
            password_hash=hash_password("StrongPass1"),
            email_verified=True,
        )
        service = _make_service(users=[user])
        result = await service.login("test@example.com", "StrongPass1")
        assert result.access_token
        assert result.refresh_token
        assert result.token_type == "bearer"

    async def test_login_when_invalid_credentials_should_raise(self) -> None:
        service = _make_service()
        with pytest.raises(InvalidCredentialsError):
            await service.login("nonexistent@example.com", "whatever")

    async def test_login_when_wrong_password_should_raise(self) -> None:
        user = FakeUser(
            email="test@example.com",
            password_hash=hash_password("StrongPass1"),
            email_verified=True,
        )
        service = _make_service(users=[user])
        with pytest.raises(InvalidCredentialsError):
            await service.login("test@example.com", "WrongPass1")

    async def test_login_when_email_not_verified_should_raise(self) -> None:
        user = FakeUser(
            email="test@example.com",
            password_hash=hash_password("StrongPass1"),
            email_verified=False,
        )
        service = _make_service(users=[user])
        with pytest.raises(EmailNotVerifiedError):
            await service.login("test@example.com", "StrongPass1")


class TestRefreshToken:
    async def test_refresh_token_should_return_new_access_token(self) -> None:
        import uuid

        user_id = uuid.uuid4()
        token = create_refresh_token(user_id)
        service = _make_service()
        new_access = await service.refresh_token(token)
        assert new_access

    async def test_refresh_when_blacklisted_token_should_raise(self) -> None:
        import uuid

        from src.core.security import decode_token

        user_id = uuid.uuid4()
        token = create_refresh_token(user_id)
        payload = decode_token(token)
        jti = payload["jti"]

        redis = FakeRedis()
        await redis.set(f"blacklist:{jti}", "1")

        service = _make_service(redis=redis)
        with pytest.raises(TokenBlacklistedError):
            await service.refresh_token(token)


class TestVerifyEmail:
    async def test_verify_email_should_activate_user(self) -> None:
        user = FakeUser(email="test@example.com", email_verified=False)
        service = _make_service(users=[user])

        from src.core.security import create_verification_token

        token = create_verification_token(user.id, "email_verify")
        await service.verify_email(token)
        assert user.email_verified is True


class TestGoogleAuth:
    async def test_google_auth_new_user_should_create_and_return_tokens(self) -> None:
        service = _make_service()
        result = await service.google_auth(
            google_id="google-123",
            email="new@example.com",
            name="New User",
        )
        assert result.access_token
        assert result.refresh_token

    async def test_google_auth_existing_user_should_return_tokens(self) -> None:
        user = FakeUser(email="existing@example.com", google_id="google-456", email_verified=True)
        service = _make_service(users=[user])
        result = await service.google_auth(
            google_id="google-456",
            email="existing@example.com",
            name="Existing User",
        )
        assert result.access_token
        assert result.refresh_token

    async def test_google_auth_should_link_google_id_to_existing_email_user(self) -> None:
        user = FakeUser(email="user@example.com", google_id=None, email_verified=True)
        service = _make_service(users=[user])
        result = await service.google_auth(
            google_id="google-789",
            email="user@example.com",
            name="User",
        )
        assert result.access_token
        assert user.google_id == "google-789"
