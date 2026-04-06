from __future__ import annotations

from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.core.security import decode_token

_bearer_scheme = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> UUID:
    try:
        payload = decode_token(credentials.credentials)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from e

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    return UUID(payload["sub"])


async def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> UUID:
    try:
        payload = decode_token(credentials.credentials)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from e

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    if not payload.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    return UUID(payload["sub"])
