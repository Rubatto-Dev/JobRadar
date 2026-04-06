# SPEC-002 -- Modelos de dados ORM + Alembic migrations

> **Data:** 2026-04-06 | **Agente:** My_AI_Team / Task Spec Expert
> **Referencia:** TASK-002 do PROJECT_PLAN.md (linha 201)
> **Status:** Aguardando implementacao
> **Estimativa:** M (4-8h)
> **Linear:** RUB-20

---

## Contexto

Cria todos os modelos SQLAlchemy ORM do JobRadar e configura Alembic para migrations. Esta task define o schema do banco de dados que sera usado por todas as tasks subsequentes. 9 modelos + 1 tabela associativa + 12 indices + 1 trigger para search_vector.

**Fluxo que esta task habilita:**
```
[TASK-001: infra] --> **[TASK-002: modelos + migrations]** --> [TASK-003: auth] + [TASK-013: areas] + [TASK-006: adapters]
                                                                  (todos dependem dos modelos)
```

---

## Pre-requisitos

- [x] SPEC-001: Setup do projeto -- fornece Docker Compose, database.py, pyproject.toml

---

## Escopo desta task

### O que SERA feito
- Base model com UUID PK e timestamps (created_at, updated_at)
- 9 modelos ORM: User, Job, JobSource, UserPreference, Area, Favorite, Application, SearchHistory, AlertLog
- Tabela associativa user_preference_areas (M2M)
- 12 indices conforme ARCHITECTURE.md secao 4.2
- Trigger SQL para atualizar search_vector no Job
- Alembic configurado para async (asyncpg)
- Migration inicial

### O que NAO SERA feito
- Repositories (TASK-003+)
- Endpoints (TASK-003+)
- Seed data
- Factories para testes (serao criadas conforme necessidade)

---

## Testes -- ESCREVA ANTES DO CODIGO

### Arquivo de teste 1 -- Integration: Migrations
**Caminho:** `backend/tests/integration/migrations/test_migrations.py`

```python
"""Testes de integracao para Alembic migrations."""
import subprocess

import pytest


@pytest.mark.integration
class TestMigrations:
    """Testes para upgrade/downgrade de migrations."""

    def test_migration_upgrade_head_should_succeed(self) -> None:
        """alembic upgrade head executa sem erros."""
        result = subprocess.run(
            ["uv", "run", "alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            cwd=".",
        )
        assert result.returncode == 0, f"Upgrade failed: {result.stderr}"

    def test_migration_downgrade_should_succeed(self) -> None:
        """alembic downgrade base executa sem erros."""
        # Primeiro upgrade
        subprocess.run(
            ["uv", "run", "alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            cwd=".",
        )
        # Depois downgrade
        result = subprocess.run(
            ["uv", "run", "alembic", "downgrade", "base"],
            capture_output=True,
            text=True,
            cwd=".",
        )
        assert result.returncode == 0, f"Downgrade failed: {result.stderr}"
```

### Arquivo de teste 2 -- Unit: Modelos
**Caminho:** `backend/tests/unit/models/test_models.py`

```python
"""Testes unitarios para definicao dos modelos ORM."""
import uuid
from datetime import datetime

from sqlalchemy import inspect

from src.models.base import Base
from src.models.user import User
from src.models.job import Job
from src.models.job_source import JobSource
from src.models.preference import UserPreference
from src.models.area import Area
from src.models.favorite import Favorite
from src.models.application import Application
from src.models.search_history import SearchHistory
from src.models.alert_log import AlertLog


class TestModelDefinitions:
    """Testes para verificar definicao correta dos modelos."""

    def test_user_model_should_have_correct_table_name(self) -> None:
        assert User.__tablename__ == "users"

    def test_job_model_should_have_correct_table_name(self) -> None:
        assert Job.__tablename__ == "jobs"

    def test_job_source_model_should_have_correct_table_name(self) -> None:
        assert JobSource.__tablename__ == "job_sources"

    def test_all_models_should_have_uuid_primary_key(self) -> None:
        models = [User, Job, JobSource, UserPreference, Area, Favorite, Application, SearchHistory, AlertLog]
        for model in models:
            mapper = inspect(model)
            pk_cols = mapper.primary_key
            assert len(pk_cols) == 1, f"{model.__name__} should have exactly 1 PK"
            assert pk_cols[0].type.impl.__class__.__name__ == "Uuid", (
                f"{model.__name__} PK should be UUID"
            )

    def test_job_model_should_have_search_vector_column(self) -> None:
        mapper = inspect(Job)
        columns = {c.key for c in mapper.columns}
        assert "search_vector" in columns

    def test_user_model_should_have_all_required_columns(self) -> None:
        mapper = inspect(User)
        columns = {c.key for c in mapper.columns}
        required = {
            "id", "email", "name", "password_hash", "avatar_url", "location",
            "locale", "is_active", "is_admin", "email_verified",
            "lgpd_consent_at", "google_id", "created_at", "updated_at",
        }
        assert required.issubset(columns), f"Missing columns: {required - columns}"

    def test_job_model_should_have_all_required_columns(self) -> None:
        mapper = inspect(Job)
        columns = {c.key for c in mapper.columns}
        required = {
            "id", "external_id", "source_id", "title", "company", "description",
            "requirements", "location", "city", "state", "country", "modality",
            "seniority", "salary_min", "salary_max", "salary_text", "url",
            "published_at", "expires_at", "is_active", "raw_data", "fingerprint",
            "search_vector", "created_at", "updated_at",
        }
        assert required.issubset(columns), f"Missing columns: {required - columns}"

    def test_favorite_should_have_unique_constraint_user_job(self) -> None:
        table = Favorite.__table__
        unique_constraints = [
            c for c in table.constraints
            if hasattr(c, "columns") and len(c.columns) == 2
        ]
        col_sets = [{col.name for col in c.columns} for c in unique_constraints]
        assert {"user_id", "job_id"} in col_sets

    def test_application_should_have_unique_constraint_user_job(self) -> None:
        table = Application.__table__
        unique_constraints = [
            c for c in table.constraints
            if hasattr(c, "columns") and len(c.columns) == 2
        ]
        col_sets = [{col.name for col in c.columns} for c in unique_constraints]
        assert {"user_id", "job_id"} in col_sets

    def test_all_models_registered_in_base_metadata(self) -> None:
        expected_tables = {
            "users", "jobs", "job_sources", "user_preferences", "areas",
            "user_preference_areas", "favorites", "applications",
            "search_history", "alert_logs",
        }
        actual_tables = set(Base.metadata.tables.keys())
        assert expected_tables.issubset(actual_tables), f"Missing: {expected_tables - actual_tables}"
```

**Comando:**
```bash
cd backend && uv run pytest tests/unit/models/test_models.py tests/integration/migrations/test_migrations.py -v
```

---

## Implementacao

### Arquivos envolvidos

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| CRIAR | `backend/src/models/base.py` | DeclarativeBase + mixins |
| CRIAR | `backend/src/models/user.py` | User model |
| CRIAR | `backend/src/models/job.py` | Job model |
| CRIAR | `backend/src/models/job_source.py` | JobSource model |
| CRIAR | `backend/src/models/preference.py` | UserPreference + association table |
| CRIAR | `backend/src/models/area.py` | Area model |
| CRIAR | `backend/src/models/favorite.py` | Favorite model |
| CRIAR | `backend/src/models/application.py` | Application model |
| CRIAR | `backend/src/models/search_history.py` | SearchHistory model |
| CRIAR | `backend/src/models/alert_log.py` | AlertLog model |
| MODIFICAR | `backend/src/models/__init__.py` | Re-export todos os modelos |
| CRIAR | `backend/alembic.ini` | Config Alembic |
| CRIAR | `backend/alembic/env.py` | Alembic env async |
| CRIAR | `backend/alembic/script.py.mako` | Template de migration |
| CRIAR | `backend/alembic/versions/` | Diretorio de migrations |
| MODIFICAR | `backend/src/core/database.py` | Importar Base para metadata |
| NAO TOCAR | `backend/src/main.py` | Nao modificar nesta task |
| NAO TOCAR | `backend/src/core/config.py` | Nao modificar nesta task |

---

### backend/src/models/base.py

```python
import uuid
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class UUIDMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
    )
```

---

### backend/src/models/user.py

```python
import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, UUIDMixin, TimestampMixin


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    locale: Mapped[str] = mapped_column(String(5), nullable=False, server_default="pt-br")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    lgpd_consent_at: Mapped[datetime | None] = mapped_column(nullable=True)
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

    # Relationships
    preference: Mapped["UserPreference | None"] = relationship(back_populates="user", uselist=False)
    favorites: Mapped[list["Favorite"]] = relationship(back_populates="user")
    applications: Mapped[list["Application"]] = relationship(back_populates="user")
    search_history: Mapped[list["SearchHistory"]] = relationship(back_populates="user")
    alert_logs: Mapped[list["AlertLog"]] = relationship(back_populates="user")

    __table_args__ = (
        Index("idx_user_email", "email", unique=True),
        Index("idx_user_google_id", "google_id", unique=True),
    )
```

---

### backend/src/models/job_source.py

```python
from datetime import datetime

from sqlalchemy import String, Boolean, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, UUIDMixin, TimestampMixin


class JobSource(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "job_sources"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    adapter_class: Mapped[str] = mapped_column(String(255), nullable=False)
    base_url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    last_collected_at: Mapped[datetime | None] = mapped_column(nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    collection_interval_minutes: Mapped[int] = mapped_column(Integer, nullable=False, server_default="120")
    total_jobs: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    # Relationships
    jobs: Mapped[list["Job"]] = relationship(back_populates="source")
```

---

### backend/src/models/job.py

```python
import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Integer, Text, Index, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, UUIDMixin, TimestampMixin


class Job(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "jobs"

    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("job_sources.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    modality: Mapped[str | None] = mapped_column(String(20), nullable=True)
    seniority: Mapped[str | None] = mapped_column(String(20), nullable=True)
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_text: Mapped[str | None] = mapped_column(String(100), nullable=True)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    raw_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    fingerprint: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    search_vector: Mapped[str | None] = mapped_column(TSVECTOR, nullable=True)

    # Relationships
    source: Mapped["JobSource"] = relationship(back_populates="jobs")
    favorites: Mapped[list["Favorite"]] = relationship(back_populates="job")
    applications: Mapped[list["Application"]] = relationship(back_populates="job")

    __table_args__ = (
        Index("idx_job_search_vector", "search_vector", postgresql_using="gin"),
        Index("idx_job_fingerprint", "fingerprint", unique=True),
        Index("idx_job_source_active", "source_id", "is_active"),
        Index("idx_job_published", "published_at"),
        Index("idx_job_modality", "modality"),
        Index("idx_job_seniority", "seniority"),
        Index("idx_job_country_state_city", "country", "state", "city"),
    )
```

---

### backend/src/models/area.py

```python
from datetime import datetime

from sqlalchemy import String, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, UUIDMixin


class Area(UUIDMixin, Base):
    __tablename__ = "areas"

    name_pt: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name_en: Mapped[str | None] = mapped_column(String(100), nullable=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(default=func.now(), server_default=func.now())
```

---

### backend/src/models/preference.py

```python
import uuid
from datetime import datetime

from sqlalchemy import Column, ForeignKey, Integer, String, Boolean, Table
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, UUIDMixin, TimestampMixin

user_preference_areas = Table(
    "user_preference_areas",
    Base.metadata,
    Column("preference_id", UUID(as_uuid=True), ForeignKey("user_preferences.id"), primary_key=True),
    Column("area_id", UUID(as_uuid=True), ForeignKey("areas.id"), primary_key=True),
)


class UserPreference(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    modalities: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    locations: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    seniority_levels: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    keywords: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    alert_frequency: Mapped[str] = mapped_column(String(20), nullable=False, server_default="daily")
    alerts_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    # Relationships
    user: Mapped["User"] = relationship(back_populates="preference")
    areas: Mapped[list["Area"]] = relationship(secondary=user_preference_areas)
```

---

### backend/src/models/favorite.py

```python
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, UUIDMixin


class Favorite(UUIDMixin, Base):
    __tablename__ = "favorites"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now(), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="favorites")
    job: Mapped["Job"] = relationship(back_populates="favorites")

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_favorite_user_job"),
        Index("idx_favorite_user_job", "user_id", "job_id", unique=True),
    )
```

---

### backend/src/models/application.py

```python
import uuid
from datetime import datetime

from sqlalchemy import String, Text, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, UUIDMixin


class Application(UUIDMixin, Base):
    __tablename__ = "applications"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="applied")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    applied_at: Mapped[datetime] = mapped_column(default=func.now(), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="applications")
    job: Mapped["Job"] = relationship(back_populates="applications")

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_application_user_job"),
        Index("idx_application_user_status", "user_id", "status"),
    )
```

---

### backend/src/models/search_history.py

```python
import uuid
from datetime import datetime

from sqlalchemy import String, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, UUIDMixin


class SearchHistory(UUIDMixin, Base):
    __tablename__ = "search_history"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    query: Mapped[str] = mapped_column(String(500), nullable=False)
    filters: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=func.now(), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="search_history")

    __table_args__ = (
        Index("idx_search_history_user", "user_id", "created_at"),
    )
```

---

### backend/src/models/alert_log.py

```python
import uuid
from datetime import datetime

from sqlalchemy import String, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, UUIDMixin


class AlertLog(UUIDMixin, Base):
    __tablename__ = "alert_logs"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    job_ids: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    channel: Mapped[str] = mapped_column(String(20), nullable=False, server_default="email")
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="pending")
    sent_at: Mapped[datetime | None] = mapped_column(nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="alert_logs")
```

---

### backend/src/models/__init__.py

```python
from src.models.base import Base
from src.models.user import User
from src.models.job import Job
from src.models.job_source import JobSource
from src.models.preference import UserPreference, user_preference_areas
from src.models.area import Area
from src.models.favorite import Favorite
from src.models.application import Application
from src.models.search_history import SearchHistory
from src.models.alert_log import AlertLog

__all__ = [
    "Base",
    "User",
    "Job",
    "JobSource",
    "UserPreference",
    "user_preference_areas",
    "Area",
    "Favorite",
    "Application",
    "SearchHistory",
    "AlertLog",
]
```

---

### Alembic setup

**backend/alembic.ini:**
```ini
[alembic]
script_location = alembic
sqlalchemy.url = driver://user:pass@localhost/dbname

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

**backend/alembic/env.py:**
```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from src.core.config import get_settings
from src.models import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    settings = get_settings()
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

---

### search_vector trigger

Na migration inicial, adicionar apos a criacao das tabelas:

```python
# No upgrade() da migration:
op.execute("""
    CREATE OR REPLACE FUNCTION update_job_search_vector()
    RETURNS trigger AS $$
    BEGIN
        NEW.search_vector :=
            setweight(to_tsvector('portuguese', coalesce(NEW.title, '')), 'A') ||
            setweight(to_tsvector('portuguese', coalesce(NEW.company, '')), 'B') ||
            setweight(to_tsvector('portuguese', coalesce(NEW.description, '')), 'C') ||
            setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(NEW.company, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_job_search_vector
    BEFORE INSERT OR UPDATE OF title, company, description
    ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_job_search_vector();
""")

# No downgrade() da migration:
op.execute("DROP TRIGGER IF EXISTS trg_job_search_vector ON jobs;")
op.execute("DROP FUNCTION IF EXISTS update_job_search_vector();")
```

---

## O que NAO fazer

- **NAO** criar Enum types para modality/seniority -- sao strings para flexibilidade dos adapters
- **NAO** criar repositories -- pertencem a TASK-003+
- **NAO** usar `relationship(lazy="joined")` -- deixar default (select) para evitar N+1 surpresa
- **NAO** adicionar seeds na migration
- **NAO** modificar main.py ou config.py

---

## Validacao apos implementacao

```bash
# 1. Testes passando
cd backend && uv run pytest tests/unit/models/ tests/integration/migrations/ -v

# 2. Suite completa
cd backend && uv run pytest -v

# 3. Lint
cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy --strict src/

# 4. Alembic manual
docker compose up -d postgres && sleep 3
cd backend && uv run alembic upgrade head
cd backend && uv run alembic downgrade base
```

**Checklist:**
- [ ] 9 modelos + 1 tabela associativa criados
- [ ] Todos os indices do ARCHITECTURE.md 4.2
- [ ] Trigger search_vector funcionando
- [ ] alembic upgrade head sem erros
- [ ] alembic downgrade base sem erros
- [ ] Testes passando
- [ ] ruff + mypy limpos

---

## Rollback e Reversibilidade

| Operacao | Reversivel? | Metodo | Janela |
|----------|------------|--------|--------|
| Migration cria todas as tabelas | Sim | `alembic downgrade base` | Ate proximo deploy |
| Trigger search_vector | Sim | DROP no downgrade | Ate proximo deploy |

---

## Apos a implementacao

1. `/review TASK-002`
2. Commit: `feat(models): add all ORM models and Alembic migrations (SPEC-002)`
3. `/handoff TASK-003`

---

*Gerado por My_AI_Team -- Task Specification Expert*
