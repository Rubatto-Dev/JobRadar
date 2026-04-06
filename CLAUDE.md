# JobRadar — Contexto para Claude Code

> Este arquivo e lido automaticamente pelo Claude Code em toda sessao.

---

## O que e este projeto

Sistema web para busca centralizada de vagas de emprego, estagio, trabalho remoto e freelance no Brasil e globalmente. Agrega vagas de multiplas fontes externas (Gupy, Remotive), personaliza resultados com base em preferencias do usuario e oferece tracking de candidaturas com alertas por email.

**Dono:** rubatto-dev
**Objetivo:** Reduzir o tempo que candidatos gastam buscando vagas em multiplas plataformas
**Tipo:** multi-user

---

## Stack tecnologica

| Camada | Tecnologia | Versao |
|---|---|---|
| Backend | Python + FastAPI | 3.12 / 0.115+ |
| Frontend | Bootstrap 5 (definido pelo Codex) | 5 |
| Banco | PostgreSQL | 16 |
| Cache/Broker | Redis | 7+ |
| ORM | SQLAlchemy async | 2.0+ |
| Migrations | Alembic | 1.13+ |
| Task Queue | Celery | 5.4+ |
| Email | Resend (Python SDK) | 2.0+ |
| i18n | python-i18n (YAML-based) | latest |
| Testes | pytest + pytest-asyncio + httpx + respx | latest |
| Linting | ruff + mypy --strict | latest |
| Containerizacao | Docker + Docker Compose | latest |

---

## Estrutura de pastas

```
JobRadar/
├── CLAUDE.md
├── docker-compose.yml
├── Makefile
├── .env.example              <-- obrigatorio, nunca .env commitado
├── docs/
│   ├── CONTEXT.md
│   ├── PRODUCT_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── USER_STORIES.md
│   ├── TEST_STRATEGY.md
│   ├── PROJECT_PLAN.md
│   └── reviews/
├── backend/
│   ├── pyproject.toml
│   ├── src/
│   │   ├── api/routers/      <-- controllers: <= 5 linhas de logica
│   │   ├── services/         <-- TODA regra de negocio
│   │   ├── repositories/     <-- TODO acesso ao banco
│   │   ├── models/           <-- modelos ORM
│   │   ├── schemas/          <-- Pydantic request/response
│   │   ├── protocols/        <-- interfaces/abstractions (Protocol)
│   │   ├── adapters/         <-- conectores para fontes externas (Gupy, Remotive)
│   │   ├── workers/          <-- tasks Celery (coleta, alertas, manutencao)
│   │   ├── core/             <-- config, dependencies, exceptions, security
│   │   └── i18n/             <-- arquivos YAML de traducao (pt-br, en)
│   └── tests/
│       ├── unit/             <-- services com fakes, sem banco
│       ├── integration/      <-- com banco real (testcontainers)
│       └── e2e/              <-- fluxos completos
└── frontend/
    └── src/
        ├── components/
        ├── hooks/
        ├── services/
        └── types/
```

---

## Arquitetura — regras absolutas

### Controller/Router
- Maximo 5 linhas de logica
- So valida request (Pydantic), chama service, retorna response
- ZERO SQL, ZERO regra de negocio

### Service
- TODA regra de negocio aqui
- Sem imports de ORM direto (from sqlalchemy = violacao)
- Sem HTTP status codes — usa excecoes de dominio

### Repository
- TODO acesso ao banco aqui
- Sem regras de negocio
- Retorna objetos de dominio, nao ORM models crus

### Protocol
- Define contratos entre camadas
- Services dependem do Protocol, nao da implementacao concreta

### Adapter (fontes de vagas)
- Um adapter por fonte (GupyAdapter, RemotiveAdapter)
- Implementa JobSourceProtocol
- Normaliza dados para formato padrao do JobRadar
- Modalidades: presencial, remoto, home_office, hibrido, freelance
- Senioridade: estagio, junior, pleno, senior, especialista, gestao

---

## Padroes de codigo

- Type hints obrigatorios — mypy --strict
- Sem print() — usar logger estruturado (JSON com correlation ID)
- Sem os.environ direto — usar Pydantic Settings
- Sem secrets hardcoded
- Linting: `ruff check . && ruff format --check . && mypy --strict .`

---

## Testes

- TDD obrigatorio: teste primeiro, implementacao depois
- Cobertura minima: 80% global, 95% domain/utils, 85% services
- Services testados com Fake repositories (sem banco real em unit)
- Mocks apenas para servicos externos (Resend, Google OAuth, APIs de vagas) via respx
- Integration com banco real via testcontainers-python
- Nomenclatura: `test_[o_que_faz]_when_[condicao]_should_[resultado]`
- Happy path + minimo 2 casos de erro por feature

---

## Git e commits

Conventional Commits:
```
feat(modulo): descricao
fix(modulo): descricao
refactor(modulo): descricao
test(modulo): descricao
docs: descricao
```

Branch por task: `JR-{TASK_ID}-{titulo-kebab-case}` (ex: JR-001-setup-projeto)

---

## Seguranca

- SQL via ORM ou queries parametrizadas — NUNCA string concatenation
- Sem secrets em logs, responses ou arquivos commitados
- CORS para origens especificas (nao wildcard em producao)
- DEBUG=False em producao
- JWT HS256: access token 15min, refresh token 7d
- Senhas: bcrypt cost 12
- Rate limiting: 100 req/min autenticado, 30 req/min nao-autenticado
- Rate limiting login: 5 tentativas/15min por email (SEC-005)
- Verificar ownership em todo acesso a recurso (IDOR prevention, SEC-002)
- Proteger schema UserUpdate contra auto-promocao admin (SEC-001)
- Blacklist de refresh tokens no Redis (SEC-003)

---

## Como rodar localmente

```bash
cp .env.example .env
# Editar .env com valores reais (ver .env.example para variaveis necessarias)
docker compose up
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

---

## Documentacao do projeto

| Documento | Descricao | Caminho |
|---|---|---|
| CONTEXT.md | Sumario executivo | docs/CONTEXT.md |
| PRODUCT_SPEC.md | Requisitos e escopo | docs/PRODUCT_SPEC.md |
| ARCHITECTURE.md | Arquitetura e contratos | docs/ARCHITECTURE.md |
| USER_STORIES.md | User stories com BDD | docs/USER_STORIES.md |
| TEST_STRATEGY.md | Estrategia de testes | docs/TEST_STRATEGY.md |
| PROJECT_PLAN.md | Plano de implementacao | docs/PROJECT_PLAN.md |
| SECURITY-S1.md | Review de arquitetura | docs/reviews/SECURITY-S1.md |

## Workflow por task

```
/handoff TASK-XXX -> TDD (teste primeiro) -> implementacao -> lint+typecheck -> /review -> /security-review S2 -> commit
```
