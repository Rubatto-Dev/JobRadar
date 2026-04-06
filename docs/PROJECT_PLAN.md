# PROJECT_PLAN.md -- JobRadar

> **Versao:** 1.0 | **Data:** 2026-04-04 | **Status:** Validado
> **Agente:** Plan Agent
> **Documentos consolidados:** CONTEXT.md, PRODUCT_SPEC.md, ARCHITECTURE.md, USER_STORIES.md, TEST_STRATEGY.md, SECURITY-S1.md, CLAUDE.md

---

## 1. Visao Geral

**27 tasks** organizadas em **6 fases** com dependencias explicitas. Fases 2 e 3 podem rodar em paralelo apos TASK-002.

**Estimativa total:** ~130-180h de desenvolvimento (sem frontend)

| Fase | Nome | Tasks | Estimativa | Paralelismo |
|------|------|-------|------------|-------------|
| 1 | Fundacao (Infra + Auth) | 8 tasks | ~30-50h | TASK-013, TASK-024, TASK-025 paralelos apos TASK-002; TASK-004, TASK-005, TASK-024 paralelos apos TASK-003 |
| 2 | Agregacao de Vagas | 6 tasks | ~24-40h | TASK-007, TASK-008, TASK-009 paralelos apos TASK-006 |
| 3 | Preferencias + Busca | 4 tasks | ~16-28h | TASK-012 paralelo com Fase 2; TASK-014 independente |
| 4 | Favoritos, Candidaturas, Alertas | 4 tasks | ~16-28h | TASK-016, TASK-017 paralelos |
| 5 | Dashboard + Admin | 3 tasks | ~16-28h | TASK-020 paralelo com TASK-022 |
| 6 | LGPD + Exportacao | 2 tasks | ~4-8h | TASK-026, TASK-027 paralelos |

---

## 2. Mapa de Dependencias Global

```
FASE 1:
TASK-001 ──────────────────────────────────► TASK-002
                                                │
                                    ┌───────────┼───────────┐
                                    ▼           ▼           ▼
                                TASK-003    TASK-025    TASK-013
                                    │           (i18n)    (areas)
                              ┌─────┼─────┐
                              ▼     ▼     ▼
                          TASK-004 TASK-005 TASK-024
                          (OAuth) (perfil) (rate limit)

FASE 2 (paralela com Fase 3 apos TASK-002):
TASK-006 ──────────────┬────────────────────┐
    │                  │                    │
    ▼                  ▼                    ▼
TASK-007          TASK-008             TASK-009
(Gupy)            (Remotive)           (norm+dedup)
    │                  │                    │
    └──────────────────┼────────────────────┘
                       ▼
                   TASK-010 (Celery + worker coleta)
                       │
                       ▼
                   TASK-011 (expiracao)

FASE 3 (paralela com Fase 2):
TASK-012 (preferencias, depende TASK-003+TASK-013)
TASK-014 (busca, depende TASK-002)
    │
    ▼
TASK-015 (paginacao)
    │
    ▼
TASK-021 (historico busca)

FASE 4:
TASK-016 (favoritos, depende TASK-003+TASK-002)
TASK-017 (candidaturas, depende TASK-003+TASK-002)
TASK-018 (alertas, depende TASK-010+TASK-012)
    │
    ▼
TASK-019 (config alertas)

FASE 5:
TASK-020 (dashboard, depende TASK-012+TASK-014)
TASK-022 (admin, depende TASK-010)
    │
    ▼
TASK-023 (admin CRUD fontes+areas)

FASE 6:
TASK-026 (export LGPD, depende TASK-005+TASK-012+TASK-016+TASK-017)
TASK-027 (export CSV, depende TASK-017)
```

---

## 3. Checkpoints de Review

| Checkpoint | Apos | Escopo | Acoes |
|------------|------|--------|-------|
| CP-1 | Fase 1 completa | Auth + perfil + infra | `/review` + `/security-review S2` -- verificar SEC-001, SEC-003, SEC-004, SEC-005, SEC-008 |
| CP-2 | Fase 2 completa | Workers + adapters | `/review` + `/security-review S2` -- verificar SEC-009 (User-Agent nos adapters) |
| CP-3 | Fase 3 completa | Busca + preferencias | `/review` |
| CP-4 | Fase 4 completa | Favoritos + candidaturas + alertas | `/review` + `/security-review S2` -- verificar SEC-002 (IDOR), SEC-006 |
| CP-5 | Fases 5-6 completas | Dashboard + admin + LGPD | `/review` + `/security-review S2` -- verificar SEC-001 (admin), SEC-010 (LGPD) |
| CP-FINAL | Todas as fases | Sistema completo | `/tech-docs` + `/security-review S3` + `/deploy` |

---

## 4. Fluxo de Trabalho por Task

```
/handoff TASK-XXX → SPEC-XXX.md
    → TDD (escrever testes primeiro)
    → Implementacao
    → ruff check . && ruff format --check . && mypy --strict
    → /review TASK-XXX → REVIEW-XXX.md (APROVADO?)
    → /security-review S2 (no checkpoint da fase)
    → commit (feat/fix/refactor)
```

---

## 5. Tasks Detalhadas

---

### FASE 1 -- Fundacao (Infra + Auth)

**Objetivo:** Projeto rodando com Docker Compose, banco migrado, auth completa (email + Google OAuth), perfil do usuario, rate limiting, i18n.
**Pre-requisitos:** Nenhum

---

#### TASK-001 -- Setup do projeto

| Campo | Valor |
|-------|-------|
| **ID** | TASK-001 |
| **Titulo** | Setup do projeto (Docker Compose + FastAPI + config) |
| **Tipo** | Backend |
| **Fase** | 1 |
| **Depends on** | Nenhuma |
| **Estimativa** | M (4-8h) |
| **Delegavel Codex** | Nao |

**Descricao:** Criar estrutura base do projeto com Docker Compose (API + PostgreSQL + Redis), FastAPI com health check, Pydantic Settings para configuracao via .env, e estrutura de pastas conforme CLAUDE.md.

**Arquivos a criar/modificar:**
- `docker-compose.yml` (criar)
- `backend/pyproject.toml` (criar)
- `backend/src/core/config.py` (criar)
- `backend/src/core/database.py` (criar)
- `backend/src/main.py` (criar)
- `.env.example` (criar)
- `Makefile` (criar)
- `backend/Dockerfile` (criar)

**Contrato:**
```python
# core/config.py
class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str  # >= 32 bytes (SEC-004)
    JWT_ALGORITHM: str = "HS256"  # padronizado HS256 (SEC-004)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    RESEND_API_KEY: str
    GOOGLE_CLIENT_ID: str
    CORS_ORIGINS: list[str]
    DEBUG: bool = False

# core/database.py
async def get_db() -> AsyncGenerator[AsyncSession, None]: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_health_endpoint_should_return_200 | integration | test_auth_endpoints.py |
| test_settings_should_load_from_env | unit | test_security.py |
| test_settings_should_require_secret_key_min_32_bytes | unit | test_security.py |

**User stories:** US-046 (API versionada REST), US-048 (OpenAPI auto-gerada)

**Security findings:**
- **SEC-004:** Padronizar JWT como HS256. SECRET_KEY >= 256 bits (32+ bytes).
- **SEC-008:** Commitar `uv.lock`, usar `uv sync --frozen` no Dockerfile.

**Criterios de aceite:**
- [ ] `docker compose up` sobe API + PostgreSQL + Redis sem erros
- [ ] `GET /health` retorna 200
- [ ] `GET /docs` exibe Swagger UI
- [ ] Configuracao via `.env` com Pydantic Settings
- [ ] Estrutura de pastas conforme CLAUDE.md do projeto
- [ ] SECRET_KEY validada como >= 32 bytes na Settings
- [ ] `uv.lock` commitado, Dockerfile usa `uv sync --frozen`

**Definition of Done:**
- [ ] Codigo implementado conforme contrato
- [ ] Testes obrigatorios escritos e passando
- [ ] `ruff check . && ruff format --check .` sem erros
- [ ] `mypy --strict` sem erros
- [ ] Sem secrets ou dados sensiveis no codigo
- [ ] Sem print() -- usar logger estruturado
- [ ] Commit com mensagem convencional

---

#### TASK-002 -- Modelos de dados + migrations

| Campo | Valor |
|-------|-------|
| **ID** | TASK-002 |
| **Titulo** | Modelos de dados ORM + Alembic migrations |
| **Tipo** | Backend |
| **Fase** | 1 |
| **Depends on** | TASK-001 |
| **Estimativa** | M (4-8h) |
| **Delegavel Codex** | Nao |

**Descricao:** Criar todos os modelos SQLAlchemy (User, Job, JobSource, UserPreference, Area, Favorite, Application, SearchHistory, AlertLog) com indices e trigger para search_vector. Configurar Alembic para migrations.

**Arquivos a criar/modificar:**
- `backend/src/models/base.py` (criar)
- `backend/src/models/user.py` (criar)
- `backend/src/models/job.py` (criar)
- `backend/src/models/job_source.py` (criar)
- `backend/src/models/preference.py` (criar)
- `backend/src/models/area.py` (criar)
- `backend/src/models/favorite.py` (criar)
- `backend/src/models/application.py` (criar)
- `backend/src/models/search_history.py` (criar)
- `backend/src/models/alert_log.py` (criar)
- `backend/alembic.ini` (criar)
- `backend/alembic/` (criar)

**Contrato:**
```python
# models/user.py
class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID]
    email: Mapped[str]  # UNIQUE
    name: Mapped[str]
    password_hash: Mapped[str | None]
    # ... todos os campos da secao 4.2 do ARCHITECTURE.md

# Todos os modelos da secao 4 com indices definidos
# Trigger para atualizar search_vector em INSERT/UPDATE
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_migration_upgrade_head_should_succeed | integration | test_migrations.py |
| test_migration_downgrade_should_succeed | integration | test_migrations.py |

**User stories:** N/A (infra)

**Security findings:** Nenhum diretamente.

**Criterios de aceite:**
- [ ] Todos os modelos da secao 4 do ARCHITECTURE.md criados
- [ ] `alembic upgrade head` executa sem erros
- [ ] Todos os indices da secao 4.2 criados
- [ ] Trigger para atualizar search_vector criado
- [ ] `alembic downgrade` funciona

**Definition of Done:**
- [ ] Codigo implementado conforme contrato
- [ ] Testes obrigatorios escritos e passando
- [ ] `ruff check . && ruff format --check .` sem erros
- [ ] `mypy --strict` sem erros
- [ ] Sem secrets no codigo
- [ ] Commit com mensagem convencional

---

#### TASK-003 -- Auth (registro, login, JWT)

| Campo | Valor |
|-------|-------|
| **ID** | TASK-003 |
| **Titulo** | Autenticacao: registro, login, JWT, email verification, forgot/reset password |
| **Tipo** | Backend |
| **Fase** | 1 |
| **Depends on** | TASK-002 |
| **Estimativa** | L (1-2d) |
| **Delegavel Codex** | Nao |

**Descricao:** Implementar fluxo completo de autenticacao por email/senha: registro com validacao de senha, login com JWT (access 15min + refresh 7d), refresh token com blacklist no Redis, email verification via Resend, forgot/reset password com token expiravel 30min. Bcrypt cost 12. LGPD consent no registro.

**Arquivos a criar/modificar:**
- `backend/src/api/routers/auth.py` (criar)
- `backend/src/services/auth_service.py` (criar)
- `backend/src/repositories/user_repository.py` (criar)
- `backend/src/protocols/auth.py` (criar)
- `backend/src/schemas/auth.py` (criar)
- `backend/src/core/security.py` (criar)
- `backend/src/core/exceptions.py` (criar)

**Contrato:**
```python
# protocols/auth.py
class UserRepositoryProtocol(Protocol):
    async def get_by_email(self, email: str) -> User | None: ...
    async def get_by_id(self, user_id: UUID) -> User | None: ...
    async def create(self, data: UserCreate) -> User: ...
    async def update(self, user_id: UUID, data: UserUpdate) -> User: ...
    async def delete(self, user_id: UUID) -> None: ...

# services/auth_service.py
class AuthService:
    def __init__(self, user_repo: UserRepositoryProtocol): ...
    async def register(self, data: RegisterRequest) -> User: ...
    async def login(self, email: str, password: str) -> TokenPair: ...
    async def refresh_token(self, refresh_token: str) -> str: ...
    async def verify_email(self, token: str) -> None: ...
    async def forgot_password(self, email: str) -> None: ...
    async def reset_password(self, token: str, password: str) -> None: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_register_should_create_user_with_hashed_password | unit | test_auth_service.py |
| test_register_when_weak_password_should_return_400 | unit | test_auth_service.py |
| test_register_when_duplicate_email_should_return_409 | unit | test_auth_service.py |
| test_login_should_return_token_pair | unit | test_auth_service.py |
| test_login_when_invalid_credentials_should_return_401 | unit | test_auth_service.py |
| test_refresh_token_should_return_new_access_token | unit | test_auth_service.py |
| test_verify_email_should_activate_user | unit | test_auth_service.py |
| test_refresh_when_blacklisted_token_should_return_401 | unit | test_auth_service.py |
| test_jwt_should_use_hs256_algorithm | unit | test_security.py |

**User stories:** US-001 (cadastro), US-003 (recuperacao senha), US-006 (confirmacao email), US-007 (login)

**Security findings:**
- **SEC-003:** Implementar blacklist de refresh tokens no Redis. Ao fazer logout ou delete account, adicionar refresh token a blacklist. Verificar blacklist antes de emitir novo access token.
- **SEC-004:** JWT HS256, SECRET_KEY >= 256 bits.
- **SEC-005:** Rate limiting especifico para login: 5 tentativas/15min por email, 20/15min por IP.

**Criterios de aceite:**
- [ ] Registro com validacao de senha (min 8, 1 maiuscula, 1 numero)
- [ ] Login retorna access_token (15min) e refresh_token (7d)
- [ ] Email de confirmacao enviado via Resend
- [ ] Recuperacao de senha com token expiravel (30min)
- [ ] Senha com bcrypt cost 12
- [ ] LGPD consent registrado no cadastro (lgpd_consent_at)
- [ ] Refresh token blacklist no Redis (SEC-003)
- [ ] Rate limiting em login: 5/15min por email, 20/15min por IP (SEC-005)
- [ ] Resposta generica em forgot-password ("If email exists...")

**Definition of Done:**
- [ ] Codigo implementado conforme contrato
- [ ] Testes obrigatorios escritos e passando
- [ ] Coverage >= 85% (services)
- [ ] `ruff check . && ruff format --check .` sem erros
- [ ] `mypy --strict` sem erros
- [ ] Sem secrets no codigo, sem print()
- [ ] Sem `from sqlalchemy` em services
- [ ] Controller com max 5 linhas de logica
- [ ] Commit com mensagem convencional

---

#### TASK-004 -- Auth Google OAuth

| Campo | Valor |
|-------|-------|
| **ID** | TASK-004 |
| **Titulo** | Autenticacao via Google OAuth (ID token) |
| **Tipo** | Backend |
| **Fase** | 1 |
| **Depends on** | TASK-003 |
| **Estimativa** | M (4-8h) |
| **Delegavel Codex** | Nao |

**Descricao:** Adicionar endpoint de login/registro via Google ID token. Cria usuario se nao existe, vincula google_id. Retorna token pair identico ao login normal.

**Arquivos a criar/modificar:**
- `backend/src/api/routers/auth.py` (modificar -- adicionar endpoint)
- `backend/src/services/auth_service.py` (modificar -- adicionar metodo)

**Contrato:**
```python
# services/auth_service.py (adicao)
async def google_auth(self, credential: str) -> TokenPair: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_google_auth_new_user_should_create_and_return_tokens | unit | test_auth_service.py |
| test_google_auth_existing_user_should_return_tokens | unit | test_auth_service.py |
| test_google_auth_when_invalid_token_should_return_401 | unit | test_auth_service.py |

**User stories:** US-002 (login via Google OAuth)

**Security findings:** Nenhum adicional.

**Criterios de aceite:**
- [ ] Login/registro via Google ID token
- [ ] Cria usuario se nao existe, vincula google_id
- [ ] Retorna token pair identico ao login normal
- [ ] Validacao do ID token no backend (nao confiar no frontend)

**Definition of Done:**
- [ ] Codigo implementado conforme contrato
- [ ] Testes obrigatorios escritos e passando
- [ ] Sem `from sqlalchemy` em services
- [ ] Controller com max 5 linhas de logica
- [ ] `ruff check . && ruff format --check .` + `mypy --strict` sem erros
- [ ] Commit com mensagem convencional

---

#### TASK-005 -- Perfil do usuario (CRUD + LGPD)

| Campo | Valor |
|-------|-------|
| **ID** | TASK-005 |
| **Titulo** | CRUD perfil do usuario + exclusao LGPD + export dados |
| **Tipo** | Backend |
| **Fase** | 1 |
| **Depends on** | TASK-003 |
| **Estimativa** | M (4-8h) |
| **Delegavel Codex** | Nao |

**Descricao:** Endpoints GET/PATCH/DELETE /users/me + GET /users/me/export. DELETE remove todos os dados pessoais (LGPD). Export retorna JSON com todos os dados do usuario. PATCH nao aceita is_admin (SEC-001).

**Arquivos a criar/modificar:**
- `backend/src/api/routers/users.py` (criar)
- `backend/src/services/user_service.py` (criar)
- `backend/src/schemas/user.py` (criar)

**Contrato:**
```python
# services/user_service.py
class UserService:
    async def get_profile(self, user_id: UUID) -> UserProfile: ...
    async def update_profile(self, user_id: UUID, data: UserUpdate) -> UserProfile: ...
    async def delete_account(self, user_id: UUID, password: str) -> None: ...
    async def export_data(self, user_id: UUID) -> UserExport: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_get_profile_should_return_user_data | unit | test_user_service.py |
| test_update_profile_should_update_allowed_fields | unit | test_user_service.py |
| test_delete_account_should_remove_all_personal_data | unit | test_user_service.py |
| test_delete_account_when_wrong_password_should_return_401 | unit | test_user_service.py |
| test_export_data_should_include_all_user_data | unit | test_user_service.py |
| test_update_profile_should_not_accept_is_admin_field | unit | test_user_service.py |
| test_delete_account_should_blacklist_refresh_token | unit | test_user_service.py |

**User stories:** US-004 (editar perfil), US-005 (exclusao conta LGPD)

**Security findings:**
- **SEC-001:** Schema `UserUpdate` NAO deve aceitar `is_admin`. Enforce no Pydantic schema.
- **SEC-003:** Delete account deve blacklistar refresh token no Redis.

**Criterios de aceite:**
- [ ] GET /users/me retorna perfil completo
- [ ] PATCH /users/me atualiza campos permitidos (nome, location, avatar_url, locale)
- [ ] PATCH /users/me rejeita `is_admin` no body (SEC-001)
- [ ] DELETE /users/me remove todos os dados pessoais (LGPD) e blacklista refresh token
- [ ] GET /users/me/export retorna JSON com todos os dados do usuario (sem password_hash)

**Definition of Done:**
- [ ] Codigo implementado conforme contrato
- [ ] Testes obrigatorios escritos e passando
- [ ] Coverage >= 85% (services)
- [ ] Sem `from sqlalchemy` em services
- [ ] Controller com max 5 linhas de logica
- [ ] `ruff` + `mypy` sem erros
- [ ] Commit com mensagem convencional

---

#### TASK-013 -- CRUD areas de atuacao

| Campo | Valor |
|-------|-------|
| **ID** | TASK-013 |
| **Titulo** | CRUD areas de atuacao (lista publica + admin) |
| **Tipo** | Backend |
| **Fase** | 1 |
| **Depends on** | TASK-002 |
| **Estimativa** | S (<=4h) |
| **Delegavel Codex** | Nao |

**Descricao:** Endpoint publico GET /areas (areas ativas com nome localizado). Endpoints admin POST/PATCH /admin/areas. Slug gerado automaticamente a partir de name_pt.

**Arquivos a criar/modificar:**
- `backend/src/api/routers/areas.py` (criar)
- `backend/src/services/area_service.py` (criar)
- `backend/src/repositories/area_repository.py` (criar)
- `backend/src/schemas/area.py` (criar)

**Contrato:**
```python
class AreaService:
    async def list_active(self, locale: str) -> list[AreaResponse]: ...
    async def create(self, data: AreaCreate) -> AreaResponse: ...
    async def update(self, area_id: UUID, data: AreaUpdate) -> AreaResponse: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_list_areas_should_return_active_only | unit | test_area_service.py |
| test_create_area_should_generate_slug | unit | test_area_service.py |

**User stories:** US-009 (selecionar areas), US-043 (gerenciar areas)

**Security findings:** Nenhum.

**Criterios de aceite:**
- [ ] GET /areas retorna areas ativas com nome localizado
- [ ] Admin pode criar e atualizar areas
- [ ] Slug gerado automaticamente a partir de name_pt

**Definition of Done:**
- [ ] Testes passando, `ruff` + `mypy` limpos
- [ ] Sem `from sqlalchemy` em services
- [ ] Commit com mensagem convencional

---

#### TASK-024 -- Rate limiting

| Campo | Valor |
|-------|-------|
| **ID** | TASK-024 |
| **Titulo** | Rate limiting global + especifico para login |
| **Tipo** | Backend |
| **Fase** | 1 |
| **Depends on** | TASK-001 |
| **Estimativa** | S (<=4h) |
| **Delegavel Codex** | Nao |

**Descricao:** Rate limiting via Redis: 100 req/min para autenticados, 30 req/min para nao-autenticados (por IP). Rate limiting especifico para login: 5 tentativas/15min por email, 20/15min por IP (SEC-005).

**Arquivos a criar/modificar:**
- `backend/src/core/rate_limit.py` (criar)
- `backend/src/core/dependencies.py` (criar/modificar)

**Contrato:**
```python
class RateLimiter:
    async def check(self, key: str, limit: int, window: int) -> None: ...
    # Raises RateLimitExceeded se excedido
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_rate_limit_should_allow_under_limit | unit | test_rate_limit.py |
| test_rate_limit_should_block_over_limit | unit | test_rate_limit.py |
| test_rate_limit_should_return_retry_after_header | integration | test_rate_limit.py |
| test_login_should_block_after_5_attempts_per_email | integration | test_rate_limit.py |
| test_login_should_block_after_20_attempts_per_ip | integration | test_rate_limit.py |

**User stories:** US-049 (rate limiting)

**Security findings:**
- **SEC-005:** Rate limiting especifico para login: 5 tentativas/15min por email, 20 tentativas/15min por IP.

**Criterios de aceite:**
- [ ] 100 req/min para autenticados
- [ ] 30 req/min para nao-autenticados (por IP)
- [ ] 5 tentativas de login/15min por email (SEC-005)
- [ ] 20 tentativas de login/15min por IP (SEC-005)
- [ ] Headers X-RateLimit-* nas responses
- [ ] Response 429 com Retry-After

**Definition of Done:**
- [ ] Testes passando, `ruff` + `mypy` limpos
- [ ] Commit com mensagem convencional

---

#### TASK-025 -- i18n backend

| Campo | Valor |
|-------|-------|
| **ID** | TASK-025 |
| **Titulo** | Internacionalizacao backend (PT-BR + EN) |
| **Tipo** | Backend |
| **Fase** | 1 |
| **Depends on** | TASK-001 |
| **Estimativa** | M (4-8h) |
| **Delegavel Codex** | Nao |

**Descricao:** i18n com python-i18n (YAML). Middleware detecta locale do header Accept-Language ou user.locale. Funcao `t()` disponivel em services. Todas as mensagens de erro traduzidas PT-BR + EN.

**Arquivos a criar/modificar:**
- `backend/src/core/i18n.py` (criar)
- `backend/src/i18n/pt-br.yml` (criar)
- `backend/src/i18n/en.yml` (criar)
- `backend/src/core/middleware.py` (criar)

**Contrato:**
```python
def t(key: str, locale: str = "pt-br", **kwargs: Any) -> str: ...
def get_locale_from_request(request: Request) -> str: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_t_should_return_pt_br_by_default | unit | test_i18n.py |
| test_t_should_return_en_when_locale_en | unit | test_i18n.py |
| test_middleware_should_detect_locale_from_header | integration | test_i18n.py |

**User stories:** US-050 (i18n do backend)

**Security findings:** Nenhum.

**Criterios de aceite:**
- [ ] Middleware detecta locale do header Accept-Language
- [ ] Fallback para user.locale se autenticado
- [ ] Todas as mensagens de erro traduzidas (PT-BR + EN)
- [ ] Funcao `t()` disponivel em services

**Definition of Done:**
- [ ] Testes passando, `ruff` + `mypy` limpos
- [ ] Commit com mensagem convencional

---

### >> CHECKPOINT CP-1: `/review` + `/security-review S2`

**Verificar:** SEC-001 (UserUpdate nao aceita is_admin), SEC-003 (refresh token blacklist), SEC-004 (HS256, SECRET_KEY >= 32 bytes), SEC-005 (rate limiting login), SEC-008 (uv.lock commitado).

---

### FASE 2 -- Agregacao de Vagas

**Objetivo:** Workers coletando vagas de Gupy e Remotive periodicamente, com normalizacao e deduplicacao.
**Pre-requisitos:** TASK-001 e TASK-002 (minimo)
**Paralelismo:** Fase 2 roda em paralelo com Fase 3

---

#### TASK-006 -- Adapter pattern base + JobSource

| Campo | Valor |
|-------|-------|
| **ID** | TASK-006 |
| **Titulo** | Protocol base para adapters + CollectionService + repositories |
| **Tipo** | Backend |
| **Fase** | 2 |
| **Depends on** | TASK-002 |
| **Estimativa** | M (4-8h) |
| **Delegavel Codex** | Nao |

**Descricao:** Definir JobSourceAdapterProtocol com RawJob dataclass. CollectionService orquestra coleta, normalizacao e persistencia. JobRepository com deduplicacao por fingerprint.

**Arquivos a criar/modificar:**
- `backend/src/protocols/job_source.py` (criar)
- `backend/src/services/collection_service.py` (criar)
- `backend/src/repositories/job_repository.py` (criar)
- `backend/src/repositories/source_repository.py` (criar)

**Contrato:**
```python
@runtime_checkable
class JobSourceAdapterProtocol(Protocol):
    source_slug: str
    async def collect(self, config: dict[str, Any]) -> list[RawJob]: ...

@dataclass
class RawJob:
    external_id: str
    title: str
    company: str
    description: str
    requirements: str | None
    location: str | None
    city: str | None
    state: str | None
    country: str | None
    modality: str | None
    seniority: str | None
    salary_min: int | None
    salary_max: int | None
    salary_text: str | None
    url: str
    published_at: datetime | None
    raw_data: dict[str, Any]

class CollectionService:
    async def collect_from_source(self, source_id: UUID) -> CollectionResult: ...
    async def get_adapter(self, adapter_class: str) -> JobSourceAdapterProtocol: ...

@dataclass
class CollectionResult:
    source_slug: str
    total_fetched: int
    new_jobs: int
    duplicates_skipped: int
    errors: int
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_collection_service_should_persist_new_jobs | unit | test_collection_service.py |
| test_collection_service_should_skip_duplicates | unit | test_collection_service.py |
| test_collection_service_should_return_result_summary | unit | test_collection_service.py |

**User stories:** US-015 (coleta automatica), US-019 (adicao de novas fontes sem alterar codigo)

**Security findings:**
- **SEC-009:** Incluir header `User-Agent` identificando o JobRadar nos requests dos adapters.
- **SEC-012:** `base_url` do JobSource nao aceita input de usuario final.

**Criterios de aceite:**
- [ ] Protocol definido para adapters
- [ ] RawJob dataclass com todos os campos normalizados
- [ ] CollectionService orquestra coleta, normalizacao e persistencia
- [ ] JobRepository implementa persist com deduplicacao por fingerprint
- [ ] Adapters incluem header User-Agent

**Definition of Done:**
- [ ] Testes passando, `ruff` + `mypy` limpos
- [ ] Sem `from sqlalchemy` em services
- [ ] Commit com mensagem convencional

---

#### TASK-007 -- Adapter Gupy

| Campo | Valor |
|-------|-------|
| **ID** | TASK-007 |
| **Titulo** | Adapter para Gupy API |
| **Tipo** | Backend |
| **Fase** | 2 |
| **Depends on** | TASK-006 |
| **Estimativa** | M (4-8h) |
| **Delegavel Codex** | Nao |
| **Paralelizavel** | Sim (com TASK-008, TASK-009) |

**Descricao:** Adapter que coleta vagas da API Gupy (portal.api.gupy.io/api/v1/jobs) com paginacao offset/limit. Mapeia campos para RawJob. Respeita rate limiting (max 1 req/seg). Retry com backoff exponencial.

**Arquivos a criar/modificar:**
- `backend/src/adapters/gupy.py` (criar)

**Contrato:**
```python
class GupyAdapter:
    source_slug = "gupy"
    async def collect(self, config: dict[str, Any]) -> list[RawJob]: ...
    # Endpoint: portal.api.gupy.io/api/v1/jobs
    # Paginacao: offset/limit
    # Campos mapeados: name->title, careerPageName->company,
    #   city, state, country, workplaceType->modality, jobUrl->url
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_gupy_adapter_should_map_fields_correctly | integration | test_gupy_adapter.py |
| test_gupy_adapter_should_paginate_all_results | integration | test_gupy_adapter.py |
| test_gupy_adapter_should_handle_network_error | integration | test_gupy_adapter.py |

**User stories:** US-015 (coleta automatica)

**Security findings:** Nenhum adicional.

**Criterios de aceite:**
- [ ] Coleta vagas da API Gupy com paginacao completa
- [ ] Mapeia campos para RawJob corretamente
- [ ] Respeita rate limiting (max 1 req/seg)
- [ ] Trata erros de rede com retry (3 tentativas, backoff exponencial)
- [ ] Inclui User-Agent header

**Definition of Done:**
- [ ] Testes passando (mock httpx com respx)
- [ ] `ruff` + `mypy` limpos
- [ ] Commit com mensagem convencional

---

#### TASK-008 -- Adapter Remotive

| Campo | Valor |
|-------|-------|
| **ID** | TASK-008 |
| **Titulo** | Adapter para Remotive API |
| **Tipo** | Backend |
| **Fase** | 2 |
| **Depends on** | TASK-006 |
| **Estimativa** | M (4-8h) |
| **Delegavel Codex** | Nao |
| **Paralelizavel** | Sim (com TASK-007, TASK-009) |

**Descricao:** Adapter que coleta vagas da API Remotive (remotive.com/api/remote-jobs). Sem paginacao (retorna tudo). Respeita limite de 4 requests/dia. Strip HTML da descricao.

**Arquivos a criar/modificar:**
- `backend/src/adapters/remotive.py` (criar)

**Contrato:**
```python
class RemotiveAdapter:
    source_slug = "remotive"
    async def collect(self, config: dict[str, Any]) -> list[RawJob]: ...
    # Endpoint: remotive.com/api/remote-jobs
    # Sem paginacao (retorna tudo)
    # Campos: title, company_name, category, job_type,
    #   candidate_required_location, salary, tags, url
    # Limite: max 4 requests/dia
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_remotive_adapter_should_map_fields_correctly | integration | test_remotive_adapter.py |
| test_remotive_adapter_should_strip_html_from_description | integration | test_remotive_adapter.py |
| test_remotive_adapter_should_handle_empty_response | integration | test_remotive_adapter.py |

**User stories:** US-015 (coleta automatica)

**Security findings:** Nenhum adicional.

**Criterios de aceite:**
- [ ] Coleta todas as vagas da API Remotive
- [ ] Mapeia campos para RawJob corretamente
- [ ] Respeita limite de 4 requests/dia
- [ ] Strip HTML da descricao
- [ ] Inclui User-Agent header

**Definition of Done:**
- [ ] Testes passando (mock httpx com respx)
- [ ] `ruff` + `mypy` limpos
- [ ] Commit com mensagem convencional

---

#### TASK-009 -- Normalizacao + deduplicacao

| Campo | Valor |
|-------|-------|
| **ID** | TASK-009 |
| **Titulo** | Servicos de normalizacao e deduplicacao de vagas |
| **Tipo** | Backend |
| **Fase** | 2 |
| **Depends on** | TASK-006 |
| **Estimativa** | M (4-8h) |
| **Delegavel Codex** | Nao |
| **Paralelizavel** | Sim (com TASK-007, TASK-008) |

**Descricao:** NormalizationService normaliza modalidade, senioridade, salario, localizacao e sanitiza HTML. DeduplicationService gera fingerprint SHA256 e busca similaridade >= 90% via pg_trgm.

**Arquivos a criar/modificar:**
- `backend/src/services/normalization_service.py` (criar)
- `backend/src/services/deduplication_service.py` (criar)

**Contrato:**
```python
class NormalizationService:
    def normalize_modality(self, raw: str | None) -> str | None: ...
    def normalize_seniority(self, raw: str | None) -> str | None: ...
    def normalize_salary(self, raw: str | None) -> tuple[int | None, int | None, str | None]: ...
    def normalize_location(self, raw: str | None) -> tuple[str | None, str | None, str | None]: ...
    def sanitize_html(self, html: str) -> str: ...

class DeduplicationService:
    def generate_fingerprint(self, title: str, company: str, location: str) -> str: ...
    async def is_duplicate(self, fingerprint: str) -> bool: ...
    async def find_similar(self, title: str, company: str, threshold: float = 0.9) -> list[UUID]: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_normalize_modality_should_map_variations | unit | test_normalization_service.py |
| test_normalize_seniority_should_map_pt_and_en | unit | test_normalization_service.py |
| test_normalize_salary_should_parse_ranges | unit | test_normalization_service.py |
| test_generate_fingerprint_should_be_deterministic | unit | test_deduplication_service.py |
| test_generate_fingerprint_should_ignore_case_and_accents | unit | test_deduplication_service.py |
| test_sanitize_html_should_remove_scripts | unit | test_normalization_service.py |

**User stories:** US-016 (normalizacao), US-017 (deduplicacao)

**Security findings:** Nenhum.

**Criterios de aceite:**
- [ ] Normaliza modalidade para enum: presencial, remoto, hibrido, home_office, freelance
- [ ] Normaliza senioridade para enum: estagio, junior, pleno, senior, especialista, gestao
- [ ] Extrai salary_min e salary_max de texto
- [ ] Sanitiza HTML (remove scripts, mantem formatting basico)
- [ ] Fingerprint SHA256 de titulo+empresa+localizacao normalizados
- [ ] Similaridade via pg_trgm para threshold >= 90%

**Definition of Done:**
- [ ] Testes passando, coverage >= 95% (domain/utils)
- [ ] `ruff` + `mypy` limpos
- [ ] Commit com mensagem convencional

---

#### TASK-010 -- Celery setup + worker de coleta

| Campo | Valor |
|-------|-------|
| **ID** | TASK-010 |
| **Titulo** | Celery + Redis broker + worker de coleta periodica |
| **Tipo** | Backend |
| **Fase** | 2 |
| **Depends on** | TASK-007, TASK-008, TASK-009 |
| **Estimativa** | M (4-8h) |
| **Delegavel Codex** | Nao |

**Descricao:** Celery app com Redis como broker. Worker de coleta com task por fonte e task para todas as fontes ativas. Celery beat para agendamento periodico. Docker Compose com servicos worker e beat.

**Arquivos a criar/modificar:**
- `backend/src/workers/celery_app.py` (criar)
- `backend/src/workers/tasks/collection.py` (criar)
- `docker-compose.yml` (modificar -- adicionar worker + beat)

**Contrato:**
```python
app = Celery("jobRadar", broker=settings.REDIS_URL)

@app.task(bind=True, queue="collection")
def collect_jobs_from_source(self, source_id: str) -> dict: ...

@app.task(queue="collection")
def collect_all_sources() -> dict: ...

# Beat schedule: collect_all_sources every 2 hours
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_collect_task_should_call_adapter_and_persist | integration | test_collection_task.py |
| test_collect_all_should_iterate_active_sources | integration | test_collection_task.py |
| test_collect_task_should_update_source_metadata | integration | test_collection_task.py |

**User stories:** US-015 (coleta automatica)

**Security findings:**
- **SEC-006:** Para producao, configurar `requirepass` no Redis e incluir senha na REDIS_URL.

**Criterios de aceite:**
- [ ] Celery worker inicia via Docker Compose
- [ ] Celery beat agenda coleta periodica (2h Gupy, 6h Remotive)
- [ ] Task coleta de uma fonte especifica
- [ ] Task coleta de todas as fontes ativas
- [ ] Atualiza last_collected_at e last_error no JobSource
- [ ] Logs estruturados com resultado da coleta

**Definition of Done:**
- [ ] Testes passando
- [ ] `ruff` + `mypy` limpos
- [ ] Docker compose up sobe worker e beat sem erros
- [ ] Commit com mensagem convencional

---

#### TASK-011 -- Worker de expiracao de vagas

| Campo | Valor |
|-------|-------|
| **ID** | TASK-011 |
| **Titulo** | Worker de manutencao: expiracao de vagas inativas |
| **Tipo** | Backend |
| **Fase** | 2 |
| **Depends on** | TASK-010 |
| **Estimativa** | S (<=4h) |
| **Delegavel Codex** | Nao |

**Descricao:** Task Celery que marca vagas sem atualizacao em 30 dias como is_active=False. Agendado diariamente via celery beat.

**Arquivos a criar/modificar:**
- `backend/src/workers/tasks/maintenance.py` (criar)

**Contrato:**
```python
@app.task(queue="maintenance")
def expire_stale_jobs(days: int = 30) -> dict:
    """Marca vagas sem revalidacao apos N dias como inativas."""
    ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_expire_stale_jobs_should_deactivate_old_jobs | integration | test_maintenance_task.py |
| test_expire_stale_jobs_should_keep_recent_jobs | integration | test_maintenance_task.py |

**User stories:** US-018 (expiracao de vagas)

**Security findings:** Nenhum.

**Criterios de aceite:**
- [ ] Vagas sem atualizacao em 30 dias marcadas como is_active=False
- [ ] Retorna contagem de vagas expiradas
- [ ] Agendado diariamente via celery beat
- [ ] Nao deleta vagas, apenas desativa

**Definition of Done:**
- [ ] Testes passando, `ruff` + `mypy` limpos
- [ ] Commit com mensagem convencional

---

### >> CHECKPOINT CP-2: `/review` + `/security-review S2`

**Verificar:** SEC-009 (User-Agent nos adapters), SEC-006 (Redis password em docker-compose.prod.yml), SEC-012 (base_url nao aceita input de usuario).

---

### FASE 3 -- Preferencias + Busca

**Objetivo:** Usuario configura preferencias, busca vagas com full-text search e filtros combinaveis.
**Pre-requisitos:** TASK-002, TASK-003
**Paralelismo:** Roda em paralelo com Fase 2

---

#### TASK-012 -- CRUD preferencias do usuario

| Campo | Valor |
|-------|-------|
| **ID** | TASK-012 |
| **Titulo** | CRUD preferencias do usuario (modalidade, areas, localizacao, senioridade, keywords, salario, alertas) |
| **Tipo** | Backend |
| **Fase** | 3 |
| **Depends on** | TASK-003, TASK-013 |
| **Estimativa** | M (4-8h) |
| **Delegavel Codex** | Nao |

**Descricao:** GET/PUT /users/me/preferences. GET retorna defaults se nao configuradas. PUT faz upsert. Valida area_ids existem e estao ativas. Valida enums de modalidade e senioridade.

**Arquivos a criar/modificar:**
- `backend/src/api/routers/preferences.py` (criar)
- `backend/src/services/preference_service.py` (criar)
- `backend/src/repositories/preference_repository.py` (criar)
- `backend/src/schemas/preference.py` (criar)

**Contrato:**
```python
class PreferenceService:
    async def get(self, user_id: UUID) -> UserPreference: ...
    async def upsert(self, user_id: UUID, data: PreferenceUpdate) -> UserPreference: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_get_preferences_should_return_defaults_when_none | unit | test_preference_service.py |
| test_upsert_preferences_should_create_when_new | unit | test_preference_service.py |
| test_upsert_preferences_should_update_when_existing | unit | test_preference_service.py |
| test_upsert_preferences_should_validate_area_ids | unit | test_preference_service.py |

**User stories:** US-008 (modalidade), US-009 (areas), US-010 (localizacao), US-011 (senioridade), US-012 (faixa salarial), US-013 (palavras-chave), US-014 (visualizar preferencias)

**Security findings:** Nenhum.

**Criterios de aceite:**
- [ ] GET retorna preferencias ou defaults (listas vazias, alerts_enabled=true, alert_frequency="daily")
- [ ] PUT cria ou atualiza (upsert)
- [ ] Valida area_ids existem e estao ativas
- [ ] Valida enums de modalidade e senioridade
- [ ] Valida salary_min <= salary_max

**Definition of Done:**
- [ ] Testes passando, coverage >= 85%
- [ ] Sem `from sqlalchemy` em services
- [ ] Controller com max 5 linhas
- [ ] `ruff` + `mypy` limpos
- [ ] Commit com mensagem convencional

---

#### TASK-014 -- Busca full-text + filtros

| Campo | Valor |
|-------|-------|
| **ID** | TASK-014 |
| **Titulo** | Busca de vagas com full-text search tsvector + filtros combinaveis |
| **Tipo** | Backend |
| **Fase** | 3 |
| **Depends on** | TASK-002 |
| **Estimativa** | L (1-2d) |
| **Delegavel Codex** | Nao |

**Descricao:** GET /jobs com full-text search via tsvector (dicionarios portuguese + english), filtros combinaveis (AND entre diferentes, OR dentro do mesmo), ordenacao (relevancia, data, salario), paginacao, enriquecimento com is_favorited/application_status se autenticado. GET /jobs/{id} com detalhes. GET /jobs/recommended baseado em preferencias. Cache de buscas frequentes no Redis (TTL 5min).

**Arquivos a criar/modificar:**
- `backend/src/api/routers/jobs.py` (criar)
- `backend/src/services/job_search_service.py` (criar)
- `backend/src/repositories/job_repository.py` (modificar -- adicionar metodos de busca)
- `backend/src/schemas/job.py` (criar)

**Contrato:**
```python
class JobSearchService:
    async def search(
        self, query: str | None, filters: JobFilters,
        sort: str, order: str, offset: int, limit: int,
        user_id: UUID | None = None,
    ) -> PaginatedResult[JobSummary]: ...
    async def get_by_id(self, job_id: UUID, user_id: UUID | None = None) -> JobDetail: ...
    async def get_recommended(self, user_id: UUID, offset: int, limit: int) -> PaginatedResult[JobSummary]: ...

@dataclass
class JobFilters:
    modality: list[str] | None
    area: list[str] | None
    seniority: list[str] | None
    location: str | None
    salary_min: int | None
    salary_max: int | None
    source: str | None
    published_after: date | None
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_search_by_text_should_use_tsvector | integration | test_job_endpoints.py |
| test_search_with_filters_should_combine_with_and | unit | test_job_search_service.py |
| test_search_should_paginate_correctly | unit | test_job_search_service.py |
| test_search_should_enrich_with_user_data_when_authenticated | unit | test_job_search_service.py |
| test_search_should_order_by_relevance_by_default | unit | test_job_search_service.py |
| test_search_should_cache_frequent_queries | integration | test_job_search_service.py |

**User stories:** US-020 (busca full-text), US-021 (filtros combinaveis), US-022 (ordenacao), US-025 (feed personalizado)

**Security findings:** Nenhum.

**Criterios de aceite:**
- [ ] Full-text search via tsvector em titulo + empresa + descricao
- [ ] Filtros combinaveis (AND entre diferentes, OR dentro do mesmo)
- [ ] Ordenacao por relevancia, data, salario
- [ ] Paginacao offset/limit com total count
- [ ] Enriquece com is_favorited e application_status se autenticado
- [ ] Search vector usa dicionarios 'portuguese' e 'english'
- [ ] Cache de buscas frequentes no Redis (TTL 5min)

**Definition of Done:**
- [ ] Testes passando, coverage >= 85%
- [ ] Sem `from sqlalchemy` em services
- [ ] Controller com max 5 linhas
- [ ] `ruff` + `mypy` limpos
- [ ] Commit com mensagem convencional

---

#### TASK-015 -- Paginacao padronizada

| Campo | Valor |
|-------|-------|
| **ID** | TASK-015 |
| **Titulo** | Schemas e dependency injection de paginacao padronizada |
| **Tipo** | Backend |
| **Fase** | 3 |
| **Depends on** | TASK-014 |
| **Estimativa** | S (<=4h) |
| **Delegavel Codex** | Nao |

**Descricao:** PaginationParams, PaginatedResponse[T] e PaginationInfo como schemas Pydantic reutilizaveis. Dependency injection nos routers via Depends(). Limit max 50.

**Arquivos a criar/modificar:**
- `backend/src/schemas/pagination.py` (criar)
- `backend/src/core/dependencies.py` (modificar)

**Contrato:**
```python
class PaginationParams(BaseModel):
    offset: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=50)

class PaginatedResponse[T](BaseModel):
    data: list[T]
    pagination: PaginationInfo

class PaginationInfo(BaseModel):
    offset: int
    limit: int
    total: int
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_pagination_params_should_enforce_limits | unit | test_job_search_service.py |
| test_paginated_response_should_include_total | unit | test_job_search_service.py |

**User stories:** US-023 (paginacao), US-047 (paginacao padronizada)

**Security findings:** Nenhum.

**Criterios de aceite:**
- [ ] Schema reutilizavel para todos os endpoints paginados
- [ ] Dependency injection nos routers via Depends()
- [ ] Limit max 50 enforced

**Definition of Done:**
- [ ] Testes passando, `ruff` + `mypy` limpos
- [ ] Commit com mensagem convencional

---

#### TASK-021 -- Historico de busca

| Campo | Valor |
|-------|-------|
| **ID** | TASK-021 |
| **Titulo** | Historico de buscas recentes (salvar, listar, limpar) |
| **Tipo** | Backend |
| **Fase** | 3 |
| **Depends on** | TASK-014 |
| **Estimativa** | S (<=4h) |
| **Delegavel Codex** | Nao |

**Descricao:** Salva busca automaticamente ao realizar search. Retorna ultimas 10 buscas. Permite limpar historico.

**Arquivos a criar/modificar:**
- `backend/src/api/routers/search_history.py` (criar)
- `backend/src/services/search_history_service.py` (criar)
- `backend/src/repositories/search_history_repository.py` (criar)

**Contrato:**
```python
class SearchHistoryService:
    async def save(self, user_id: UUID, query: str, filters: dict) -> None: ...
    async def get_recent(self, user_id: UUID, limit: int = 10) -> list[SearchHistoryEntry]: ...
    async def clear(self, user_id: UUID) -> None: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_save_search_should_persist_query_and_filters | unit | test_search_history_service.py |
| test_get_recent_should_return_last_10 | unit | test_search_history_service.py |
| test_clear_should_delete_all_user_history | unit | test_search_history_service.py |

**User stories:** US-024 (historico de buscas)

**Security findings:** Nenhum.

**Criterios de aceite:**
- [ ] Salva busca automaticamente ao realizar search
- [ ] Retorna ultimas 10 buscas (ordered by created_at DESC)
- [ ] Permite limpar historico (DELETE retorna 204)

**Definition of Done:**
- [ ] Testes passando, `ruff` + `mypy` limpos
- [ ] Sem `from sqlalchemy` em services
- [ ] Commit com mensagem convencional

---

### >> CHECKPOINT CP-3: `/review`

**Verificar:** Full-text search com tsvector funciona corretamente, paginacao padronizada aplicada em todos os endpoints.

---

### FASE 4 -- Favoritos, Candidaturas, Alertas

**Objetivo:** Favoritar vagas, registrar candidaturas com tracking, alertas por email.
**Pre-requisitos:** TASK-003, TASK-002, TASK-010, TASK-012

---

#### TASK-016 -- Favoritos

| Campo | Valor |
|-------|-------|
| **ID** | TASK-016 |
| **Titulo** | CRUD favoritos (adicionar, remover, listar) |
| **Tipo** | Backend |
| **Fase** | 4 |
| **Depends on** | TASK-003, TASK-002 |
| **Estimativa** | S (<=4h) |
| **Delegavel Codex** | Nao |
| **Paralelizavel** | Sim (com TASK-017) |

**Descricao:** POST /favorites, DELETE /favorites/{job_id}, GET /favorites com paginacao. Constraint UNIQUE(user_id, job_id). Ownership validation (SEC-002).

**Arquivos a criar/modificar:**
- `backend/src/api/routers/favorites.py` (criar)
- `backend/src/services/favorite_service.py` (criar)
- `backend/src/repositories/favorite_repository.py` (criar)
- `backend/src/schemas/favorite.py` (criar)

**Contrato:**
```python
class FavoriteService:
    async def list(self, user_id: UUID, offset: int, limit: int) -> PaginatedResult[FavoriteResponse]: ...
    async def add(self, user_id: UUID, job_id: UUID) -> FavoriteResponse: ...
    async def remove(self, user_id: UUID, job_id: UUID) -> None: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_add_favorite_should_create_record | unit | test_favorite_service.py |
| test_add_favorite_when_duplicate_should_return_409 | unit | test_favorite_service.py |
| test_remove_favorite_should_delete_record | unit | test_favorite_service.py |
| test_list_favorites_should_paginate | unit | test_favorite_service.py |
| test_delete_favorite_when_other_user_should_return_404 | unit | test_favorite_service.py |
| test_favorite_repo_should_filter_by_user_id_on_delete | integration | test_favorite_repository.py |

**User stories:** US-026 (favoritar vagas)

**Security findings:**
- **SEC-002:** Repository SEMPRE filtra por `user_id` AND `job_id` em DELETE. `WHERE user_id = :user_id AND job_id = :job_id`.

**Criterios de aceite:**
- [ ] POST /favorites adiciona favorito (retorna 201)
- [ ] DELETE /favorites/{job_id} remove favorito (retorna 204)
- [ ] GET /favorites lista com paginacao
- [ ] Retorna 409 se ja favoritado
- [ ] Retorna 404 se tentar remover favorito de outro usuario (IDOR prevention)

**Definition of Done:**
- [ ] Testes passando, `ruff` + `mypy` limpos
- [ ] Sem `from sqlalchemy` em services
- [ ] Controller com max 5 linhas
- [ ] Commit com mensagem convencional

---

#### TASK-017 -- Candidaturas (CRUD + tracking)

| Campo | Valor |
|-------|-------|
| **ID** | TASK-017 |
| **Titulo** | CRUD candidaturas com status tracking + export CSV |
| **Tipo** | Backend |
| **Fase** | 4 |
| **Depends on** | TASK-003, TASK-002 |
| **Estimativa** | M (4-8h) |
| **Delegavel Codex** | Nao |
| **Paralelizavel** | Sim (com TASK-016) |

**Descricao:** CRUD completo de candidaturas. Status tracking: applied -> in_progress -> interview -> approved/rejected. Notas/comentarios. Export CSV. Constraint UNIQUE(user_id, job_id). Ownership validation (SEC-002).

**Arquivos a criar/modificar:**
- `backend/src/api/routers/applications.py` (criar)
- `backend/src/services/application_service.py` (criar)
- `backend/src/repositories/application_repository.py` (criar)
- `backend/src/schemas/application.py` (criar)

**Contrato:**
```python
class ApplicationService:
    async def list(self, user_id: UUID, status: str | None, offset: int, limit: int) -> PaginatedResult[ApplicationResponse]: ...
    async def create(self, user_id: UUID, data: ApplicationCreate) -> ApplicationResponse: ...
    async def update(self, user_id: UUID, app_id: UUID, data: ApplicationUpdate) -> ApplicationResponse: ...
    async def delete(self, user_id: UUID, app_id: UUID) -> None: ...
    async def export_csv(self, user_id: UUID) -> str: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_create_application_should_set_status_applied | unit | test_application_service.py |
| test_create_application_when_duplicate_should_return_409 | unit | test_application_service.py |
| test_update_application_should_change_status | unit | test_application_service.py |
| test_list_applications_should_filter_by_status | unit | test_application_service.py |
| test_export_csv_should_return_valid_csv | unit | test_application_service.py |
| test_update_application_when_other_user_should_return_404 | unit | test_application_service.py |
| test_delete_application_when_other_user_should_return_404 | unit | test_application_service.py |
| test_application_repo_should_filter_by_user_id_on_update | integration | test_application_repository.py |

**User stories:** US-027 (registrar candidatura), US-028 (atualizar status), US-029 (historico candidaturas), US-030 (notas), US-031 (export CSV)

**Security findings:**
- **SEC-002:** Repository SEMPRE filtra por `user_id` em UPDATE e DELETE. `WHERE id = :app_id AND user_id = :user_id`.

**Criterios de aceite:**
- [ ] CRUD completo de candidaturas
- [ ] Status tracking: applied -> in_progress -> interview -> approved/rejected
- [ ] Notas/comentarios editaveis
- [ ] Export CSV com headers (title, company, status, notes, applied_at, url)
- [ ] Constraint: 1 candidatura por usuario por vaga (409 em duplicata)
- [ ] Ownership validation em todas as operacoes (SEC-002)

**Definition of Done:**
- [ ] Testes passando, coverage >= 85%
- [ ] Sem `from sqlalchemy` em services
- [ ] Controller com max 5 linhas
- [ ] `ruff` + `mypy` limpos
- [ ] Commit com mensagem convencional

---

#### TASK-018 -- Alertas por email (matching + Resend)

| Campo | Valor |
|-------|-------|
| **ID** | TASK-018 |
| **Titulo** | Sistema de alertas: matching preferencias + envio email via Resend |
| **Tipo** | Backend |
| **Fase** | 4 |
| **Depends on** | TASK-010, TASK-012 |
| **Estimativa** | L (1-2d) |
| **Delegavel Codex** | Nao |

**Descricao:** Apos coleta, cruza vagas novas com preferencias de cada usuario. Envia email via Resend com lista de vagas compativeis. Respeita frequencia (immediate, daily, weekly) e opt-out. Registra em alert_log. Templates PT-BR/EN. Weekly digest via celery beat.

**Arquivos a criar/modificar:**
- `backend/src/services/alert_service.py` (criar)
- `backend/src/workers/tasks/alerts.py` (criar)
- `backend/src/services/email_service.py` (criar)
- `backend/src/protocols/email.py` (criar)
- `backend/src/repositories/alert_log_repository.py` (criar)

**Contrato:**
```python
# protocols/email.py
class EmailServiceProtocol(Protocol):
    async def send(self, to: str, subject: str, html: str) -> None: ...
    async def send_batch(self, emails: list[EmailParams]) -> None: ...

class ResendEmailService:
    async def send(self, to: str, subject: str, html: str) -> None: ...
    async def send_batch(self, emails: list[EmailParams]) -> None: ...

class AlertService:
    async def match_jobs_to_preferences(self, job_ids: list[UUID]) -> dict[UUID, list[UUID]]: ...
    async def send_alerts(self, user_jobs: dict[UUID, list[UUID]]) -> None: ...

@app.task(queue="alerts")
def process_new_job_alerts(job_ids: list[str]) -> dict: ...

@app.task(queue="alerts")
def send_weekly_digest() -> dict: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_match_jobs_should_filter_by_modality | unit | test_alert_service.py |
| test_match_jobs_should_filter_by_seniority | unit | test_alert_service.py |
| test_match_jobs_should_filter_by_keywords | unit | test_alert_service.py |
| test_send_alerts_should_respect_frequency | unit | test_alert_service.py |
| test_send_alerts_should_skip_opted_out_users | unit | test_alert_service.py |
| test_send_alerts_should_log_in_alert_log | unit | test_alert_service.py |

**User stories:** US-032 (alertas por email), US-034 (opt-out), US-035 (resumo semanal)

**Security findings:** Nenhum.

**Criterios de aceite:**
- [ ] Apos coleta, cruza vagas novas com preferencias de cada usuario
- [ ] Envia email via Resend com lista de vagas compativeis
- [ ] Respeita frequencia configurada (immediate, daily, weekly)
- [ ] Respeita opt-out (alerts_enabled=False)
- [ ] Registra envio em alert_log
- [ ] Batch sending para eficiencia
- [ ] Templates de email em PT-BR e EN

**Definition of Done:**
- [ ] Testes passando, coverage >= 85%
- [ ] Sem `from sqlalchemy` em services
- [ ] `ruff` + `mypy` limpos
- [ ] Commit com mensagem convencional

---

#### TASK-019 -- Configuracao de alertas

| Campo | Valor |
|-------|-------|
| **ID** | TASK-019 |
| **Titulo** | Endpoints de configuracao de alertas (frequencia, opt-out) |
| **Tipo** | Backend |
| **Fase** | 4 |
| **Depends on** | TASK-018 |
| **Estimativa** | S (<=4h) |
| **Delegavel Codex** | Nao |

**Descricao:** GET /alerts/settings retorna configuracao atual. PUT /alerts/settings atualiza frequencia e opt-out. Opt-out total para LGPD compliance.

**Arquivos a criar/modificar:**
- `backend/src/api/routers/alerts.py` (criar)
- `backend/src/schemas/alert.py` (criar)

**Contrato:**
```python
# GET /alerts/settings -> AlertSettings
# PUT /alerts/settings -> AlertSettings
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_get_alert_settings_should_return_current_config | unit | test_alert_service.py |
| test_update_alert_settings_should_persist | unit | test_alert_service.py |

**User stories:** US-033 (configurar frequencia), US-034 (opt-out)

**Security findings:** Nenhum.

**Criterios de aceite:**
- [ ] GET retorna configuracao atual de alertas
- [ ] PUT atualiza frequencia e opt-out
- [ ] Opt-out total para LGPD compliance

**Definition of Done:**
- [ ] Testes passando, `ruff` + `mypy` limpos
- [ ] Controller com max 5 linhas
- [ ] Commit com mensagem convencional

---

### >> CHECKPOINT CP-4: `/review` + `/security-review S2`

**Verificar:** SEC-002 (ownership validation em favoritos e candidaturas -- IDOR prevention), SEC-006 (Redis auth).

---

### FASE 5 -- Dashboard + Admin

**Objetivo:** Dashboard do usuario com feed e metricas, painel admin com monitoramento.
**Pre-requisitos:** Fases 1-4

---

#### TASK-020 -- Dashboard do usuario

| Campo | Valor |
|-------|-------|
| **ID** | TASK-020 |
| **Titulo** | Dashboard do usuario: contadores, candidaturas por status, vagas recomendadas |
| **Tipo** | Backend |
| **Fase** | 5 |
| **Depends on** | TASK-012, TASK-014 |
| **Estimativa** | M (4-8h) |
| **Delegavel Codex** | Nao |
| **Paralelizavel** | Sim (com TASK-022) |

**Descricao:** GET /dashboard retorna contadores (vagas novas 24h, favoritas, candidaturas ativas), candidaturas agrupadas por status, e top 5 vagas recomendadas baseadas nas preferencias.

**Arquivos a criar/modificar:**
- `backend/src/api/routers/dashboard.py` (criar)
- `backend/src/services/dashboard_service.py` (criar)

**Contrato:**
```python
class DashboardService:
    async def get_dashboard(self, user_id: UUID) -> DashboardResponse: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_dashboard_should_return_new_jobs_count_24h | unit | test_dashboard_service.py |
| test_dashboard_should_return_applications_by_status | unit | test_dashboard_service.py |
| test_dashboard_should_return_recommended_jobs | unit | test_dashboard_service.py |

**User stories:** US-036 (feed recomendadas), US-037 (contadores), US-038 (candidaturas por status)

**Security findings:** Nenhum.

**Criterios de aceite:**
- [ ] Retorna contadores: vagas novas 24h, favoritas, candidaturas ativas
- [ ] Retorna candidaturas agrupadas por status
- [ ] Retorna top 5 vagas recomendadas baseadas nas preferencias

**Definition of Done:**
- [ ] Testes passando, `ruff` + `mypy` limpos
- [ ] Sem `from sqlalchemy` em services
- [ ] Controller com max 5 linhas
- [ ] Commit com mensagem convencional

---

#### TASK-022 -- Painel admin (metricas + status fontes)

| Campo | Valor |
|-------|-------|
| **ID** | TASK-022 |
| **Titulo** | Painel admin: metricas da plataforma, status fontes, trigger coleta, CRUD usuarios |
| **Tipo** | Backend |
| **Fase** | 5 |
| **Depends on** | TASK-010 |
| **Estimativa** | L (1-2d) |
| **Delegavel Codex** | Nao |
| **Paralelizavel** | Sim (com TASK-020) |

**Descricao:** Endpoints admin protegidos com require_admin. Metricas (usuarios, vagas). Status das fontes. Trigger de coleta imediata. Logs de erro. CRUD de usuarios (listar, ativar/desativar, promover admin). Primeiro admin via seed/migration.

**Arquivos a criar/modificar:**
- `backend/src/api/routers/admin.py` (criar)
- `backend/src/services/admin_service.py` (criar)
- `backend/src/schemas/admin.py` (criar)
- `backend/src/core/dependencies.py` (modificar -- adicionar require_admin)

**Contrato:**
```python
class AdminService:
    async def get_metrics(self) -> AdminMetrics: ...
    async def list_sources(self) -> list[SourceStatus]: ...
    async def get_source_logs(self, source_id: UUID) -> list[SourceLog]: ...
    async def trigger_collection(self, source_id: UUID) -> str: ...
    async def list_users(self, search: str | None, is_active: bool | None, offset: int, limit: int) -> PaginatedResult[AdminUserView]: ...
    async def update_user(self, user_id: UUID, data: AdminUserUpdate) -> AdminUserView: ...

async def require_admin(current_user: User = Depends(get_current_user)) -> User: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_admin_metrics_should_return_aggregated_data | unit | test_admin_service.py |
| test_admin_sources_should_show_status | unit | test_admin_service.py |
| test_admin_trigger_collection_should_queue_task | unit | test_admin_service.py |
| test_admin_endpoints_should_reject_non_admin | integration | test_admin_endpoints.py |
| test_admin_list_users_should_paginate_and_filter | unit | test_admin_service.py |

**User stories:** US-039 (status fontes), US-040 (metricas), US-042 (forcar coleta), US-044 (gerenciar usuarios), US-045 (logs de erro)

**Security findings:**
- **SEC-001:** Primeiro admin criado via seed/migration, nunca via API publica. Endpoint PATCH /admin/users/{id} protegido por require_admin.

**Criterios de aceite:**
- [ ] Todos os endpoints admin protegidos com require_admin
- [ ] Metricas: usuarios (total, ativos 7d, novos 24h), vagas (total ativas, novas 24h)
- [ ] Status das fontes com last_collected_at e last_error
- [ ] Trigger de coleta imediata (enfileira task Celery, retorna 202)
- [ ] Logs de erro de coleta por fonte
- [ ] CRUD de usuarios (listar, ativar/desativar, promover admin)
- [ ] Sem password_hash nas respostas de listagem de usuarios

**Definition of Done:**
- [ ] Testes passando, `ruff` + `mypy` limpos
- [ ] Sem `from sqlalchemy` em services
- [ ] Controller com max 5 linhas
- [ ] Commit com mensagem convencional

---

#### TASK-023 -- Admin CRUD fontes + areas

| Campo | Valor |
|-------|-------|
| **ID** | TASK-023 |
| **Titulo** | Admin: ativar/desativar fontes, alterar intervalo de coleta |
| **Tipo** | Backend |
| **Fase** | 5 |
| **Depends on** | TASK-022 |
| **Estimativa** | M (4-8h) |
| **Delegavel Codex** | Nao |

**Descricao:** PATCH /admin/sources/{id} para ativar/desativar fontes e alterar intervalo de coleta. Endpoints admin para areas reutilizam TASK-013 com guard admin.

**Arquivos a criar/modificar:**
- `backend/src/api/routers/admin.py` (modificar -- adicionar endpoints)

**Contrato:**
```python
# Adicao ao AdminService:
async def update_source(self, source_id: UUID, data: SourceUpdate) -> SourceStatus: ...
```

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_update_source_should_toggle_active | unit | test_admin_service.py |
| test_update_source_should_change_interval | unit | test_admin_service.py |

**User stories:** US-041 (ativar/desativar fontes), US-043 (gerenciar areas)

**Security findings:** Nenhum adicional.

**Criterios de aceite:**
- [ ] Admin pode ativar/desativar fontes
- [ ] Admin pode alterar intervalo de coleta
- [ ] Admin pode gerenciar areas (via endpoints de TASK-013 com guard admin)

**Definition of Done:**
- [ ] Testes passando, `ruff` + `mypy` limpos
- [ ] Commit com mensagem convencional

---

### FASE 6 -- LGPD + Exportacao

**Objetivo:** Conformidade LGPD completa (exportacao JSON, candidaturas CSV).
**Pre-requisitos:** TASK-005, TASK-012, TASK-016, TASK-017

---

#### TASK-026 -- Exportacao dados LGPD (JSON)

| Campo | Valor |
|-------|-------|
| **ID** | TASK-026 |
| **Titulo** | Exportacao completa de dados do usuario (LGPD, JSON) |
| **Tipo** | Backend |
| **Fase** | 6 |
| **Depends on** | TASK-005, TASK-012, TASK-016, TASK-017 |
| **Estimativa** | S (<=4h) |
| **Delegavel Codex** | Nao |
| **Paralelizavel** | Sim (com TASK-027) |

**Descricao:** Completar o metodo export_data do UserService (esqueleto em TASK-005) para incluir preferencias, favoritos, candidaturas e historico de busca. Sem dados internos (password_hash, IDs de sistema).

**Arquivos a criar/modificar:**
- `backend/src/services/user_service.py` (modificar -- completar export_data)

**Contrato:** Ja definido em TASK-005: `async def export_data(self, user_id: UUID) -> UserExport: ...`

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_export_should_include_all_user_data | unit | test_user_service.py |
| test_export_should_exclude_sensitive_fields | unit | test_user_service.py |

**User stories:** US-051 (exportacao dados LGPD)

**Security findings:**
- **SEC-007:** Export nao expoe dados sensiveis. Sem password_hash, sem IDs internos de sistema.

**Criterios de aceite:**
- [ ] Exporta perfil, preferencias, favoritos, candidaturas, historico de busca
- [ ] Formato JSON legivel
- [ ] Sem dados internos (password_hash, IDs internos de sistema)

**Definition of Done:**
- [ ] Testes passando, `ruff` + `mypy` limpos
- [ ] Commit com mensagem convencional

---

#### TASK-027 -- Exportacao candidaturas CSV

| Campo | Valor |
|-------|-------|
| **ID** | TASK-027 |
| **Titulo** | Exportacao de candidaturas em CSV |
| **Tipo** | Backend |
| **Fase** | 6 |
| **Depends on** | TASK-017 |
| **Estimativa** | S (<=4h) |
| **Delegavel Codex** | Nao |
| **Paralelizavel** | Sim (com TASK-026) |

**Descricao:** Completar o metodo export_csv do ApplicationService (esqueleto em TASK-017). CSV UTF-8 com BOM para Excel. Content-Disposition: attachment.

**Arquivos a criar/modificar:**
- `backend/src/services/application_service.py` (modificar -- completar export_csv)

**Contrato:** Ja definido em TASK-017: `async def export_csv(self, user_id: UUID) -> str: ...`

**Testes obrigatorios:**
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_export_csv_should_return_valid_csv_format | unit | test_application_service.py |
| test_export_csv_should_include_all_applications | unit | test_application_service.py |

**User stories:** US-031 (exportar candidaturas CSV)

**Security findings:** Nenhum.

**Criterios de aceite:**
- [ ] CSV com headers: title, company, status, notes, applied_at, url
- [ ] Encoding UTF-8 com BOM para Excel
- [ ] Content-Disposition: attachment

**Definition of Done:**
- [ ] Testes passando, `ruff` + `mypy` limpos
- [ ] Commit com mensagem convencional

---

### >> CHECKPOINT CP-5: `/review` + `/security-review S2`

**Verificar:** SEC-001 (admin via seed), SEC-010 (LGPD compliance -- export inclui todos os dados, delete remove tudo), SEC-007 (export nao expoe dados sensiveis).

---

### >> CHECKPOINT CP-FINAL: `/tech-docs` + `/security-review S3` + `/deploy`

**Verificar:** Todos os SEC findings resolvidos. Documentacao completa (README, API reference). Pre-deploy checklist.

---

## 6. Resumo de Security Findings por Task

| Finding | Severidade | Tasks Impactadas | Descricao |
|---------|-----------|-----------------|-----------|
| SEC-001 | MEDIUM | TASK-005, TASK-022 | UserUpdate nao aceita is_admin. Primeiro admin via seed. |
| SEC-002 | MEDIUM | TASK-016, TASK-017 | Ownership validation (IDOR). Filtrar por user_id em DELETE/UPDATE. |
| SEC-003 | MEDIUM | TASK-003, TASK-005 | Blacklist de refresh tokens no Redis (logout, delete account). |
| SEC-004 | MEDIUM | TASK-001, TASK-003 | JWT HS256 padronizado. SECRET_KEY >= 256 bits. |
| SEC-005 | MEDIUM | TASK-024, TASK-003 | Rate limiting login: 5/15min por email, 20/15min por IP. |
| SEC-006 | LOW | TASK-010 | Redis com requirepass em producao. Porta nao exposta no host. |
| SEC-008 | LOW | TASK-001 | uv.lock commitado, uv sync --frozen no Dockerfile. |
| SEC-009 | INFO | TASK-006 | User-Agent header nos adapters. |
| SEC-012 | INFO | TASK-006 | base_url nao aceita input de usuario final. |

---

## 7. Resumo de User Stories por Task

| Task | User Stories |
|------|------------|
| TASK-001 | US-046, US-048 |
| TASK-002 | -- |
| TASK-003 | US-001, US-003, US-006, US-007 |
| TASK-004 | US-002 |
| TASK-005 | US-004, US-005 |
| TASK-006 | US-015, US-019 |
| TASK-007 | US-015 |
| TASK-008 | US-015 |
| TASK-009 | US-016, US-017 |
| TASK-010 | US-015 |
| TASK-011 | US-018 |
| TASK-012 | US-008, US-009, US-010, US-011, US-012, US-013, US-014 |
| TASK-013 | US-009, US-043 |
| TASK-014 | US-020, US-021, US-022, US-025 |
| TASK-015 | US-023, US-047 |
| TASK-016 | US-026 |
| TASK-017 | US-027, US-028, US-029, US-030, US-031 |
| TASK-018 | US-032, US-034, US-035 |
| TASK-019 | US-033, US-034 |
| TASK-020 | US-036, US-037, US-038 |
| TASK-021 | US-024 |
| TASK-022 | US-039, US-040, US-042, US-044, US-045 |
| TASK-023 | US-041, US-043 |
| TASK-024 | US-049 |
| TASK-025 | US-050 |
| TASK-026 | US-051 |
| TASK-027 | US-031 |

---

## 8. Tasks Delegaveis ao Codex (Frontend)

Nenhuma das 27 tasks atuais e de frontend. O frontend sera desenvolvido pelo Codex apos os contratos de API estarem estabilizados (pos-Fase 3 ou pos-Fase 4). O handoff para o Codex incluira:

- Contratos de API completos (secao 5 do ARCHITECTURE.md)
- Schemas Pydantic de request/response
- OpenAPI/Swagger auto-gerado acessivel em /docs
- Stack frontend: Bootstrap 5 (conforme CLAUDE.md)

**Recomendacao:** Iniciar frontend apos CP-3 (Fase 3 completa) quando busca + auth + preferencias estiverem prontos.

---

## 9. E2E Tests (transversais)

Apos todas as fases, executar os 4 fluxos E2E definidos na TEST_STRATEGY.md:

| Fluxo | Cobertura | Tasks Envolvidas |
|-------|-----------|-----------------|
| Onboarding | Registro -> verificacao email -> login -> preferencias -> dashboard | TASK-003, TASK-012, TASK-020 |
| Busca + Aplicacao | Busca -> filtros -> favoritar -> candidatura -> atualizar status | TASK-014, TASK-016, TASK-017 |
| Alertas | Preferencias -> coleta vagas -> matching -> envio email -> opt-out | TASK-012, TASK-010, TASK-018, TASK-019 |
| Admin | Metricas -> status fontes -> trigger coleta -> gerenciar usuarios -> reject non-admin | TASK-022, TASK-023 |

---

## 10. Definition of Done (global)

Uma task so e CONCLUIDA quando:

- [ ] Codigo implementado conforme contrato definido no ARCHITECTURE.md
- [ ] Testes obrigatorios escritos (TDD) e passando
- [ ] Coverage nao caiu abaixo do minimo da camada
- [ ] `ruff check . && ruff format --check .` sem erros
- [ ] `mypy --strict` sem erros
- [ ] Sem secrets ou dados sensiveis no codigo
- [ ] Sem print() -- usar logger estruturado (structlog)
- [ ] Sem `from sqlalchemy` em services
- [ ] Controller com max 5 linhas de logica
- [ ] Security findings aplicaveis enderecados
- [ ] Commit com mensagem convencional (feat/fix/refactor)
- [ ] `/review` APROVADO (no checkpoint da fase)
