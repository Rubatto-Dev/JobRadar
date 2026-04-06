"""Testes unitarios para UserService."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from src.core.exceptions import InvalidCredentialsError
from src.core.security import hash_password
from src.schemas.user import UserUpdate
from src.services.user_service import UserService
from tests.fakes import FakeRedis, FakeUser, FakeUserRepository


def _make_service(
    users: list[FakeUser] | None = None,
    redis: FakeRedis | None = None,
) -> UserService:
    return UserService(
        user_repo=FakeUserRepository(users),
        redis=redis or FakeRedis(),
    )


def _make_user(**overrides: object) -> FakeUser:
    defaults = {
        "email": "test@example.com",
        "name": "Test User",
        "password_hash": hash_password("StrongPass1"),
        "is_active": True,
        "email_verified": True,
        "locale": "pt-br",
    }
    defaults.update(overrides)
    return FakeUser(**defaults)


class TestGetProfile:
    async def test_get_profile_should_return_user_data(self) -> None:
        user = _make_user()
        service = _make_service(users=[user])
        profile = await service.get_profile(user.id)
        assert profile.email == "test@example.com"
        assert profile.name == "Test User"


class TestUpdateProfile:
    async def test_update_profile_should_update_allowed_fields(self) -> None:
        user = _make_user()
        service = _make_service(users=[user])
        data = UserUpdate(name="New Name", location="Goiania, BR")
        profile = await service.update_profile(user.id, data)
        assert profile.name == "New Name"

    async def test_update_profile_should_not_accept_is_admin_field(self) -> None:
        with pytest.raises(ValidationError):
            UserUpdate(is_admin=True)  # type: ignore[call-arg]


class TestDeleteAccount:
    async def test_delete_account_should_remove_all_personal_data(self) -> None:
        user = _make_user()
        repo = FakeUserRepository([user])
        service = UserService(repo, FakeRedis())
        await service.delete_account(user.id, "StrongPass1")
        assert await repo.get_by_id(user.id) is None

    async def test_delete_account_when_wrong_password_should_raise(self) -> None:
        user = _make_user()
        service = _make_service(users=[user])
        with pytest.raises(InvalidCredentialsError):
            await service.delete_account(user.id, "WrongPass1")

    async def test_delete_account_should_blacklist_refresh_token(self) -> None:
        from src.core.security import create_refresh_token, decode_token

        user = _make_user()
        redis = FakeRedis()
        service = _make_service(users=[user], redis=redis)
        token = create_refresh_token(user.id)
        await service.delete_account(user.id, "StrongPass1", refresh_token=token)

        payload = decode_token(token)
        jti = payload["jti"]
        assert await redis.exists(f"blacklist:{jti}")


class TestExportData:
    async def test_export_data_should_include_all_user_data(self) -> None:
        user = _make_user()
        service = _make_service(users=[user])
        export = await service.export_data(user.id)
        assert export.profile.email == "test@example.com"
        assert export.profile.name == "Test User"
