# SECURITY-REVIEW -- S1 (Arquitetura)

> **Data:** 2026-04-04 | **Gate:** S1 | **Veredito:** APPROVED (com ressalvas)
> **Sonarqube:** nao disponivel (gate S1 -- analise de arquitetura, sem codigo)

---

## Escopo

- **Gate:** S1 -- Revisao de Arquitetura
- **Documentos revisados:**
  - `docs/CONTEXT.md`
  - `docs/PRODUCT_SPEC.md`
  - `docs/ARCHITECTURE.md`

---

## Threat Model STRIDE

| Ameaca | Componente | Aplicavel? | Risco | Mitigacao Proposta na Arquitetura | Adequada? |
|--------|-----------|------------|-------|-----------------------------------|-----------|
| **Spoofing** | API Backend (auth) | Sim | Alto | JWT access (15min) + refresh (7d), bcrypt cost 12, Google OAuth via ID token | Sim, com ressalvas (SEC-003, SEC-004) |
| **Spoofing** | Google OAuth | Sim | Medio | Validacao do ID token no backend | Sim |
| **Spoofing** | Workers -> APIs externas | Nao | -- | Workers sao clientes HTTP, nao recebem requests | N/A |
| **Tampering** | API Backend | Sim | Alto | JWT signed, Pydantic validation, SQLAlchemy parametrizado | Sim |
| **Tampering** | Redis (broker/cache) | Sim | Medio | Comunicacao interna via Docker network | Sim para MVP (SEC-006) |
| **Tampering** | PostgreSQL | Sim | Alto | Acesso via ORM parametrizado, sem string concatenation | Sim |
| **Repudiation** | API Backend | Sim | Medio | Logs estruturados (structlog JSON), correlation ID, audit de login/exclusao | Sim |
| **Repudiation** | Workers | Sim | Baixo | Logs de coleta (inicio, fim, resultado, erros) | Sim |
| **Information Disclosure** | API responses | Sim | Alto | Sem password_hash em responses, sem dados internos em export LGPD | Sim (SEC-007) |
| **Information Disclosure** | Logs | Sim | Medio | Sem dados sensiveis em logs (email masked em login falho) | Sim |
| **Information Disclosure** | Error responses | Sim | Baixo | DEBUG=False em prod, verbose errors apenas em dev | Sim |
| **Denial of Service** | API Backend | Sim | Alto | Rate limiting: 100/min auth, 30/min unauth | Sim (SEC-005) |
| **Denial of Service** | Workers | Sim | Baixo | Concorrencia limitada por fila, backoff em erros | Sim |
| **Denial of Service** | PostgreSQL | Sim | Medio | Connection pooling (SQLAlchemy async), indices GIN/B-tree | Sim |
| **Elevation of Privilege** | Admin endpoints | Sim | Alto | `require_admin` dependency, is_admin flag no User | Sim (SEC-001, SEC-002) |
| **Elevation of Privilege** | Resource ownership | Sim | Alto | Ownership check por user_id nos services (favoritos, candidaturas) | Sim, se implementado corretamente |

---

## OWASP ASVS -- Controles Relevantes (Nivel 1)

| ASVS | Controle | Coberto? | Evidencia |
|------|----------|----------|-----------|
| V2.1 | Password Security | Sim | bcrypt cost 12, min 8 chars, 1 maiuscula, 1 numero |
| V2.2 | General Authenticator | Sim | JWT access 15min, refresh 7d |
| V2.5 | Credential Recovery | Sim | Token expiravel 30min via email |
| V2.7 | Out-of-Band Verifier | Sim | Email verification obrigatorio |
| V3.1 | Session Management | Parcial | JWT stateless -- sem revogacao de token (SEC-003) |
| V3.5 | Token-based Session | Sim | JWT com expiracao, refresh token |
| V4.1 | Access Control Design | Sim | Role-based (user/admin), resource ownership |
| V5.1 | Input Validation | Sim | Pydantic v2 em todos os endpoints |
| V5.3 | Output Encoding | Sim | HTML sanitizado nas vagas (sanitize_html) |
| V6.2 | Algorithms | Parcial | Arquitetura menciona JWT RS256 na stack mas config usa HS256 (SEC-004) |
| V8.1 | Data Protection | Sim | LGPD consent, exclusao, exportacao |
| V9.1 | Communications Security | Sim | TLS 1.2+ obrigatorio em prod |
| V10.1 | Code Integrity | Parcial | Dependabot/pip-audit mencionado mas nao detalhado (SEC-008) |
| V13.1 | API Security | Sim | REST versionado, rate limiting, OpenAPI |

---

## Findings

### MEDIUM SEC-001 -- Admin role via boolean flag sem protecao contra auto-promocao

- **CWE:** CWE-269 (Improper Privilege Management)
- **Descricao:** O campo `is_admin` e um boolean na tabela User. O endpoint `PATCH /api/v1/admin/users/{id}` permite um admin promover outro usuario a admin. Nao ha mecanismo para impedir que um admin se auto-promova ou que haja apenas um super-admin. Para MVP, risco e baixo (admin unico), mas a arquitetura deve prever o cenario.
- **Mitigacao:**
  1. Garantir que `PATCH /api/v1/users/me` NAO aceite `is_admin` no schema de update (UserUpdate). Isso ja parece intencional pela spec, mas deve ser enforced no Pydantic schema.
  2. Documentar que o primeiro admin e criado via migration/seed, nunca via API publica.
  3. Para v2: considerar RBAC com tabela de roles separada.

### MEDIUM SEC-002 -- Falta de validacao de ownership em DELETE de candidaturas e favoritos

- **CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key)
- **Descricao:** Os endpoints `DELETE /api/v1/applications/{id}` e `DELETE /api/v1/favorites/{job_id}` recebem IDs na URL. A arquitetura define `user_id` como parametro nos services, mas a implementacao deve garantir que o service valide que o recurso pertence ao usuario autenticado (IDOR prevention). O contrato do service inclui `user_id`, o que e correto -- este finding e para garantir que a implementacao nao pule essa verificacao.
- **Mitigacao:** Na implementacao dos repositories, SEMPRE filtrar por `user_id` AND `resource_id` em queries de DELETE e UPDATE. Exemplo: `WHERE id = :app_id AND user_id = :user_id`.

### MEDIUM SEC-003 -- JWT stateless sem mecanismo de revogacao

- **CWE:** CWE-613 (Insufficient Session Expiration)
- **Descricao:** A arquitetura usa JWT stateless com access token de 15min e refresh token de 7d. Nao ha mecanismo de revogacao (blacklist) para invalidar tokens em cenarios como: logout, exclusao de conta, comprometimento de credenciais. Um token roubado permanece valido por ate 15 minutos (access) ou 7 dias (refresh).
- **Mitigacao:**
  1. Para MVP: aceitar risco residual com access token curto (15min). O window de exposicao e limitado.
  2. Implementar blacklist de refresh tokens no Redis com TTL de 7 dias. Ao fazer logout ou delete account, adicionar refresh token a blacklist.
  3. No `refresh_token` endpoint, verificar se o token esta na blacklist antes de emitir novo access token.
  4. Alternativa simplificada: armazenar um `token_version` (int) no User. Incrementar no logout/delete. Incluir `token_version` no JWT payload. Rejeitar tokens com version diferente.

### MEDIUM SEC-004 -- Inconsistencia no algoritmo JWT (RS256 vs HS256)

- **CWE:** CWE-327 (Use of a Broken or Risky Cryptographic Algorithm)
- **Descricao:** A secao 2 (Stack) menciona `python-jose` com `JWT RS256`, mas o contrato de config em TASK-001 define `JWT_ALGORITHM: str = "HS256"`. HS256 (HMAC) e aceitavel para single-service, mas RS256 (RSA) e mais seguro para cenarios onde o token pode ser verificado por terceiros. Inconsistencia deve ser resolvida.
- **Mitigacao:**
  1. Para MVP single-service: HS256 e suficiente. Padronizar no doc e no codigo como HS256.
  2. Garantir que `SECRET_KEY` tenha pelo menos 256 bits de entropia (32+ bytes aleatorios).
  3. Para v2 (se precisar verificar tokens em microservicos): migrar para RS256 com par de chaves.
  4. Atualizar a secao 2 do ARCHITECTURE.md para refletir a decisao (HS256).

### MEDIUM SEC-005 -- Rate limiting em login insuficiente contra brute force

- **CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)
- **Descricao:** A arquitetura define rate limiting global (100/min auth, 30/min unauth) mas tambem menciona "5 tentativas/15min" para login na secao de seguranca. O rate limiting global de 30 req/min para nao-autenticados e alto demais para proteger contra brute force de senha -- permite 30 tentativas de login por minuto por IP.
- **Mitigacao:**
  1. Implementar rate limiting especifico para `POST /auth/login`: maximo 5 tentativas por email em janela de 15 minutos.
  2. Implementar rate limiting por IP para login: maximo 20 tentativas por IP em janela de 15 minutos.
  3. Retornar resposta generica ("credenciais invalidas") sem indicar se email existe ou nao.
  4. O endpoint `POST /auth/forgot-password` ja retorna mensagem generica -- correto.

### LOW SEC-006 -- Redis sem autenticacao na rede Docker interna

- **CWE:** CWE-287 (Improper Authentication)
- **Descricao:** A arquitetura nao menciona autenticacao para Redis. Em Docker Compose, Redis e acessivel apenas na rede interna, o que e aceitavel para dev/MVP. Em producao (VPS), se outros containers ou processos compartilharem a rede, Redis estaria exposto sem senha.
- **Mitigacao:**
  1. Para MVP: aceitar risco (rede Docker isolada).
  2. Para producao: configurar `requirepass` no Redis e incluir senha na `REDIS_URL` (`redis://:password@redis:6379`).
  3. Garantir que a porta 6379 NAO esteja exposta no host (`ports` vs `expose` no docker-compose.yml).

### LOW SEC-007 -- Export LGPD pode expor dados de vagas de outros usuarios indiretamente

- **CWE:** CWE-200 (Exposure of Sensitive Information)
- **Descricao:** O endpoint `GET /users/me/export` retorna favoritos e candidaturas que incluem dados da vaga (titulo, empresa, URL). Isso e esperado e necessario para LGPD. Nao ha risco real aqui -- as vagas sao dados publicos. Registrado como INFO.
- **Severidade reclassificada:** INFO

### LOW SEC-008 -- Supply chain: dependencias sem lockfile mencionado

- **CWE:** CWE-1357 (Reliance on Insufficiently Trustworthy Component)
- **Descricao:** A arquitetura menciona Dependabot/pip-audit mas nao especifica uso de lockfile (`uv.lock` ou `requirements.txt` com hashes). O `pyproject.toml` define dependencias com versoes minimas (ex: `fastapi >= 0.115`), mas sem lockfile pinado, builds podem puxar versoes diferentes.
- **Mitigacao:**
  1. Usar `uv lock` para gerar `uv.lock` com hashes de todas as dependencias.
  2. Commitar o lockfile no repositorio.
  3. No Dockerfile, usar `uv sync --frozen` para garantir builds reprodutiveis.
  4. Executar `pip-audit` no CI antes de cada merge.

### INFO SEC-009 -- Scraping: riscos legais e tecnicos documentados

- **Descricao:** A arquitetura usa apenas APIs publicas validadas (Gupy, Remotive), nao scraping HTML. Robots.txt e ToS sao respeitados conforme RT-006. Adapters usam rate limiting por fonte. O risco legal e minimo para APIs publicas sem autenticacao.
- **Avaliacao:** Adequado para MVP. O adapter pattern permite trocar fontes sem alterar codigo core. Recomendacao: incluir header `User-Agent` identificando o JobRadar nos requests dos adapters.

### INFO SEC-010 -- LGPD compliance adequada para MVP

- **Descricao:** A arquitetura cobre os requisitos basicos de LGPD:
  - Consentimento explicito no cadastro (`lgpd_consent_at` com timestamp)
  - Exclusao de dados pessoais (`DELETE /users/me`)
  - Exportacao de dados (`GET /users/me/export`)
  - Opt-out de comunicacoes (`alerts_enabled`)
  - Email verification
- **Avaliacao:** Adequado para MVP single-user. Para v2: considerar registro de base legal por finalidade, DPO nomeado, e registro de operacoes de tratamento.

### INFO SEC-011 -- Comunicacao entre servicos

- **Descricao:** Todos os servicos internos (API, Workers, PostgreSQL, Redis) comunicam-se via Docker network privada. Servicos externos (Gupy, Remotive, Resend, Google OAuth) usam HTTPS. A arquitetura nao expoe portas internas desnecessarias (apenas a API via reverse proxy).
- **Avaliacao:** Adequado para MVP com Docker Compose em VPS unica.

### INFO SEC-012 -- Allowlist de URLs para adapters (SSRF prevention)

- **Descricao:** A secao de seguranca menciona "allowlist de URLs para adapters, sem user-input em URLs de fetch". O campo `base_url` no `JobSource` e definido por admin via migration/seed, nao via input de usuario. Workers usam apenas URLs das fontes configuradas.
- **Avaliacao:** Correto. Garantir na implementacao que `base_url` e `config` do JobSource nao aceitem input de usuario final.

---

## Resumo de Findings

| ID | Severidade | Titulo | Bloqueia? |
|----|-----------|--------|-----------|
| SEC-001 | MEDIUM | Admin role via boolean flag sem protecao contra auto-promocao | Nao |
| SEC-002 | MEDIUM | Falta de validacao de ownership (IDOR prevention) | Nao |
| SEC-003 | MEDIUM | JWT stateless sem mecanismo de revogacao | Nao |
| SEC-004 | MEDIUM | Inconsistencia JWT RS256 vs HS256 | Nao |
| SEC-005 | MEDIUM | Rate limiting em login insuficiente contra brute force | Nao |
| SEC-006 | LOW | Redis sem autenticacao | Nao |
| SEC-007 | INFO | Export LGPD -- sem risco real | Nao |
| SEC-008 | LOW | Supply chain sem lockfile | Nao |
| SEC-009 | INFO | Scraping adequado (APIs publicas) | Nao |
| SEC-010 | INFO | LGPD compliance adequada para MVP | Nao |
| SEC-011 | INFO | Comunicacao interna via Docker network | Nao |
| SEC-012 | INFO | SSRF prevention adequada | Nao |

---

## Veredito

**APPROVED**

Zero CRITICALs, zero HIGHs. 5 MEDIUMs identificados com mitigacoes concretas que devem ser implementadas durante o desenvolvimento (gates S2 verificarao).

**Acoes obrigatorias para implementacao (verificadas em S2):**

1. **SEC-001:** Schema `UserUpdate` em PATCH /users/me NAO deve aceitar `is_admin`. Primeiro admin via seed/migration.
2. **SEC-002:** Repositories SEMPRE filtram por `user_id` em operacoes de ownership.
3. **SEC-003:** Implementar blacklist de refresh tokens no Redis (logout + delete account).
4. **SEC-004:** Padronizar JWT como HS256 no ARCHITECTURE.md e garantir SECRET_KEY >= 256 bits.
5. **SEC-005:** Rate limiting especifico para login: 5 tentativas/15min por email, 20/15min por IP.
6. **SEC-008:** Commitar `uv.lock` no repositorio, usar `uv sync --frozen` no Dockerfile.

**Proximo passo:** Architect deve corrigir inconsistencia SEC-004 no ARCHITECTURE.md (HS256 vs RS256). Depois, prosseguir com `/user-stories`.
