from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routers.auth import router as auth_router
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

    application.include_router(auth_router)
    application.include_router(users_router)

    @application.get("/health")
    async def health() -> dict[str, Any]:
        return {"status": "ok", "version": "0.1.0"}

    return application


app = create_app()
