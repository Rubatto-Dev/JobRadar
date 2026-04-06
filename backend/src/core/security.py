from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
from jose import JWTError, jwt

from src.core.config import get_settings

_BCRYPT_ROUNDS = 12


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode(), salt).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: uuid.UUID) -> str:
    settings = get_settings()
    expires = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    claims = {
        "sub": str(user_id),
        "type": "access",
        "exp": expires,
        "iat": datetime.now(UTC),
    }
    result: str = jwt.encode(claims, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return result


def create_refresh_token(user_id: uuid.UUID) -> str:
    settings = get_settings()
    expires = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    claims = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": expires,
        "iat": datetime.now(UTC),
        "jti": str(uuid.uuid4()),
    }
    result: str = jwt.encode(claims, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return result


def create_verification_token(user_id: uuid.UUID, token_type: str = "email_verify", expires_hours: int = 24) -> str:
    settings = get_settings()
    expires = datetime.now(UTC) + timedelta(hours=expires_hours)
    claims = {
        "sub": str(user_id),
        "type": token_type,
        "exp": expires,
        "iat": datetime.now(UTC),
    }
    result: str = jwt.encode(claims, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return result


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        result: dict[str, Any] = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return result
    except JWTError as e:
        from src.core.exceptions import InvalidTokenError

        raise InvalidTokenError(str(e)) from e
