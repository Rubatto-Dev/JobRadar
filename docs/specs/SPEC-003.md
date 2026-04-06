# SPEC-003 -- Auth (registro, login, JWT, email verification, forgot/reset)

> **Data:** 2026-04-06 | **Agente:** My_AI_Team / Task Spec Expert
> **Referencia:** TASK-003 do PROJECT_PLAN.md (linha 271)
> **Status:** Aguardando implementacao
> **Estimativa:** L (1-2d)
> **Linear:** RUB-21

---

## Contexto

Implementa o fluxo completo de autenticacao por email/senha do JobRadar. Esta e a task mais critica da Fase 1 -- quase todas as tasks subsequentes dependem de auth funcionando.

**Fluxo:**
```
[TASK-002: models] --> **[TASK-003: auth]** --> [TASK-004: OAuth] + [TASK-005: perfil]
```

## Pre-requisitos
- [x] SPEC-002: Modelos ORM (User model disponivel)

## Escopo

### SERA feito
- core/security.py: hash, verify, JWT encode/decode
- core/exceptions.py: excecoes de dominio
- protocols/auth.py: UserRepositoryProtocol, RedisProtocol, EmailProtocol
- repositories/user_repository.py: acesso ao banco
- services/auth_service.py: regras de negocio
- schemas/auth.py: request/response DTOs
- api/routers/auth.py: endpoints REST

### NAO sera feito
- Google OAuth (TASK-004)
- Rate limiting (TASK-024)
- i18n das mensagens (TASK-025)

## Testes obrigatorios

9 testes unit em `tests/unit/services/test_auth_service.py` + 1 em `tests/unit/core/test_security.py`.
Ver PROJECT_PLAN.md linhas 316-326 para lista completa.

## Implementacao

Arquivos na ordem de criacao:
1. `backend/src/core/exceptions.py`
2. `backend/src/core/security.py`
3. `backend/src/protocols/auth.py`
4. `backend/src/repositories/user_repository.py`
5. `backend/src/schemas/auth.py`
6. `backend/src/services/auth_service.py`
7. `backend/src/api/routers/auth.py`
8. `backend/tests/fakes.py` (fake repo + fake redis + fake email)

Contratos completos no PROJECT_PLAN.md linhas 294-312.

## Security
- SEC-003: Blacklist refresh tokens no Redis
- SEC-004: JWT HS256, SECRET_KEY >= 32 bytes
- SEC-005: Rate limiting login (sera implementado em TASK-024)

---

*Gerado por My_AI_Team -- Task Spec Expert*
