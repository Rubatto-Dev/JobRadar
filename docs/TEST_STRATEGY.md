# TEST_STRATEGY.md -- JobRadar

> **Versao:** 1.0 | **Data:** 2026-04-04 | **Status:** Validado
> **Agente:** Test Strategy Expert

---

## 1. Piramide de Testes

| Camada | Proporcao | Escopo | Velocidade |
|--------|-----------|--------|------------|
| Unit | ~60% | Services, normalizacao, deduplicacao, utils | < 1s por teste |
| Integration | ~30% | Repositories + PG real, API endpoints + httpx, Redis, Celery tasks | < 5s por teste |
| E2E | ~10% | Fluxos completos (onboarding, busca+aplicacao, alertas, admin) | < 15s por teste |

**Cobertura minima global: 80%** (conforme CLAUDE.md)

| Camada de codigo | Coverage alvo |
|------------------|---------------|
| Domain/Utils (normalizacao, dedup, fingerprint) | >= 95% |
| Services | >= 85% |
| Repositories | >= 80% |
| API/Routers | >= 80% |
| Workers/Tasks | >= 75% |

---

## 2. Convencoes

### Nomenclatura

```
test_[o_que_faz]_when_[condicao]_should_[resultado]
```

Exemplos:
- `test_register_when_weak_password_should_return_400`
- `test_search_by_text_should_use_tsvector`
- `test_expire_stale_jobs_should_deactivate_old_jobs`

Quando nao ha condicao especifica (happy path puro), omitir `when_`:
- `test_health_endpoint_should_return_200`
- `test_list_areas_should_return_active_only`

### Regras

- **TDD obrigatorio:** teste primeiro, implementacao depois
- **Happy path + minimo 2 casos de erro** por feature
- **Fixtures compartilhadas** em `conftest.py` por diretorio
- **Sem sleep/time.sleep em testes** -- usar mocks para tempo
- **Sem acesso a rede em unit tests** -- mock httpx para APIs externas
- **Sem side effects entre testes** -- cada teste e isolado

---

## 3. Stack de Testes

| Ferramenta | Uso |
|------------|-----|
| pytest | Runner principal |
| pytest-asyncio | Testes async (services, repos, routers) |
| httpx (AsyncClient) | TestClient para endpoints FastAPI |
| faker | Geracao de dados realistas para fixtures |
| factory-boy | Factories para modelos (User, Job, etc) |
| pytest-cov | Medicao de cobertura |
| freezegun | Mocking de datetime (expiracao, alertas) |
| respx | Mock de requests httpx (APIs externas: Gupy, Remotive, Google) |
| testcontainers-python | PostgreSQL real em container para integration |
| fakeredis | Redis em memoria para unit tests |
| celery.contrib.pytest | Testes de tasks Celery |

### pyproject.toml (secao de testes)

```toml
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
```

---

## 4. Estrutura de Diretorios

```
backend/tests/
├── conftest.py                  # Fixtures globais (db session, client, factories)
├── factories.py                 # Factory-boy factories para todos os modelos
├── fakes.py                     # Fake repositories para unit tests
├── unit/
│   ├── conftest.py
│   ├── services/
│   │   ├── test_auth_service.py
│   │   ├── test_user_service.py
│   │   ├── test_preference_service.py
│   │   ├── test_collection_service.py
│   │   ├── test_job_search_service.py
│   │   ├── test_favorite_service.py
│   │   ├── test_application_service.py
│   │   ├── test_alert_service.py
│   │   ├── test_search_history_service.py
│   │   ├── test_dashboard_service.py
│   │   ├── test_admin_service.py
│   │   └── test_area_service.py
│   ├── domain/
│   │   ├── test_normalization_service.py
│   │   ├── test_deduplication_service.py
│   │   └── test_fingerprint.py
│   └── core/
│       ├── test_security.py
│       ├── test_rate_limit.py
│       └── test_i18n.py
├── integration/
│   ├── conftest.py              # DB real (testcontainers), Redis real
│   ├── repositories/
│   │   ├── test_user_repository.py
│   │   ├── test_job_repository.py
│   │   ├── test_preference_repository.py
│   │   ├── test_favorite_repository.py
│   │   ├── test_application_repository.py
│   │   ├── test_search_history_repository.py
│   │   ├── test_area_repository.py
│   │   └── test_source_repository.py
│   ├── api/
│   │   ├── test_auth_endpoints.py
│   │   ├── test_user_endpoints.py
│   │   ├── test_preference_endpoints.py
│   │   ├── test_job_endpoints.py
│   │   ├── test_favorite_endpoints.py
│   │   ├── test_application_endpoints.py
│   │   ├── test_alert_endpoints.py
│   │   ├── test_search_history_endpoints.py
│   │   ├── test_dashboard_endpoints.py
│   │   ├── test_admin_endpoints.py
│   │   └── test_area_endpoints.py
│   ├── workers/
│   │   ├── test_collection_task.py
│   │   ├── test_alert_task.py
│   │   └── test_maintenance_task.py
│   ├── adapters/
│   │   ├── test_gupy_adapter.py
│   │   └── test_remotive_adapter.py
│   └── migrations/
│       └── test_migrations.py
└── e2e/
    ├── conftest.py
    ├── test_onboarding_flow.py
    ├── test_search_and_apply_flow.py
    ├── test_alert_flow.py
    └── test_admin_flow.py
```

---

## 5. Unit Tests

### Principio

Services testados com **Fake repositories** -- sem banco real, sem I/O.
Mocks **apenas** para servicos externos (Resend, Google OAuth, APIs de vagas).

### Fake Repositories

```python
# tests/fakes.py
class FakeUserRepository:
    def __init__(self):
        self._users: dict[UUID, User] = {}

    async def get_by_email(self, email: str) -> User | None:
        return next((u for u in self._users.values() if u.email == email), None)

    async def get_by_id(self, user_id: UUID) -> User | None:
        return self._users.get(user_id)

    async def create(self, data: UserCreate) -> User:
        user = User(id=uuid4(), **data.model_dump())
        self._users[user.id] = user
        return user

    async def update(self, user_id: UUID, data: UserUpdate) -> User:
        user = self._users[user_id]
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(user, k, v)
        return user

    async def delete(self, user_id: UUID) -> None:
        self._users.pop(user_id, None)

# Mesmo padrao para: FakeJobRepository, FakePreferenceRepository,
# FakeFavoriteRepository, FakeApplicationRepository, FakeAreaRepository,
# FakeSearchHistoryRepository, FakeSourceRepository
```

### Mock de servicos externos

```python
# Mock Resend (email)
class FakeEmailService:
    def __init__(self):
        self.sent: list[dict] = []

    async def send(self, to: str, subject: str, html: str) -> None:
        self.sent.append({"to": to, "subject": subject, "html": html})

    async def send_batch(self, emails: list) -> None:
        self.sent.extend(emails)

# Mock Google OAuth -- usar respx para mock de httpx
# Mock Gupy/Remotive -- usar respx para mock de httpx
```

### O que testar em unit

| Service | Testes |
|---------|--------|
| AuthService | Registro com hash bcrypt, senha fraca, email duplicado, login valido/invalido, refresh token, verificacao email |
| UserService | Get/update perfil, delete com LGPD, export dados |
| PreferenceService | Get defaults, upsert cria/atualiza, validacao area_ids |
| CollectionService | Persist novos jobs, skip duplicates, result summary |
| NormalizationService | Normalizar modalidade, senioridade, salario, sanitizar HTML |
| DeduplicationService | Fingerprint deterministico, ignore case/acentos |
| JobSearchService | Busca por texto, filtros combinados, paginacao, enriquecer com dados do usuario, cache |
| FavoriteService | Adicionar, duplicata, remover, listar |
| ApplicationService | Criar, duplicata, atualizar status, listar por status, export CSV |
| AlertService | Match por modalidade/senioridade/keywords, respeitar frequencia, skip opted-out |
| DashboardService | Contadores, candidaturas por status, vagas recomendadas |
| AdminService | Metricas agregadas, status fontes, reject non-admin |
| RateLimiter | Allow under limit, block over limit, retry-after header |
| i18n | pt-br default, en quando locale en, middleware detecta header |

---

## 6. Integration Tests

### Setup

- **PostgreSQL:** testcontainers-python sobe PG 16 em container efemero por sessao de testes
- **Redis:** Redis real via testcontainers ou fakeredis (para CI mais rapido)
- **Migrations:** `alembic upgrade head` executado uma vez por sessao
- **Cleanup:** Cada teste roda em transacao com rollback automatico (nao commita)

### conftest.py (integration)

```python
import pytest
from testcontainers.postgres import PostgresContainer
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from httpx import AsyncClient, ASGITransport

@pytest.fixture(scope="session")
def pg_container():
    with PostgresContainer("postgres:16") as pg:
        yield pg

@pytest.fixture(scope="session")
async def engine(pg_container):
    url = pg_container.get_connection_url().replace("psycopg2", "asyncpg")
    engine = create_async_engine(url)
    # run migrations
    yield engine
    await engine.dispose()

@pytest.fixture
async def db_session(engine):
    async with AsyncSession(engine) as session:
        async with session.begin():
            yield session
            await session.rollback()

@pytest.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
```

### O que testar em integration

| Componente | Testes |
|------------|--------|
| Migrations | upgrade head + downgrade sem erros |
| UserRepository | CRUD com PG real, constraints (email UNIQUE) |
| JobRepository | Persist, dedup por fingerprint, search_vector, indices GIN |
| PreferenceRepository | Upsert, relacao com areas |
| FavoriteRepository | Add/remove, constraint UNIQUE(user_id, job_id) |
| ApplicationRepository | CRUD, constraint UNIQUE(user_id, job_id), filtro por status |
| API Auth | Registro -> login -> refresh completo via httpx |
| API Jobs | Busca full-text via tsvector com dados reais no PG |
| API Admin | Endpoints protegidos, require_admin |
| Gupy Adapter | Parsing de response real (fixture JSON), mapping correto |
| Remotive Adapter | Parsing de response real, strip HTML |
| Celery Tasks | collect_jobs chama adapter e persiste, expire_stale_jobs |

---

## 7. E2E Tests

Fluxos completos cobrindo os 4 fluxos principais da PRODUCT_SPEC.

### Fluxo 1: Onboarding (US-001, US-006, US-007, US-008 a US-014)

```python
async def test_onboarding_flow(client):
    # 1. Registrar usuario
    r = await client.post("/api/v1/auth/register", json={...})
    assert r.status_code == 201

    # 2. Verificar email
    r = await client.get(f"/api/v1/auth/verify-email?token={token}")
    assert r.status_code == 200

    # 3. Login
    r = await client.post("/api/v1/auth/login", json={...})
    assert r.status_code == 200
    tokens = r.json()

    # 4. Configurar preferencias
    r = await client.put("/api/v1/users/me/preferences", json={...},
                         headers=auth_header(tokens))
    assert r.status_code == 200

    # 5. Acessar dashboard com feed
    r = await client.get("/api/v1/dashboard", headers=auth_header(tokens))
    assert r.status_code == 200
```

### Fluxo 2: Busca + Aplicacao (US-020 a US-023, US-026 a US-029)

```python
async def test_search_and_apply_flow(client, auth_tokens, seeded_jobs):
    # 1. Buscar vagas com filtros
    r = await client.get("/api/v1/jobs?q=python&modality=remoto",
                         headers=auth_header(auth_tokens))
    assert r.status_code == 200
    jobs = r.json()["data"]
    assert len(jobs) > 0

    # 2. Ver detalhes de uma vaga
    job_id = jobs[0]["id"]
    r = await client.get(f"/api/v1/jobs/{job_id}",
                         headers=auth_header(auth_tokens))
    assert r.status_code == 200

    # 3. Favoritar vaga
    r = await client.post("/api/v1/favorites",
                          json={"job_id": job_id},
                          headers=auth_header(auth_tokens))
    assert r.status_code == 201

    # 4. Registrar candidatura
    r = await client.post("/api/v1/applications",
                          json={"job_id": job_id},
                          headers=auth_header(auth_tokens))
    assert r.status_code == 201

    # 5. Atualizar status
    app_id = r.json()["id"]
    r = await client.patch(f"/api/v1/applications/{app_id}",
                           json={"status": "interview"},
                           headers=auth_header(auth_tokens))
    assert r.status_code == 200
```

### Fluxo 3: Alertas (US-032 a US-035)

```python
async def test_alert_flow(client, auth_tokens, seeded_jobs):
    # 1. Configurar preferencias + alertas
    # 2. Simular coleta de novas vagas
    # 3. Verificar matching gera alertas
    # 4. Verificar email enviado (FakeEmailService)
    # 5. Verificar alert_log registrado
    # 6. Testar opt-out: desativar alertas, verificar nao envia
```

### Fluxo 4: Admin (US-039 a US-043)

```python
async def test_admin_flow(client, admin_tokens):
    # 1. Ver metricas
    r = await client.get("/api/v1/admin/metrics",
                         headers=auth_header(admin_tokens))
    assert r.status_code == 200

    # 2. Ver status das fontes
    r = await client.get("/api/v1/admin/sources",
                         headers=auth_header(admin_tokens))
    assert r.status_code == 200

    # 3. Trigger coleta
    source_id = r.json()[0]["id"]
    r = await client.post(f"/api/v1/admin/sources/{source_id}/collect",
                          headers=auth_header(admin_tokens))
    assert r.status_code == 202

    # 4. Verificar non-admin rejeitado
    r = await client.get("/api/v1/admin/metrics",
                         headers=auth_header(user_tokens))
    assert r.status_code == 403
```

---

## 8. TDD Workflow

Obrigatorio conforme CLAUDE.md. Sequencia por feature:

```
1. Escrever teste (RED)
2. Rodar teste -- deve FALHAR
3. Implementar codigo minimo (GREEN)
4. Rodar teste -- deve PASSAR
5. Refatorar se necessario (REFACTOR)
6. Repetir
```

Cada SPEC gerada pelo `/handoff` inclui testes ja definidos. O desenvolvedor:

1. Copia os nomes de testes da SPEC
2. Escreve o corpo do teste ANTES da implementacao
3. Implementa ate passar
4. Adiciona casos de erro (minimo 2)

---

## 9. Testes por TASK

### Fase 1 -- Fundacao

#### TASK-001 -- Setup do projeto
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_health_endpoint_should_return_200 | integration | test_auth_endpoints.py |
| test_settings_should_load_from_env | unit | test_security.py |

#### TASK-002 -- Modelos + migrations
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_migration_upgrade_head_should_succeed | integration | test_migrations.py |
| test_migration_downgrade_should_succeed | integration | test_migrations.py |

#### TASK-003 -- Auth (registro, login, JWT)
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_register_should_create_user_with_hashed_password | unit | test_auth_service.py |
| test_register_when_weak_password_should_return_400 | unit | test_auth_service.py |
| test_register_when_duplicate_email_should_return_409 | unit | test_auth_service.py |
| test_login_should_return_token_pair | unit | test_auth_service.py |
| test_login_when_invalid_credentials_should_return_401 | unit | test_auth_service.py |
| test_refresh_token_should_return_new_access_token | unit | test_auth_service.py |
| test_verify_email_should_activate_user | unit | test_auth_service.py |

#### TASK-004 -- Auth Google OAuth
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_google_auth_new_user_should_create_and_return_tokens | unit | test_auth_service.py |
| test_google_auth_existing_user_should_return_tokens | unit | test_auth_service.py |
| test_google_auth_when_invalid_token_should_return_401 | unit | test_auth_service.py |

#### TASK-005 -- Perfil do usuario (CRUD + LGPD)
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_get_profile_should_return_user_data | unit | test_user_service.py |
| test_update_profile_should_update_allowed_fields | unit | test_user_service.py |
| test_delete_account_should_remove_all_personal_data | unit | test_user_service.py |
| test_delete_account_when_wrong_password_should_return_401 | unit | test_user_service.py |
| test_export_data_should_include_all_user_data | unit | test_user_service.py |

#### TASK-013 -- CRUD areas de atuacao
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_list_areas_should_return_active_only | unit | test_area_service.py |
| test_create_area_should_generate_slug | unit | test_area_service.py |

#### TASK-024 -- Rate limiting
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_rate_limit_should_allow_under_limit | unit | test_rate_limit.py |
| test_rate_limit_should_block_over_limit | unit | test_rate_limit.py |
| test_rate_limit_should_return_retry_after_header | integration | test_rate_limit.py |

#### TASK-025 -- i18n backend
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_t_should_return_pt_br_by_default | unit | test_i18n.py |
| test_t_should_return_en_when_locale_en | unit | test_i18n.py |
| test_middleware_should_detect_locale_from_header | integration | test_i18n.py |

### Fase 2 -- Agregacao de Vagas

#### TASK-006 -- Adapter pattern base + JobSource
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_collection_service_should_persist_new_jobs | unit | test_collection_service.py |
| test_collection_service_should_skip_duplicates | unit | test_collection_service.py |
| test_collection_service_should_return_result_summary | unit | test_collection_service.py |

#### TASK-007 -- Adapter Gupy
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_gupy_adapter_should_map_fields_correctly | integration | test_gupy_adapter.py |
| test_gupy_adapter_should_paginate_all_results | integration | test_gupy_adapter.py |
| test_gupy_adapter_should_handle_network_error | integration | test_gupy_adapter.py |

#### TASK-008 -- Adapter Remotive
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_remotive_adapter_should_map_fields_correctly | integration | test_remotive_adapter.py |
| test_remotive_adapter_should_strip_html_from_description | integration | test_remotive_adapter.py |
| test_remotive_adapter_should_handle_empty_response | integration | test_remotive_adapter.py |

#### TASK-009 -- Normalizacao + deduplicacao
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_normalize_modality_should_map_variations | unit | test_normalization_service.py |
| test_normalize_seniority_should_map_pt_and_en | unit | test_normalization_service.py |
| test_normalize_salary_should_parse_ranges | unit | test_normalization_service.py |
| test_generate_fingerprint_should_be_deterministic | unit | test_deduplication_service.py |
| test_generate_fingerprint_should_ignore_case_and_accents | unit | test_deduplication_service.py |
| test_sanitize_html_should_remove_scripts | unit | test_normalization_service.py |

#### TASK-010 -- Celery setup + worker de coleta
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_collect_task_should_call_adapter_and_persist | integration | test_collection_task.py |
| test_collect_all_should_iterate_active_sources | integration | test_collection_task.py |
| test_collect_task_should_update_source_metadata | integration | test_collection_task.py |

#### TASK-011 -- Worker de expiracao
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_expire_stale_jobs_should_deactivate_old_jobs | integration | test_maintenance_task.py |
| test_expire_stale_jobs_should_keep_recent_jobs | integration | test_maintenance_task.py |

### Fase 3 -- Preferencias + Busca

#### TASK-012 -- CRUD preferencias do usuario
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_get_preferences_should_return_defaults_when_none | unit | test_preference_service.py |
| test_upsert_preferences_should_create_when_new | unit | test_preference_service.py |
| test_upsert_preferences_should_update_when_existing | unit | test_preference_service.py |
| test_upsert_preferences_should_validate_area_ids | unit | test_preference_service.py |

#### TASK-014 -- Busca full-text + filtros
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_search_by_text_should_use_tsvector | integration | test_job_endpoints.py |
| test_search_with_filters_should_combine_with_and | unit | test_job_search_service.py |
| test_search_should_paginate_correctly | unit | test_job_search_service.py |
| test_search_should_enrich_with_user_data_when_authenticated | unit | test_job_search_service.py |
| test_search_should_order_by_relevance_by_default | unit | test_job_search_service.py |
| test_search_should_cache_frequent_queries | integration | test_job_search_service.py |

#### TASK-015 -- Paginacao padronizada
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_pagination_params_should_enforce_limits | unit | test_job_search_service.py |
| test_paginated_response_should_include_total | unit | test_job_search_service.py |

#### TASK-021 -- Historico de busca
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_save_search_should_persist_query_and_filters | unit | test_search_history_service.py |
| test_get_recent_should_return_last_10 | unit | test_search_history_service.py |
| test_clear_should_delete_all_user_history | unit | test_search_history_service.py |

### Fase 4 -- Favoritos, Candidaturas, Alertas

#### TASK-016 -- Favoritos
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_add_favorite_should_create_record | unit | test_favorite_service.py |
| test_add_favorite_when_duplicate_should_return_409 | unit | test_favorite_service.py |
| test_remove_favorite_should_delete_record | unit | test_favorite_service.py |
| test_list_favorites_should_paginate | unit | test_favorite_service.py |

#### TASK-017 -- Candidaturas (CRUD + tracking)
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_create_application_should_set_status_applied | unit | test_application_service.py |
| test_create_application_when_duplicate_should_return_409 | unit | test_application_service.py |
| test_update_application_should_change_status | unit | test_application_service.py |
| test_list_applications_should_filter_by_status | unit | test_application_service.py |
| test_export_csv_should_return_valid_csv | unit | test_application_service.py |

#### TASK-018 -- Alertas por email (matching + Resend)
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_match_jobs_should_filter_by_modality | unit | test_alert_service.py |
| test_match_jobs_should_filter_by_seniority | unit | test_alert_service.py |
| test_match_jobs_should_filter_by_keywords | unit | test_alert_service.py |
| test_send_alerts_should_respect_frequency | unit | test_alert_service.py |
| test_send_alerts_should_skip_opted_out_users | unit | test_alert_service.py |
| test_send_alerts_should_log_in_alert_log | unit | test_alert_service.py |

#### TASK-019 -- Configuracao de alertas
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_get_alert_settings_should_return_current_config | unit | test_alert_service.py |
| test_update_alert_settings_should_persist | unit | test_alert_service.py |

### Fase 5 -- Dashboard + Admin

#### TASK-020 -- Dashboard do usuario
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_dashboard_should_return_new_jobs_count_24h | unit | test_dashboard_service.py |
| test_dashboard_should_return_applications_by_status | unit | test_dashboard_service.py |
| test_dashboard_should_return_recommended_jobs | unit | test_dashboard_service.py |

#### TASK-022 -- Painel admin
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_admin_metrics_should_return_aggregated_data | unit | test_admin_service.py |
| test_admin_sources_should_show_status | unit | test_admin_service.py |
| test_admin_trigger_collection_should_queue_task | unit | test_admin_service.py |
| test_admin_endpoints_should_reject_non_admin | integration | test_admin_endpoints.py |
| test_admin_list_users_should_paginate_and_filter | unit | test_admin_service.py |

#### TASK-023 -- Admin CRUD fontes + areas
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_update_source_should_toggle_active | unit | test_admin_service.py |
| test_update_source_should_change_interval | unit | test_admin_service.py |

### Fase 6 -- LGPD + Exportacao

#### TASK-026 -- Exportacao dados LGPD (JSON)
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_export_should_include_all_user_data | unit | test_user_service.py |
| test_export_should_exclude_sensitive_fields | unit | test_user_service.py |

#### TASK-027 -- Exportacao candidaturas CSV
| Teste | Tipo | Arquivo |
|-------|------|---------|
| test_export_csv_should_return_valid_csv_format | unit | test_application_service.py |
| test_export_csv_should_include_all_applications | unit | test_application_service.py |

**Total: 93 testes obrigatorios** (definidos nas TASKs da ARCHITECTURE.md).
Estimativa com casos de erro adicionais: ~150-180 testes no total.

---

## 10. Testes de Seguranca

Baseados nos findings do Security Review S1 (`docs/reviews/SECURITY-S1.md`).

### SEC-001 -- Admin auto-promocao
| Teste | Tipo |
|-------|------|
| test_update_profile_should_not_accept_is_admin_field | unit |
| test_patch_users_me_when_is_admin_in_body_should_ignore | integration |

### SEC-002 -- IDOR prevention (ownership validation)
| Teste | Tipo |
|-------|------|
| test_delete_favorite_when_other_user_should_return_404 | unit |
| test_update_application_when_other_user_should_return_404 | unit |
| test_delete_application_when_other_user_should_return_404 | unit |
| test_favorite_repo_should_filter_by_user_id_on_delete | integration |
| test_application_repo_should_filter_by_user_id_on_update | integration |

### SEC-003 -- JWT blacklist de refresh tokens
| Teste | Tipo |
|-------|------|
| test_refresh_when_blacklisted_token_should_return_401 | unit |
| test_logout_should_blacklist_refresh_token | unit |
| test_delete_account_should_blacklist_refresh_token | unit |

### SEC-004 -- JWT HS256 com SECRET_KEY segura
| Teste | Tipo |
|-------|------|
| test_jwt_should_use_hs256_algorithm | unit |
| test_settings_should_require_secret_key_min_32_bytes | unit |

### SEC-005 -- Rate limiting em login (brute force)
| Teste | Tipo |
|-------|------|
| test_login_should_block_after_5_attempts_per_email | integration |
| test_login_should_block_after_20_attempts_per_ip | integration |
| test_login_rate_limit_should_reset_after_15_minutes | integration |

### SEC-006 -- Redis auth
| Teste | Tipo |
|-------|------|
| test_redis_connection_should_use_password_when_configured | integration |

### SEC-008 -- Supply chain
| Teste | Tipo |
|-------|------|
| (CI pipeline: pip-audit no CI, nao e teste de codigo) | -- |

---

## 11. Testes de Performance

### Busca full-text com volume

```python
@pytest.mark.slow
async def test_search_performance_with_100k_jobs(db_session, client):
    """Busca full-text deve responder em < 500ms com 100k vagas."""
    # Seed: 100k vagas com search_vector populado
    # Executar busca com filtros
    # Assert response time < 500ms (p95)
```

| Teste | Criterio | Tipo |
|-------|----------|------|
| test_search_performance_with_100k_jobs | < 500ms p95 | integration (slow) |
| test_search_with_filters_performance_100k | < 500ms p95 com filtros combinados | integration (slow) |
| test_pagination_performance_deep_offset | < 500ms com offset=90000 | integration (slow) |

### Rate limiting

| Teste | Criterio | Tipo |
|-------|----------|------|
| test_rate_limit_100_req_per_min_authenticated | 101a req retorna 429 | integration |
| test_rate_limit_30_req_per_min_unauthenticated | 31a req retorna 429 | integration |

### Execucao

Testes de performance marcados com `@pytest.mark.slow` e excluidos do CI padrao.
Rodam em pipeline separado (nightly ou pre-release).

```bash
# Rodar todos exceto slow
pytest -m "not slow"

# Rodar apenas slow
pytest -m slow
```

---

## 12. Fixtures e Factories

### Factories (factory-boy)

```python
# tests/factories.py
import factory
from faker import Faker
from uuid import uuid4

fake = Faker("pt_BR")

class UserFactory(factory.Factory):
    class Meta:
        model = dict

    id = factory.LazyFunction(uuid4)
    email = factory.LazyAttribute(lambda _: fake.email())
    name = factory.LazyAttribute(lambda _: fake.name())
    password_hash = "$2b$12$fakehash..."
    is_active = True
    is_admin = False
    email_verified = True
    locale = "pt-br"
    lgpd_consent_at = factory.LazyFunction(lambda: datetime.now(UTC))

class JobFactory(factory.Factory):
    class Meta:
        model = dict

    id = factory.LazyFunction(uuid4)
    external_id = factory.LazyAttribute(lambda _: fake.uuid4())
    title = factory.LazyAttribute(lambda _: fake.job())
    company = factory.LazyAttribute(lambda _: fake.company())
    description = factory.LazyAttribute(lambda _: fake.text(500))
    location = factory.LazyAttribute(lambda _: f"{fake.city()}-{fake.state_abbr()}")
    modality = factory.LazyFunction(lambda: fake.random_element(
        ["presencial", "remoto", "hibrido", "home_office", "freelance"]
    ))
    seniority = factory.LazyFunction(lambda: fake.random_element(
        ["estagio", "junior", "pleno", "senior", "especialista", "gestao"]
    ))
    url = factory.LazyAttribute(lambda _: fake.url())
    is_active = True

class ApplicationFactory(factory.Factory):
    class Meta:
        model = dict

    id = factory.LazyFunction(uuid4)
    user_id = factory.LazyFunction(uuid4)
    job_id = factory.LazyFunction(uuid4)
    status = "applied"
    notes = None
    applied_at = factory.LazyFunction(lambda: datetime.now(UTC))

# Mesmo padrao para: PreferenceFactory, FavoriteFactory, AreaFactory,
# JobSourceFactory, SearchHistoryFactory, AlertLogFactory
```

### Fixtures globais (conftest.py)

```python
@pytest.fixture
def user_data():
    return UserFactory()

@pytest.fixture
def admin_data():
    return UserFactory(is_admin=True)

@pytest.fixture
def job_data(source_data):
    return JobFactory(source_id=source_data["id"])

@pytest.fixture
def auth_tokens(user_data):
    """Retorna access_token e refresh_token para um usuario de teste."""
    ...

@pytest.fixture
def admin_tokens(admin_data):
    """Retorna tokens para um usuario admin."""
    ...

@pytest.fixture
def seeded_jobs(db_session):
    """Insere 50 vagas de teste no banco para testes de busca."""
    ...
```

---

## 13. CI Pipeline

### Stages

```yaml
# .github/workflows/test.yml (ou equivalente)
stages:
  - lint
  - unit-tests
  - integration-tests
  - coverage-check
```

### Detalhamento

| Stage | Comando | Criterio de falha |
|-------|---------|-------------------|
| lint | `ruff check . && ruff format --check . && mypy --strict src/` | Qualquer erro |
| unit-tests | `pytest tests/unit -m unit --tb=short` | Qualquer falha |
| integration-tests | `pytest tests/integration -m integration --tb=short` | Qualquer falha |
| coverage-check | `pytest --cov=src --cov-report=term-missing --cov-fail-under=80` | Coverage < 80% |
| pip-audit | `pip-audit --strict` | Vulnerabilidade conhecida (SEC-008) |

### Servicos no CI

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: jobRadar_test
    ports:
      - 5432:5432
  redis:
    image: redis:7
    ports:
      - 6379:6379
```

### Comandos rapidos (Makefile)

```makefile
test:
	pytest tests/unit tests/integration -m "not slow" --tb=short

test-unit:
	pytest tests/unit -m unit --tb=short -q

test-integration:
	pytest tests/integration -m integration --tb=short

test-e2e:
	pytest tests/e2e -m e2e --tb=short

test-all:
	pytest --tb=short

coverage:
	pytest --cov=src --cov-report=term-missing --cov-fail-under=80

test-slow:
	pytest -m slow --tb=short
```

### Gates

- **PR merge:** lint + unit + integration + coverage >= 80% + pip-audit
- **Nightly:** lint + unit + integration + e2e + slow (performance)
- **Pre-release:** tudo incluindo e2e e slow

---

## Resumo

| Metrica | Valor |
|---------|-------|
| Testes obrigatorios (ARCHITECTURE.md) | 93 |
| Testes de seguranca (S1 findings) | ~17 |
| Testes de performance | ~5 |
| Testes E2E (fluxos) | 4 fluxos |
| Estimativa total com casos de erro | ~150-180 testes |
| Cobertura minima | 80% |
| TDD | Obrigatorio |
| Nomenclatura | test_[o_que_faz]_when_[condicao]_should_[resultado] |
