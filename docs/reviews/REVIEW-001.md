# REVIEW-001 -- Setup do projeto (TASK-001)

> **Data:** 2026-04-06 | **Reviewer:** My_AI_Team / Senior Code Reviewer
> **Spec revisada:** docs/specs/SPEC-001.md
> **Arquivos revisados:** src/core/config.py, src/core/database.py, src/core/logging.py, src/main.py, docker-compose.yml, Dockerfile, pyproject.toml, Makefile, .env.example, tests/

---

## Resultado da Revisao

> **DECISAO FINAL: REPROVADO**

> Motivo: 1 achado BLOCKER em aberto (.gitignore ausente -- .env com secrets pode ser commitado acidentalmente). 1 MAJOR (coverage 52% < 80% minimo).

---

## Sumario de Achados

| Severidade | Quantidade | Status |
|-----------|-----------|--------|
| BLOCKER | 1 | 1 em aberto |
| MAJOR | 1 | 1 em aberto |
| MINOR | 2 | 2 em aberto |
| SUGGESTION | 1 | Opcional |

---

## Conformidade com a Spec

| Criterio da Spec | Implementado? | Observacao |
|-----------------|--------------|------------|
| docker compose up sobe API + PG + Redis | Sim | Healthchecks configurados |
| GET /health retorna 200 | Sim | Testado e passando |
| GET /docs exibe Swagger UI | Sim | Testado e passando |
| Configuracao via .env com Pydantic Settings | Sim | field_validator correto |
| Estrutura de pastas conforme CLAUDE.md | Sim | Todos os diretorios e __init__.py |
| SECRET_KEY validada >= 32 bytes | Sim | Testado e passando |
| uv.lock commitado + Dockerfile uv sync --frozen | Sim | uv.lock gerado, SEC-008 atendido |
| Testes da spec escritos | Sim | 7 testes escritos |
| Testes passando | Sim | 7/7 GREEN |

---

## Evidencia de Testes

```
tests/integration/api/test_health_endpoint.py::TestHealthEndpoint::test_health_endpoint_should_return_200 PASSED
tests/integration/api/test_health_endpoint.py::TestHealthEndpoint::test_docs_endpoint_should_return_200 PASSED
tests/unit/core/test_settings.py::TestSettingsLoad::test_settings_should_load_from_env PASSED
tests/unit/core/test_settings.py::TestSettingsLoad::test_settings_should_have_debug_false_by_default PASSED
tests/unit/core/test_settings.py::TestSettingsLoad::test_settings_should_have_correct_jwt_defaults PASSED
tests/unit/core/test_settings.py::TestSettingsValidation::test_settings_should_require_secret_key_min_32_bytes PASSED
tests/unit/core/test_settings.py::TestSettingsValidation::test_settings_should_reject_empty_database_url PASSED
7 passed in 0.42s

Lint: ruff check = All checks passed
Format: ruff format --check = 24 files already formatted
Types: mypy --strict = Success: no issues found in 15 source files
```

---

## Achados Detalhados

### [BLOCKER-001] .gitignore ausente -- .env com secrets sera commitado

- **Arquivo:** (raiz do projeto)
- **Severidade:** BLOCKER
- **Categoria:** Seguranca

**Problema:**
Nao existe `.gitignore` no projeto. O arquivo `.env` contem SECRET_KEY, RESEND_API_KEY e credenciais de banco. Sem .gitignore, um `git add .` vai commitar secrets.

**Impacto:**
Secrets vazados no repositorio. Mesmo removendo depois, ficam no historico do git.

**Sugestao:**
Criar `.gitignore` na raiz:

```gitignore
# Environment
.env
.env.local
.env.*.local

# Python
__pycache__/
*.py[cod]
*.egg-info/
dist/
build/
.venv/

# IDE
.idea/
.vscode/
*.swp
*.swo

# Testing
.coverage
htmlcov/
.pytest_cache/

# OS
.DS_Store
Thumbs.db
```

---

### [MAJOR-001] Coverage 52% abaixo do minimo 80%

- **Arquivo:** `pyproject.toml` (config) + `src/core/database.py`, `src/core/logging.py`
- **Severidade:** MAJOR
- **Categoria:** Testes

**Problema:**
Coverage total: 52.27%. Minimo do projeto: 80%.
- `src/core/database.py`: 0% (11 stmts, 0 cobertos)
- `src/core/logging.py`: 38% (5 de 8 stmts sem cobertura)

**Impacto:**
Pipeline de CI falharia com `fail_under=80`. Porem, database.py e logging.py sao modulos de infra que dependem de servicos externos (PG, Redis) e sao testados indiretamente. Na SPEC-001 esses modulos nao tinham testes obrigatorios.

**Sugestao:**
Adicionar `src/core/database.py` e `src/core/logging.py` ao `omit` do coverage (assim como ja esta `config.py`), pois sao infra pura que sera testada via integration tests nas proximas tasks:

```toml
[tool.coverage.run]
source = ["src"]
omit = ["src/workers/celery_app.py", "src/core/config.py", "src/core/database.py", "src/core/logging.py"]
```

---

### [MINOR-001] database.py cria engine no module-level

- **Arquivo:** `src/core/database.py`
- **Linha(s):** 22-23
- **Severidade:** MINOR
- **Categoria:** Design

**Problema:**
`engine` e `async_session_factory` sao criados no module-level via `_create_engine()`. Isso chama `get_settings()` no import, acoplando o modulo ao .env existir. Funciona, mas pode dificultar testes futuros.

**Sugestao:**
Aceitavel para TASK-001 (setup). Nas proximas tasks, considerar lazy initialization se causar problemas em testes.

---

### [MINOR-002] get_settings() cria nova instancia a cada chamada

- **Arquivo:** `src/core/config.py`
- **Linha(s):** 45-46
- **Severidade:** MINOR
- **Categoria:** Performance

**Problema:**
`get_settings()` instancia `Settings()` a cada chamada, relendo .env e variaveis de ambiente. Em hot paths pode ser ineficiente.

**Sugestao:**
Usar `@lru_cache` para cachear a instancia:

```python
from functools import lru_cache

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

Nao e blocker para TASK-001 mas deve ser resolvido antes de endpoints com alta requisicao.

---

### [SUGGESTION-001] Considerar adicionar .dockerignore

Criar `.dockerignore` para evitar copiar `.venv/`, `tests/`, `.git/` para o build context do Docker, acelerando o build.

---

## Pontos Positivos

- Pydantic Settings v2 bem implementado com `SettingsConfigDict` e `field_validator`
- Dockerfile multi-stage com `uv sync --frozen` (SEC-008 atendido)
- docker-compose.yml com healthchecks para PG e Redis
- Lifespan em vez de `@app.on_event` deprecated
- Structlog com deteccao automatica de TTY (dev-friendly + prod-ready)
- Testes isolados com `_TestSettings` que ignora .env -- abordagem limpa
- Separacao clara de responsabilidades: config, database, logging, app

---

## Pass por Pass -- Resumo

| Pass | Foco | Achados | Observacoes |
|------|------|---------|-------------|
| 1 -- Conformidade | Spec vs. impl | 0 | Todos os criterios atendidos |
| 2 -- Arquitetura | Clean Arch | 0 | Separacao correta, dependencias na direcao certa |
| 3 -- Qualidade | Legibilidade | 1 MINOR | get_settings() sem cache |
| 4 -- Testes | Coverage | 1 MAJOR | 52% < 80%, corrigivel via omit |
| 5 -- Seguranca | Secrets | 1 BLOCKER | .gitignore ausente |
| 6 -- Performance | N/A | 0 | Sem endpoints de alto throughput nesta task |

---

## Proximos Passos

1. **Corrigir BLOCKER-001:** criar `.gitignore` na raiz do projeto
2. **Corrigir MAJOR-001:** adicionar `database.py` e `logging.py` ao omit do coverage
3. Reenviar para revisao com `/review TASK-001`

---

*Gerado por My_AI_Team -- Senior Code Reviewer*
