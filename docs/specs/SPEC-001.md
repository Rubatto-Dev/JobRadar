# SPEC-001 -- Setup do projeto (Docker Compose + FastAPI + config)

> **Data:** 2026-04-06 | **Agente:** My_AI_Team / Task Spec Expert
> **Referencia:** TASK-001 do PROJECT_PLAN.md (linha 125)
> **Status:** Aguardando implementacao
> **Estimativa:** M (4-8h)
> **Linear:** RUB-19

---

## Contexto

Primeira task do JobRadar. Cria a fundacao do projeto: estrutura de pastas, Docker Compose com 3 services (API + PostgreSQL + Redis), configuracao via Pydantic Settings, database async setup, health check endpoint, e logging estruturado.

Tudo que vem depois depende desta task estar funcionando.

**Fluxo que esta task habilita:**
```
[Developer] --> docker compose up --> [API :8000] + [PostgreSQL :5432] + [Redis :6379]
                                          |
                                    GET /health --> 200 OK
                                    GET /docs   --> Swagger UI
```

---

## Pre-requisitos

Nenhum -- esta e a primeira task do projeto.

**Variaveis de ambiente necessarias:** definidas no `.env.example` (criado nesta task).

---

## Escopo desta task

### O que SERA feito
- `docker-compose.yml` com API + PostgreSQL 16 + Redis 7
- `backend/Dockerfile` multi-stage com uv
- `backend/pyproject.toml` com todas as dependencias do projeto
- `backend/src/core/config.py` com Pydantic Settings (validacao SECRET_KEY >= 32 bytes)
- `backend/src/core/database.py` com async engine + session factory
- `backend/src/core/logging.py` com structlog JSON
- `backend/src/main.py` com FastAPI app, health check, CORS, lifespan
- `.env.example` com todas as variaveis
- `Makefile` com comandos essenciais
- Estrutura completa de pastas conforme CLAUDE.md
- `uv.lock` commitado (SEC-008)

### O que NAO SERA feito (fora do escopo)
- Modelos ORM (TASK-002)
- Alembic migrations (TASK-002)
- Endpoints de auth (TASK-003)
- Rate limiting (TASK-024)
- i18n (TASK-025)
- Testes de integracao com banco real (nao ha modelos ainda)

---

## Testes -- ESCREVA ANTES DO CODIGO

> Implementacao so comeca apos os testes estarem escritos e falhando (RED).

### Arquivo de teste 1 -- Unit: Settings
**Caminho:** `backend/tests/unit/core/test_settings.py`

```python
"""Testes unitarios para core/config.py -- Settings."""
import os
from unittest.mock import patch

import pytest


class TestSettings:
    """Testes para carregamento e validacao de Settings."""

    def _make_env(self, overrides: dict[str, str] | None = None) -> dict[str, str]:
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

    def test_settings_should_load_from_env(self) -> None:
        """Settings carrega todos os campos obrigatorios de variaveis de ambiente."""
        env = self._make_env()
        with patch.dict(os.environ, env, clear=False):
            from src.core.config import Settings

            s = Settings()
            assert s.DATABASE_URL == env["DATABASE_URL"]
            assert s.REDIS_URL == env["REDIS_URL"]
            assert s.SECRET_KEY == env["SECRET_KEY"]
            assert s.RESEND_API_KEY == env["RESEND_API_KEY"]
            assert s.GOOGLE_CLIENT_ID == env["GOOGLE_CLIENT_ID"]
            assert s.CORS_ORIGINS == ["http://localhost:3000"]

    def test_settings_should_require_secret_key_min_32_bytes(self) -> None:
        """Settings rejeita SECRET_KEY menor que 32 bytes."""
        env = self._make_env({"SECRET_KEY": "short"})
        with patch.dict(os.environ, env, clear=False):
            from src.core.config import Settings

            with pytest.raises(ValueError, match="SECRET_KEY must be at least 32 bytes"):
                Settings()

    def test_settings_should_have_debug_false_by_default(self) -> None:
        """DEBUG e False por padrao."""
        env = self._make_env()
        with patch.dict(os.environ, env, clear=False):
            from src.core.config import Settings

            s = Settings()
            assert s.DEBUG is False

    def test_settings_should_have_correct_jwt_defaults(self) -> None:
        """JWT defaults: HS256, access 15min, refresh 7d."""
        env = self._make_env()
        with patch.dict(os.environ, env, clear=False):
            from src.core.config import Settings

            s = Settings()
            assert s.JWT_ALGORITHM == "HS256"
            assert s.ACCESS_TOKEN_EXPIRE_MINUTES == 15
            assert s.REFRESH_TOKEN_EXPIRE_DAYS == 7

    def test_settings_should_reject_empty_database_url(self) -> None:
        """Settings rejeita DATABASE_URL vazia."""
        env = self._make_env({"DATABASE_URL": ""})
        with patch.dict(os.environ, env, clear=False):
            from src.core.config import Settings

            with pytest.raises(ValueError):
                Settings()
```

### Arquivo de teste 2 -- Integration: Health endpoint
**Caminho:** `backend/tests/integration/api/test_health_endpoint.py`

```python
"""Testes de integracao para o health endpoint."""
import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest.mark.integration
class TestHealthEndpoint:
    """Testes para GET /health."""

    @pytest.fixture
    def client(self) -> AsyncClient:
        transport = ASGITransport(app=app)
        return AsyncClient(transport=transport, base_url="http://test")

    async def test_health_endpoint_should_return_200(self, client: AsyncClient) -> None:
        """GET /health retorna 200 com status ok."""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data

    async def test_docs_endpoint_should_return_200(self, client: AsyncClient) -> None:
        """GET /docs retorna 200 (Swagger UI)."""
        response = await client.get("/docs")
        assert response.status_code == 200
```

**Comando para rodar so estes testes:**
```bash
cd backend && uv run pytest tests/unit/core/test_settings.py tests/integration/api/test_health_endpoint.py -v
```

**Estado esperado ANTES da implementacao:** TODOS FALHANDO (RED)
**Estado esperado APOS a implementacao:** TODOS PASSANDO (GREEN)

### Rastreabilidade BDD

| Cenario (US) | Teste que implementa | Arquivo |
|--------------|---------------------|---------|
| US-046: API REST versionada | `test_health_endpoint_should_return_200` | test_health_endpoint.py |
| US-048: OpenAPI auto-gerada | `test_docs_endpoint_should_return_200` | test_health_endpoint.py |

---

## Implementacao

### Arquivos envolvidos

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| CRIAR | `docker-compose.yml` | API + PostgreSQL + Redis |
| CRIAR | `backend/Dockerfile` | Multi-stage com uv |
| CRIAR | `backend/pyproject.toml` | Dependencias e config de ferramentas |
| CRIAR | `backend/src/__init__.py` | Package marker |
| CRIAR | `backend/src/main.py` | FastAPI app com health, CORS, lifespan |
| CRIAR | `backend/src/core/__init__.py` | Package marker |
| CRIAR | `backend/src/core/config.py` | Pydantic Settings |
| CRIAR | `backend/src/core/database.py` | Async engine + session |
| CRIAR | `backend/src/core/logging.py` | Structlog config |
| CRIAR | `backend/src/api/__init__.py` | Package marker |
| CRIAR | `backend/src/api/routers/__init__.py` | Package marker |
| CRIAR | `backend/src/services/__init__.py` | Package marker |
| CRIAR | `backend/src/repositories/__init__.py` | Package marker |
| CRIAR | `backend/src/models/__init__.py` | Package marker |
| CRIAR | `backend/src/schemas/__init__.py` | Package marker |
| CRIAR | `backend/src/protocols/__init__.py` | Package marker |
| CRIAR | `backend/src/adapters/__init__.py` | Package marker |
| CRIAR | `backend/src/workers/__init__.py` | Package marker |
| CRIAR | `backend/src/i18n/` | Diretorio vazio (sem __init__) |
| CRIAR | `backend/tests/__init__.py` | Package marker |
| CRIAR | `backend/tests/conftest.py` | Fixtures globais |
| CRIAR | `backend/tests/unit/__init__.py` | Package marker |
| CRIAR | `backend/tests/unit/core/__init__.py` | Package marker |
| CRIAR | `backend/tests/integration/__init__.py` | Package marker |
| CRIAR | `backend/tests/integration/api/__init__.py` | Package marker |
| CRIAR | `backend/tests/e2e/__init__.py` | Package marker |
| CRIAR | `.env.example` | Template de variaveis |
| CRIAR | `Makefile` | Comandos de desenvolvimento |
| NAO TOCAR | `CLAUDE.md` | Ja existe |
| NAO TOCAR | `docs/` | Documentacao ja gerada |

---

### docker-compose.yml

**Caminho:** `docker-compose.yml` (raiz do projeto)
**Proposito:** Orquestrar os 3 services do ambiente de desenvolvimento.

```yaml
services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - ./backend/src:/app/src
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-jobradar}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-jobradar_dev}
      POSTGRES_DB: ${POSTGRES_DB:-jobradar}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-jobradar}"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
```

---

### backend/Dockerfile

**Caminho:** `backend/Dockerfile`
**Proposito:** Build multi-stage com uv para imagem otimizada.

```dockerfile
# Stage 1: Builder
FROM python:3.12-slim AS builder

WORKDIR /app

# Instalar uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copiar arquivos de dependencia
COPY pyproject.toml uv.lock ./

# Instalar dependencias (frozen = respeita uv.lock, SEC-008)
RUN uv sync --frozen --no-dev --no-install-project

# Copiar codigo fonte
COPY src/ ./src/

# Stage 2: Runtime
FROM python:3.12-slim AS runtime

WORKDIR /app

# Copiar venv do builder
COPY --from=builder /app/.venv /app/.venv

# Copiar codigo fonte
COPY --from=builder /app/src /app/src

# Adicionar venv ao PATH
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

**Regras:**
- SEMPRE usar `uv sync --frozen` (SEC-008)
- Nunca copiar `.env` para dentro da imagem
- `--reload` apenas no Dockerfile de dev (docker-compose monta volume)

---

### backend/pyproject.toml

**Caminho:** `backend/pyproject.toml`
**Proposito:** Dependencias do projeto e config de ferramentas.

```toml
[project]
name = "jobradar-backend"
version = "0.1.0"
description = "JobRadar API Backend"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.30",
    "sqlalchemy[asyncio]>=2.0",
    "asyncpg>=0.30",
    "alembic>=1.13",
    "pydantic-settings>=2.0",
    "redis>=5.0",
    "celery[redis]>=5.4",
    "python-jose[cryptography]>=3.3",
    "passlib[bcrypt]>=1.7",
    "httpx>=0.27",
    "resend>=2.0",
    "python-i18n[yaml]>=0.3",
    "structlog>=24.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.24",
    "pytest-cov>=5.0",
    "httpx>=0.27",
    "faker>=30.0",
    "factory-boy>=3.3",
    "freezegun>=1.4",
    "respx>=0.21",
    "testcontainers[postgres]>=4.0",
    "fakeredis>=2.25",
    "ruff>=0.6",
    "mypy>=1.11",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
markers = [
    "unit: unit tests (fast, no DB)",
    "integration: integration tests (real DB/Redis)",
    "e2e: end-to-end tests (full flows)",
    "slow: tests that take > 5s",
]
filterwarnings = ["ignore::DeprecationWarning"]

[tool.coverage.run]
source = ["src"]
omit = ["src/workers/celery_app.py", "src/core/config.py"]

[tool.coverage.report]
fail_under = 80
show_missing = true

[tool.ruff]
target-version = "py312"
line-length = 120

[tool.ruff.lint]
select = ["E", "F", "W", "I", "N", "UP", "S", "B", "A", "C4", "DTZ", "T20", "ICN", "RET", "SIM", "TCH", "ARG", "PTH", "ERA"]
ignore = ["S101"]

[tool.mypy]
python_version = "3.12"
strict = true
plugins = ["pydantic.mypy"]
```

---

### backend/src/core/config.py

**Caminho:** `backend/src/core/config.py`
**Proposito:** Configuracao centralizada via variaveis de ambiente com validacao.

```python
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str
    REDIS_URL: str

    # Security
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # External services
    RESEND_API_KEY: str
    GOOGLE_CLIENT_ID: str

    # App
    CORS_ORIGINS: list[str] = []
    DEBUG: bool = False

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if len(v.encode()) < 32:
            raise ValueError("SECRET_KEY must be at least 32 bytes")
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v:
            raise ValueError("DATABASE_URL must not be empty")
        return v


def get_settings() -> Settings:
    return Settings()
```

**Regras:**
- Nunca acessar `os.environ` direto em qualquer outro arquivo -- sempre usar `get_settings()`
- `extra="ignore"` para nao falhar com variaveis desconhecidas no .env
- `field_validator` com `@classmethod` (Pydantic v2)

---

### backend/src/core/database.py

**Caminho:** `backend/src/core/database.py`
**Proposito:** Engine async e session factory para SQLAlchemy.

```python
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.core.config import get_settings


def _create_engine() -> create_async_engine:
    settings = get_settings()
    return create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_pre_ping=True,
    )


engine = _create_engine()
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
```

---

### backend/src/core/logging.py

**Caminho:** `backend/src/core/logging.py`
**Proposito:** Logging estruturado JSON com structlog.

```python
import sys

import structlog


def setup_logging(*, debug: bool = False) -> None:
    shared_processors: list[structlog.types.Processor] = [
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if debug and sys.stderr.isatty():
        processors = [*shared_processors, structlog.dev.ConsoleRenderer()]
    else:
        processors = [*shared_processors, structlog.processors.JSONRenderer()]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
```

---

### backend/src/main.py

**Caminho:** `backend/src/main.py`
**Proposito:** Ponto de entrada da aplicacao FastAPI.

```python
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import get_settings
from src.core.logging import setup_logging

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
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

    @application.get("/health")
    async def health() -> dict[str, Any]:
        return {"status": "ok", "version": "0.1.0"}

    return application


app = create_app()
```

**Regras:**
- `lifespan` em vez de `@app.on_event` (deprecated no FastAPI 0.115+)
- Health check na raiz (`/health`), nao em `/api/v1/health`
- CORS com `allow_origins` da Settings (nunca wildcard em producao)
- `docs_url="/docs"` explicito

---

### .env.example

**Caminho:** `.env.example` (raiz do projeto)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://jobradar:jobradar_dev@localhost:5432/jobradar
POSTGRES_USER=jobradar
POSTGRES_PASSWORD=jobradar_dev
POSTGRES_DB=jobradar

# Redis
REDIS_URL=redis://localhost:6379/0

# Security (MUDE EM PRODUCAO - minimo 32 bytes)
SECRET_KEY=dev-secret-key-change-in-production-min-32-bytes

# External Services
RESEND_API_KEY=re_your_api_key_here
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# App
CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]
DEBUG=true
```

---

### Makefile

**Caminho:** `Makefile` (raiz do projeto)

```makefile
.PHONY: up down logs lint test shell migrate

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f api

lint:
	cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy --strict src/

test:
	cd backend && uv run pytest -v

test-cov:
	cd backend && uv run pytest --cov=src --cov-report=term-missing -v

shell:
	docker compose exec api bash

migrate:
	docker compose exec api alembic upgrade head
```

---

### backend/tests/conftest.py

**Caminho:** `backend/tests/conftest.py`
**Proposito:** Fixtures globais para testes.

```python
"""Fixtures globais para testes do JobRadar."""
```

---

## Logica de negocio detalhada

N/A -- esta task e puramente de infraestrutura/setup. Nao ha regras de negocio.

---

## Convencoes a seguir

- Imports: ordem stdlib > third-party > local (ruff gerencia via `I`)
- Sem `print()` -- usar `structlog.get_logger()`
- Sem `os.environ` direto -- usar `get_settings()` ou `Settings()`
- Sem secrets hardcoded (`.env.example` tem valores placeholder)
- Type hints em todas as funcoes (mypy --strict)

---

## O que NAO fazer

- **NAO** criar modelos ORM -- pertence a SPEC-002
- **NAO** configurar Alembic -- pertence a SPEC-002
- **NAO** adicionar endpoints alem de `/health` e `/docs`
- **NAO** usar `@app.on_event("startup")` -- deprecated, usar lifespan
- **NAO** usar `os.getenv()` -- usar Pydantic Settings
- **NAO** usar `print()` -- usar structlog
- **NAO** commitar `.env` -- apenas `.env.example`
- **NAO** usar `CORS_ORIGINS=["*"]` -- listar origens explicitas

---

## Validacao apos implementacao

```bash
# 1. Testes passando
cd backend && uv run pytest tests/unit/core/test_settings.py tests/integration/api/test_health_endpoint.py -v
# Esperado: todos os testes desta spec passando

# 2. Lint sem erros
cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy --strict src/
# Esperado: sem erros

# 3. Docker Compose sobe sem erros
docker compose up -d && sleep 5 && curl -s http://localhost:8000/health | python3 -m json.tool
# Esperado: {"status": "ok", "version": "0.1.0"}

# 4. Swagger UI acessivel
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs
# Esperado: 200
```

**Checklist manual:**
- [ ] Todos os testes desta spec passam (GREEN)
- [ ] Nenhum teste existente quebrou (sem regressao)
- [ ] `ruff check .` sem erros
- [ ] `ruff format --check .` sem erros
- [ ] `mypy --strict src/` sem erros
- [ ] `docker compose up` sobe API + PostgreSQL + Redis sem erros
- [ ] `GET /health` retorna 200 com `{"status": "ok", "version": "0.1.0"}`
- [ ] `GET /docs` exibe Swagger UI
- [ ] Configuracao via `.env` com Pydantic Settings
- [ ] Estrutura de pastas conforme CLAUDE.md do projeto
- [ ] SECRET_KEY validada como >= 32 bytes na Settings
- [ ] `uv.lock` presente e commitado (SEC-008)
- [ ] Dockerfile usa `uv sync --frozen`
- [ ] Sem secrets ou dados hardcoded
- [ ] Sem print() de debug
- [ ] Sem TODO/FIXME nao documentados

---

## Rollback e Reversibilidade

N/A -- task sem operacoes irreversiveis. Cria apenas arquivos novos.

---

## Apos a implementacao

Proximos passos obrigatorios:
1. Execute `/review` com o codigo implementado
2. Aguarde aprovacao do review sem issues BLOCKER
3. Execute `/security-review S2` (no checkpoint CP-1, apos Fase 1 completa)
4. Commit com mensagem: `feat(setup): project setup with Docker Compose, FastAPI and config (SPEC-001)`
5. Avance para `/handoff TASK-002`

---

*Gerado por My_AI_Team -- Task Specification Expert*
