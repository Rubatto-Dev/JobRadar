from __future__ import annotations

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from src.core.redis import get_redis

# Preset configurations
GLOBAL_AUTH_LIMIT = 100
GLOBAL_AUTH_WINDOW = 60  # 1 min
GLOBAL_ANON_LIMIT = 30
GLOBAL_ANON_WINDOW = 60  # 1 min
LOGIN_LIMIT = 5
LOGIN_WINDOW = 900  # 15 min


async def _check_rate(key: str, limit: int, window: int) -> None:
    redis = get_redis()
    full_key = f"ratelimit:{key}"
    current = await redis.incr(full_key)
    if current == 1:
        await redis.expire(full_key, window)
    if current > limit:
        raise HTTPException(status_code=429, detail="Too many requests")


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path
        ip = request.client.host if request.client else "unknown"

        # Login endpoint: strict rate limiting (5 per 15 min per IP)
        if path == "/api/v1/auth/login" and request.method == "POST":
            await _check_rate(f"login:{ip}", LOGIN_LIMIT, LOGIN_WINDOW)

        # Auth endpoints (register, forgot, etc): moderate limiting
        elif path.startswith("/api/v1/auth/") and request.method == "POST":
            await _check_rate(f"auth:{ip}", GLOBAL_ANON_LIMIT, GLOBAL_ANON_WINDOW)

        # Authenticated endpoints
        elif path.startswith("/api/v1/") and "authorization" in {k.lower() for k in request.headers}:
            auth = request.headers.get("authorization", "")
            # Use token hash for per-user limiting
            token_key = auth[-8:] if len(auth) > 8 else ip
            await _check_rate(f"user:{token_key}", GLOBAL_AUTH_LIMIT, GLOBAL_AUTH_WINDOW)

        # Other API endpoints (anonymous)
        elif path.startswith("/api/v1/"):
            await _check_rate(f"anon:{ip}", GLOBAL_ANON_LIMIT, GLOBAL_ANON_WINDOW)

        return await call_next(request)
