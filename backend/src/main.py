from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routers.admin import router as admin_router
from src.api.routers.alerts import router as alerts_router
from src.api.routers.applications import router as applications_router
from src.api.routers.areas import router as areas_router
from src.api.routers.auth import router as auth_router
from src.api.routers.dashboard import router as dashboard_router
from src.api.routers.favorites import router as favorites_router
from src.api.routers.jobs import router as jobs_router
from src.api.routers.preferences import router as preferences_router
from src.api.routers.search_history import router as search_history_router
from src.api.routers.users import router as users_router
from src.core.config import get_settings
from src.core.logging import setup_logging

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    setup_logging(debug=settings.DEBUG)
    await logger.ainfo("JobRadar API starting", debug=settings.DEBUG)
    yield
    await logger.ainfo("JobRadar API shutting down")


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title="JobRadar API",
        version="0.1.0",
        docs_url="/docs",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from src.core.rate_limit import RateLimitMiddleware

    application.add_middleware(RateLimitMiddleware)

    application.include_router(auth_router)
    application.include_router(users_router)
    application.include_router(areas_router)
    application.include_router(jobs_router)
    application.include_router(preferences_router)
    application.include_router(search_history_router)
    application.include_router(favorites_router)
    application.include_router(applications_router)
    application.include_router(alerts_router)
    application.include_router(dashboard_router)
    application.include_router(admin_router)

    @application.get("/health")
    async def health() -> dict[str, Any]:
        return {"status": "ok", "version": "0.1.0"}

    return application


app = create_app()
