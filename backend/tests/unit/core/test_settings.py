"""Testes unitarios para core/config.py -- Settings."""

import os
from unittest.mock import patch

import pytest
from pydantic_settings import SettingsConfigDict

from src.core.config import Settings


class _TestSettings(Settings):
    """Settings que ignora .env file para testes isolados."""

    model_config = SettingsConfigDict(env_file=None, extra="ignore")


def _make_env(overrides: dict[str, str] | None = None) -> dict[str, str]:
    """Retorna env minimo valido para Settings."""
    base = {
        "DATABASE_URL": "postgresql+asyncpg://user:pass@localhost:5432/jobradar",
        "REDIS_URL": "redis://localhost:6379/0",
        "SECRET_KEY": "a" * 32,
        "RESEND_API_KEY": "re_test_123",
        "GOOGLE_CLIENT_ID": "google-client-id-test",
        "CORS_ORIGINS": '["http://localhost:3000"]',
    }
    if overrides:
        base.update(overrides)
    return base


class TestSettingsLoad:
    """Testes para carregamento de Settings."""

    def test_settings_should_load_from_env(self) -> None:
        """Settings carrega todos os campos obrigatorios de variaveis de ambiente."""
        env = _make_env()
        with patch.dict(os.environ, env, clear=False):
            s = _TestSettings()
            assert env["DATABASE_URL"] == s.DATABASE_URL
            assert env["REDIS_URL"] == s.REDIS_URL
            assert env["SECRET_KEY"] == s.SECRET_KEY
            assert env["RESEND_API_KEY"] == s.RESEND_API_KEY
            assert env["GOOGLE_CLIENT_ID"] == s.GOOGLE_CLIENT_ID
            assert s.CORS_ORIGINS == ["http://localhost:3000"]

    def test_settings_should_have_debug_false_by_default(self) -> None:
        """DEBUG e False por padrao."""
        env = _make_env()
        with patch.dict(os.environ, env, clear=False):
            s = _TestSettings()
            assert s.DEBUG is False

    def test_settings_should_have_correct_jwt_defaults(self) -> None:
        """JWT defaults: HS256, access 15min, refresh 7d."""
        env = _make_env()
        with patch.dict(os.environ, env, clear=False):
            s = _TestSettings()
            assert s.JWT_ALGORITHM == "HS256"
            assert s.ACCESS_TOKEN_EXPIRE_MINUTES == 15
            assert s.REFRESH_TOKEN_EXPIRE_DAYS == 7


class TestSettingsValidation:
    """Testes para validacao de Settings."""

    def test_settings_should_require_secret_key_min_32_bytes(self) -> None:
        """Settings rejeita SECRET_KEY menor que 32 bytes."""
        env = _make_env({"SECRET_KEY": "short"})
        with (
            patch.dict(os.environ, env, clear=False),
            pytest.raises(ValueError, match="SECRET_KEY must be at least 32 bytes"),
        ):
            _TestSettings()

    def test_settings_should_reject_empty_database_url(self) -> None:
        """Settings rejeita DATABASE_URL vazia."""
        env = _make_env({"DATABASE_URL": ""})
        with patch.dict(os.environ, env, clear=False), pytest.raises(ValueError):
            _TestSettings()
