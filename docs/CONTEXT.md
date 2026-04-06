# CONTEXT.md -- JobRadar

> Sumario executivo. Leia este documento ANTES de qualquer outro.

---

## Projeto

**Nome:** JobRadar
**Descricao:** Sistema web para busca centralizada de vagas de emprego, estagio e trabalho remoto. Agrega vagas de multiplas fontes externas, personaliza resultados com base em preferencias do usuario e oferece tracking de candidaturas.

## Problema

Candidatos gastam horas visitando multiplas plataformas de vagas sem centralizacao. O JobRadar resolve isso agregando tudo em um unico lugar com filtros, alertas e acompanhamento.

## Para quem

- **Candidatos ativos** buscando emprego (foco Brasil)
- **Profissionais em transicao** explorando novas areas
- **Admin** da plataforma gerenciando fontes e metricas

## Requisitos-chave (top 5)

1. Cadastro/auth com email+senha e Google OAuth
2. Preferencias configuraveis: modalidade, area, localizacao, senioridade
3. Agregacao de vagas de 2+ fontes com normalizacao e deduplicacao
4. Busca full-text com filtros combinaveis
5. Alertas por email quando novas vagas correspondem as preferencias

## Restricoes criticas

- LGPD: consentimento, exclusao de dados, exportacao
- Respeitar robots.txt e ToS das fontes de vagas
- Backend: Python + FastAPI + PostgreSQL (padrao do time)
- Deploy: Docker Compose

## Stack tecnica (definida)

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Backend | Python + FastAPI | 3.12 / 0.115+ |
| Banco | PostgreSQL | 16 |
| ORM | SQLAlchemy async | 2.0+ |
| Migrations | Alembic | 1.13+ |
| Cache/Broker | Redis | 7+ |
| Task Queue | Celery | 5.4+ |
| Email | Resend (Python SDK) | 2.0+ |
| Full-text Search | PostgreSQL tsvector + GIN | nativo |
| Frontend | Definido pelo Codex (Bootstrap 5) | -- |
| Containerizacao | Docker Compose | latest |
| Deploy | VPS (Hetzner ou DigitalOcean) | -- |

## Fontes de vagas (MVP)

| Fonte | Tipo | Intervalo | Status |
|-------|------|-----------|--------|
| Gupy (portal.api.gupy.io) | API publica, sem auth | 2h | Validada |
| Remotive (remotive.com/api) | API publica, sem auth | 6h | Validada |
| Jobicy | API publica | v1.1 | Validada |
| Adzuna | API com key gratuita | v1.1 | Validada |

## Decisoes arquiteturais (ADRs)

| ADR | Decisao | Motivo |
|-----|---------|--------|
| ADR-001 | Gupy + Remotive no MVP | APIs publicas validadas, sem auth, dados ricos |
| ADR-002 | Resend para email | API moderna, SDK tipado, 100/dia gratis |
| ADR-003 | PostgreSQL tsvector | Suficiente para 100k vagas, zero infra extra |
| ADR-004 | VPS com Docker Compose | Custo previsivel, compativel com restricao RT-003 |
| ADR-005 | Celery + Redis | Battle-tested, beat scheduler nativo |
| ADR-006 | python-i18n (YAML) | Simples para 2 idiomas |

## Fases e tasks

| Fase | Nome | Tasks | Pre-requisito |
|------|------|-------|---------------|
| 1 | Fundacao (Infra + Auth) | TASK-001 a TASK-005, TASK-013, TASK-024, TASK-025 | Nenhum |
| 2 | Agregacao de Vagas | TASK-006 a TASK-011 | Fase 1 (TASK-001, TASK-002) |
| 3 | Preferencias + Busca | TASK-012, TASK-014, TASK-015, TASK-021 | Fase 1 (TASK-002, TASK-003) |
| 4 | Favoritos, Candidaturas, Alertas | TASK-016 a TASK-019 | Fases 1-3 |
| 5 | Dashboard + Admin | TASK-020, TASK-022, TASK-023 | Fases 1-4 |
| 6 | LGPD + Exportacao | TASK-026, TASK-027 | Fases 1-4 |

**Total: 6 fases, 27 tasks**
**Paralelismo:** Fases 2 e 3 podem rodar em paralelo apos TASK-002.

## Status atual

- **PRODUCT_SPEC.md** -- concluido e validado
- **ARCHITECTURE.md** -- concluido (6 ADRs, 27 tasks, 6 fases)
- **Proximo passo:** `/handoff` para primeira task (TASK-001)

## Mapa de documentos

| Documento | Status | Caminho |
|-----------|--------|---------|
| CONTEXT.md | Concluido | docs/CONTEXT.md |
| PRODUCT_SPEC.md | Concluido | docs/PRODUCT_SPEC.md |
| ARCHITECTURE.md | Concluido | docs/ARCHITECTURE.md |
| SECURITY-REVIEW S1 | Concluido | docs/reviews/SECURITY-S1.md |
| USER_STORIES.md | Concluido | docs/USER_STORIES.md |
| TEST_STRATEGY.md | Concluido | docs/TEST_STRATEGY.md |
| PROJECT_PLAN.md | Concluido | docs/PROJECT_PLAN.md |
