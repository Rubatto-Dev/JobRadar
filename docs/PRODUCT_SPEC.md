# PRODUCT_SPEC.md -- JobRadar

> **Versao:** 1.0 | **Data:** 2026-04-04 | **Status:** Validado

---

## 1. Visao do Produto

**Problema:** Candidatos a emprego no Brasil gastam em media 2-4 horas por dia visitando multiplas plataformas de vagas (LinkedIn, Catho, InfoJobs, Gupy, Vagas.com, Indeed, SINE). Cada plataforma tem interface, filtros e formatos diferentes. Nao ha centralizacao. Vagas relevantes sao perdidas por falta de visibilidade. O processo e fragmentado, repetitivo e frustrante.

**Situacao atual:** Candidatos acessam 3-7 plataformas manualmente, criam alertas separados em cada uma, nao conseguem acompanhar onde aplicaram, e perdem vagas por nao monitorar todas as fontes em tempo habil.

**Situacao desejada:** Um unico sistema que agrega vagas de multiplas fontes, personaliza resultados com base em preferencias do usuario (modalidade, area, localizacao, senioridade), envia alertas proativos e permite acompanhar candidaturas -- tudo em uma interface unificada.

### Objetivos de Negocio

| ID | Objetivo | Metrica de Sucesso | Prazo |
|----|----------|-------------------|-------|
| OBJ-001 | Reduzir tempo de busca por vagas | Usuarios reportam reducao de 50% no tempo gasto buscando vagas (pesquisa NPS) | 3 meses pos-lancamento |
| OBJ-002 | Agregar vagas de multiplas fontes em interface unica | >= 2 fontes ativas no MVP, >= 5 em v1.1 | MVP: 6 semanas / v1.1: 3 meses |
| OBJ-003 | Engajamento recorrente | >= 40% dos usuarios cadastrados ativos semanalmente | 3 meses pos-lancamento |
| OBJ-004 | Aumentar taxa de aplicacao a vagas | Media de >= 3 vagas favoritadas ou aplicadas por usuario/semana | 2 meses pos-lancamento |

---

## 2. Personas

### Persona: Ana -- Candidata Ativa

- **Perfil:** 28 anos, desenvolvedora frontend junior/pleno, mora em Belo Horizonte-MG. Busca vagas remotas ou hibridas na area de tecnologia. Acessa vagas pelo celular no transporte e pelo computador em casa.
- **Objetivos:** Encontrar vagas compatveis com seu perfil sem precisar visitar 5+ sites. Receber alertas quando surgir algo relevante. Acompanhar onde ja aplicou.
- **Frustracoes atuais:** Perde tempo em sites diferentes com filtros ruins. Esquece onde aplicou. Recebe alertas genericos que nao correspondem ao que busca. Muitas vagas ja estao preenchidas quando encontra.
- **Nivel tecnico:** Intermediario
- **Frequencia de uso:** Diario (durante busca ativa)

### Persona: Carlos -- Profissional em Transicao

- **Perfil:** 35 anos, engenheiro civil buscando transicao para area de dados/automacoes. Mora em Sao Paulo-SP. Aceita presencial ou hibrido na regiao metropolitana.
- **Objetivos:** Descobrir vagas de entrada em areas novas. Filtrar por senioridade (junior/estagio). Comparar requisitos entre vagas similares.
- **Frustracoes atuais:** Plataformas mostram vagas senior quando busca junior. Nao consegue filtrar por "aceita profissionais em transicao". Precisa de visao consolidada.
- **Nivel tecnico:** Iniciante (em tecnologia)
- **Frequencia de uso:** 3-4x por semana

### Persona: Marina -- Admin da Plataforma

- **Perfil:** Operadora do sistema. Responsavel por monitorar fontes de vagas, verificar qualidade dos dados, gerenciar usuarios e acompanhar metricas.
- **Objetivos:** Garantir que as fontes estao ativas e retornando dados. Identificar problemas de scraping. Ver metricas de uso da plataforma.
- **Frustracoes atuais:** N/A (persona de gestao)
- **Nivel tecnico:** Avancado
- **Frequencia de uso:** Diario

---

## 3. Requisitos Funcionais

### Epico 1: Autenticacao e Perfil

| ID | Descricao | Prioridade | Persona | Notas |
|----|-----------|------------|---------|-------|
| RF-001 | O sistema deve permitir cadastro com email e senha, validando formato de email e forca da senha (min 8 chars, 1 maiuscula, 1 numero) | Must | Ana, Carlos | Confirmacao por email obrigatoria |
| RF-002 | O sistema deve permitir login via OAuth 2.0 com Google | Must | Ana, Carlos | Simplifica onboarding |
| RF-003 | O sistema deve permitir recuperacao de senha via email com token expiravel (30 min) | Must | Ana, Carlos | |
| RF-004 | O sistema deve permitir que o usuario edite seu perfil (nome, email, localizacao, foto) | Must | Ana, Carlos | |
| RF-005 | O sistema deve permitir exclusao de conta com remocao completa de dados pessoais (LGPD) | Must | Ana, Carlos | Confirmar com senha antes de excluir |

### Epico 2: Preferencias do Usuario

| ID | Descricao | Prioridade | Persona | Notas |
|----|-----------|------------|---------|-------|
| RF-006 | O sistema deve permitir selecao de modalidade de trabalho: presencial, remoto, home office, hibrido, freelance (multipla selecao) | Must | Ana, Carlos | |
| RF-007 | O sistema deve permitir selecao de area(s) de atuacao a partir de lista predefinida com busca (ex: Desenvolvimento, Automacoes, Nutricao, Engenharia Civil, etc) | Must | Ana, Carlos | Admin gerencia lista de areas |
| RF-008 | O sistema deve permitir selecao de localizacao preferida: cidade, estado ou "qualquer lugar" | Must | Carlos | Relevante para presencial/hibrido |
| RF-009 | O sistema deve permitir selecao de nivel de senioridade: estagio, junior, pleno, senior, especialista, gestao | Must | Carlos | Multipla selecao |
| RF-010 | O sistema deve permitir definicao de faixa salarial desejada (opcional) | Should | Ana | Nem todas as vagas tem salario publicado |
| RF-011 | O sistema deve permitir definicao de palavras-chave extras para refinar busca (ex: "Python", "React", "CLT") | Should | Ana | |

### Epico 3: Agregacao de Vagas

| ID | Descricao | Prioridade | Persona | Notas |
|----|-----------|------------|---------|-------|
| RF-012 | O sistema deve coletar vagas de pelo menos 2 fontes externas no MVP via scraping ou API | Must | Ana, Carlos | Fontes sugeridas: Gupy API, GitHub Jobs, portais publicos |
| RF-013 | O sistema deve normalizar dados de vagas para formato padrao: titulo, empresa, localizacao, modalidade, senioridade, descricao, requisitos, salario (quando disponivel), data de publicacao, URL original | Must | Ana, Carlos | |
| RF-014 | O sistema deve executar coleta de vagas periodicamente (configuravel, padrao: 1-2h para APIs, 3-4h para scraping) | Must | Marina | Worker assincrono; frequencia alta para capturar vagas novas rapidamente |
| RF-015 | O sistema deve deduplicar vagas com base em titulo + empresa + localizacao (similaridade >= 90%) | Must | Ana, Carlos | Evita poluicao dos resultados |
| RF-016 | O sistema deve marcar vagas como expiradas apos 30 dias sem revalidacao da fonte | Should | Ana, Carlos | |
| RF-017 | O sistema deve suportar adicao de novas fontes de vagas sem alteracao de codigo (plugin/adapter pattern) | Should | Marina | Facilita escalabilidade de fontes |

### Epico 4: Busca e Filtros

| ID | Descricao | Prioridade | Persona | Notas |
|----|-----------|------------|---------|-------|
| RF-018 | O sistema deve oferecer busca textual full-text por titulo, empresa e descricao da vaga | Must | Ana, Carlos | |
| RF-019 | O sistema deve oferecer filtros combinaveis: modalidade, area, localizacao, senioridade, faixa salarial, data de publicacao, fonte | Must | Ana, Carlos | |
| RF-020 | O sistema deve ordenar resultados por: relevancia (baseada em preferencias), data de publicacao, salario | Must | Ana | |
| RF-021 | O sistema deve paginar resultados com 20 itens por pagina | Must | Ana, Carlos | |
| RF-022 | O sistema deve salvar buscas recentes do usuario (ultimas 10) | Should | Ana | |
| RF-023 | O sistema deve sugerir vagas com base nas preferencias do usuario no dashboard (feed personalizado) | Should | Ana, Carlos | |

### Epico 5: Favoritos e Candidaturas

| ID | Descricao | Prioridade | Persona | Notas |
|----|-----------|------------|---------|-------|
| RF-024 | O sistema deve permitir favoritar/desfavoritar vagas | Must | Ana, Carlos | |
| RF-025 | O sistema deve permitir registrar candidatura a uma vaga com status: aplicada, em andamento, entrevista, aprovada, rejeitada | Must | Ana | Tracking manual pelo usuario |
| RF-026 | O sistema deve exibir historico de candidaturas com filtro por status e ordenacao por data | Must | Ana | |
| RF-027 | O sistema deve permitir adicionar notas/comentarios a uma candidatura | Should | Ana | Ex: "Entrevista marcada para dia X" |
| RF-028 | O sistema deve permitir exportar lista de candidaturas em CSV | Could | Ana | |

### Epico 6: Alertas e Notificacoes

| ID | Descricao | Prioridade | Persona | Notas |
|----|-----------|------------|---------|-------|
| RF-029 | O sistema deve enviar alertas por email quando novas vagas corresponderem as preferencias do usuario | Must | Ana, Carlos | Frequencia configuravel: imediato, diario, semanal |
| RF-030 | O sistema deve permitir que o usuario configure frequencia de alertas e canais | Must | Ana, Carlos | |
| RF-031 | O sistema deve permitir opt-out total de notificacoes | Must | Ana, Carlos | LGPD: consentimento revogavel |
| RF-032 | O sistema deve suportar notificacoes push via browser (Web Push API) | Should | Ana | Requer service worker |
| RF-033 | O sistema deve enviar resumo semanal com vagas mais relevantes nao visualizadas | Should | Carlos | |

### Epico 7: Dashboard do Usuario

| ID | Descricao | Prioridade | Persona | Notas |
|----|-----------|------------|---------|-------|
| RF-034 | O dashboard deve exibir feed de vagas recomendadas com base nas preferencias | Must | Ana, Carlos | |
| RF-035 | O dashboard deve exibir contadores: vagas novas (24h), favoritas, candidaturas ativas | Must | Ana, Carlos | |
| RF-036 | O dashboard deve exibir grafico de candidaturas por status | Should | Ana | Visao rapida do funil |
| RF-037 | O dashboard deve exibir historico de vagas visualizadas recentemente | Should | Ana | |

### Epico 8: Painel Administrativo

| ID | Descricao | Prioridade | Persona | Notas |
|----|-----------|------------|---------|-------|
| RF-038 | O painel admin deve exibir status de cada fonte de vagas (ativa, erro, ultima coleta, total de vagas) | Must | Marina | |
| RF-039 | O painel admin deve exibir metricas da plataforma: usuarios cadastrados, ativos, vagas totais, vagas novas/dia | Must | Marina | |
| RF-040 | O painel admin deve permitir ativar/desativar fontes de vagas | Must | Marina | |
| RF-041 | O painel admin deve permitir gerenciar lista de areas de atuacao | Should | Marina | CRUD de categorias |
| RF-042 | O painel admin deve permitir visualizar e gerenciar usuarios (listar, desativar, excluir) | Should | Marina | |
| RF-043 | O painel admin deve exibir logs de erro de scraping com detalhes | Should | Marina | |

### Epico 9: API REST

| ID | Descricao | Prioridade | Persona | Notas |
|----|-----------|------------|---------|-------|
| RF-044 | A API deve seguir padrao REST com versionamento (v1/) | Must | -- | |
| RF-045 | A API deve retornar respostas em JSON com paginacao padronizada (offset/limit ou cursor) | Must | -- | |
| RF-046 | A API deve ter documentacao OpenAPI/Swagger auto-gerada | Must | -- | FastAPI gera automaticamente |
| RF-047 | A API deve implementar rate limiting por usuario (100 req/min) e por IP (30 req/min para nao-autenticados) | Must | -- | Protecao contra abuso |

### Fluxos Principais

**Fluxo: Onboarding do Usuario**
Ator: Ana | Pre-condicao: nenhuma conta existente
1. Usuario acessa pagina de cadastro
2. Usuario preenche nome, email e senha OU clica em "Entrar com Google"
3. Sistema valida dados e cria conta
4. Sistema envia email de confirmacao (se cadastro por email)
5. Usuario confirma email
6. Sistema redireciona para tela de configuracao de preferencias
7. Usuario seleciona modalidade(s), area(s), localizacao, senioridade
8. Sistema salva preferencias e redireciona para dashboard com feed personalizado
Pos-condicao: usuario autenticado com preferencias configuradas, feed de vagas visivel

**Fluxo: Busca e Aplicacao a Vaga**
Ator: Ana | Pre-condicao: usuario autenticado com preferencias
1. Usuario acessa busca ou ve feed no dashboard
2. Usuario aplica filtros (modalidade, area, localizacao, senioridade)
3. Sistema retorna vagas ordenadas por relevancia
4. Usuario clica em vaga para ver detalhes completos
5. Usuario decide favoritar OU registrar candidatura
6. Se registrar candidatura: usuario clica em "Aplicar" que abre URL original da vaga em nova aba
7. Sistema registra candidatura com status "aplicada" e data
8. Usuario pode atualizar status da candidatura posteriormente
Pos-condicao: vaga favoritada ou candidatura registrada no historico

**Fluxo: Alerta de Nova Vaga**
Ator: Sistema -> Carlos | Pre-condicao: preferencias configuradas, alertas ativos
1. Worker de coleta encontra novas vagas
2. Sistema normaliza e deduplica vagas
3. Sistema cruza novas vagas com preferencias de cada usuario
4. Para cada match, sistema enfileira notificacao
5. Sistema envia email (ou push) com lista de vagas compativeis
6. Usuario clica no link do email e acessa vaga no JobRadar
Pos-condicao: usuario informado de vagas relevantes sem precisar acessar o sistema

**Fluxo: Monitoramento Admin**
Ator: Marina | Pre-condicao: usuario com role admin
1. Admin acessa painel administrativo
2. Admin ve dashboard com metricas gerais e status das fontes
3. Se fonte com erro: admin ve log de erro detalhado
4. Admin pode desativar fonte problematica
5. Admin pode forcar re-coleta de uma fonte especifica
Pos-condicao: admin informado sobre saude do sistema

---

## 4. Requisitos Nao-Funcionais

| ID | Requisito | Criterio Mensuravel |
|----|-----------|---------------------|
| RNF-001 | Tempo de resposta da API (endpoints de leitura) | <= 500ms no p95 para busca com filtros |
| RNF-002 | Tempo de resposta da API (endpoints de escrita) | <= 300ms no p95 |
| RNF-003 | Usuarios simultaneos | 100 usuarios simultaneos sem degradacao (tempo de resposta < 2x do baseline) |
| RNF-004 | Disponibilidade | 99.5% uptime mensal (maximo 3.6h de downtime/mes) |
| RNF-005 | Tempo de coleta de vagas | Ciclo completo de coleta (todas as fontes) em <= 30 minutos |
| RNF-006 | Volume de vagas | Suportar ate 100.000 vagas ativas no banco sem degradacao de busca |
| RNF-007 | Seguranca: autenticacao | JWT com expiracao de 15 min (access) e 7 dias (refresh) |
| RNF-008 | Seguranca: senhas | Hash com bcrypt, custo >= 12 |
| RNF-009 | Seguranca: HTTPS | TLS 1.2+ obrigatorio em producao |
| RNF-010 | Seguranca: CORS | Origens especificas, nunca wildcard em producao |
| RNF-011 | LGPD: consentimento | Consentimento explicito no cadastro com checkbox, registrado com timestamp |
| RNF-012 | LGPD: exclusao | Dados pessoais removidos em ate 72h apos solicitacao |
| RNF-013 | LGPD: exportacao | Usuario pode exportar seus dados em formato JSON em ate 48h |
| RNF-014 | Responsividade | Interface funcional em viewports >= 320px (mobile-first) |
| RNF-015 | Acessibilidade | WCAG 2.1 nivel AA |
| RNF-016 | SEO | Paginas publicas de vagas com SSR ou pre-rendering para indexacao |
| RNF-017 | Logs | Logs estruturados (JSON) com correlation ID por request |
| RNF-018 | Backup | Backup diario do banco com retencao de 30 dias |

---

## 5. Escopo

### IN -- O que SERA feito

1. Cadastro e autenticacao (email/senha + Google OAuth)
2. Configuracao de preferencias (modalidade, area, localizacao, senioridade)
3. Agregacao de vagas de 2+ fontes externas via scraping/API
4. Normalizacao e deduplicacao de vagas
5. Busca full-text com filtros combinaveis
6. Sistema de favoritos
7. Registro e tracking de candidaturas
8. Alertas por email (configuravel)
9. Dashboard do usuario com feed personalizado e metricas
10. Painel admin com monitoramento de fontes e metricas
11. API REST versionada com documentacao OpenAPI
12. Interface web responsiva (mobile-first)
13. Conformidade LGPD basica (consentimento, exclusao, exportacao)

### OUT -- O que NAO sera feito

| Item | Motivo | Versao futura? |
|------|--------|----------------|
| Lado empresa (publicacao de vagas, painel de recrutador) | Escopo de produto diferente; foco e no candidato | Sim (v3+) |
| Aplicacao direta a vagas pela plataforma | Requer integracao profunda com ATS de cada empresa; complexidade alta | Sim (v2) |
| Matching por IA (compatibilidade vaga-perfil) | Requer volume de dados e ML; prematura no MVP | Sim (v2) |
| Curriculo builder / upload de CV | Feature secundaria; nao resolve o problema central de descoberta | Sim (v2) |
| App mobile nativo (iOS/Android) | Custo e complexidade; PWA cobre necessidade inicial | Sim (v3) |
| Chat entre candidato e recrutador | Requer lado empresa ativo na plataforma | Nao |
| Testes/assessments integrados | Fora do core; existem ferramentas especializadas | Nao |
| Sistema de pagamento/plano premium | Prematura; precisa validar produto antes de monetizar | Sim (v2+) |
| Integracao com LinkedIn API | API restrita e cara; risco legal de scraping | Sim (v2, se viavel) |
| Notificacoes SMS | Custo por mensagem; email e push cobrem necessidade | Nao |

---

## 6. Restricoes e Premissas

| ID | Tipo | Descricao | Motivo |
|----|------|-----------|--------|
| RT-001 | Tecnica | Backend em Python + FastAPI | Padrao do time (CLAUDE.md) |
| RT-002 | Tecnica | Banco de dados PostgreSQL | Padrao do time (CLAUDE.md) |
| RT-003 | Tecnica | Deploy via Docker Compose | Padrao do time (CLAUDE.md) |
| RT-004 | Tecnica | Frontend definido pelo Codex (Bootstrap 5 ou similar) | Padrao do time (CLAUDE.md) |
| RT-005 | Legal | Conformidade com LGPD para dados pessoais | Lei brasileira obrigatoria |
| RT-006 | Legal | Respeitar robots.txt e ToS das fontes de vagas | Risco legal e de bloqueio |
| RT-007 | Operacional | Rate limiting nos scrapers para nao sobrecarregar fontes | Evitar bloqueio de IP |
| P-001 | Premissa | Fontes de vagas terao dados minimamente estruturados (titulo, empresa, localizacao) | Risco se falsa: normalizacao falha, dados inuteis |
| P-002 | Premissa | Volume inicial de usuarios < 1.000 no primeiro mes | Risco se falsa: necessidade de escalar infra prematuramente |
| P-003 | Premissa | Fontes escolhidas para MVP nao bloquearao scraping no curto prazo | Risco se falsa: MVP sem dados; plano B: usar apenas fontes com API |
| P-004 | Premissa | Usuarios tem acesso a email para confirmacao de conta e alertas | Risco se falsa: bloqueio no onboarding |

---

## 7. Riscos

| ID | Descricao | Prob. | Impacto | Mitigacao |
|----|-----------|-------|---------|-----------|
| R-001 | Fontes de vagas bloqueiam scraping (anti-bot, rate limit, mudanca de HTML) | Alta | Alto -- MVP fica sem dados | Priorizar fontes com API publica; implementar adapter pattern para trocar fontes rapidamente; monitorar saude das fontes com alertas |
| R-002 | Vagas duplicadas poluem resultados | Media | Medio -- experiencia ruim para usuario | Algoritmo de deduplicacao por similaridade (titulo+empresa+localizacao); revisao periodica |
| R-003 | Dados desatualizados (vagas ja preenchidas aparecendo como ativas) | Alta | Medio -- frustracao do usuario | Revalidacao periodica; expirar vagas sem revalidacao apos 30 dias; mostrar data de publicacao |
| R-004 | LGPD: vazamento de dados pessoais | Baixa | Alto -- multa ate 2% do faturamento | Criptografia em transito e repouso; acesso minimo; auditoria; sem dados sensiveis em logs |
| R-005 | Performance degradada com volume alto de vagas | Baixa | Medio -- lentidao na busca | Indice full-text no PostgreSQL; paginacao obrigatoria; cache de buscas frequentes |
| R-006 | Mudanca na estrutura HTML das fontes quebra scrapers | Alta | Alto -- coleta para | Testes automatizados de scraping; alertas quando coleta retorna 0 resultados; adapter pattern |
| R-007 | Baixa adesao: usuarios nao retornam apos cadastro | Media | Alto -- produto nao valida | Onboarding guiado; alertas por email como reengajamento; feed personalizado de qualidade |
| R-008 | Escopo creep: demanda por features que fogem do MVP | Media | Medio -- atraso no lancamento | PRODUCT_SPEC como contrato; priorizacao MoSCoW rigida; decisoes documentadas |

---

## 8. Pontos em Aberto

| ID | Questao | Responsavel | Prazo | Impacto se nao resolvido |
|----|---------|-------------|-------|--------------------------|
| PA-001 | Quais fontes de vagas especificas serao usadas no MVP? Precisam ser validadas tecnicamente (disponibilidade de API, viabilidade de scraping) | Architect + Backend | Antes do inicio da implementacao | Bloqueia desenvolvimento do modulo de agregacao |
| PA-002 | Qual provedor de email sera usado para alertas? (SendGrid, SES, Resend, etc.) | Architect | Sprint 1 | Bloqueia feature de alertas |
| PA-003 | Ha necessidade de busca full-text avancada (Elasticsearch/Meilisearch) ou PostgreSQL tsvector e suficiente para o MVP? | Architect | Sprint 1 | Impacta decisao de infra e complexidade |
| PA-004 | Qual sera a estrategia de deploy? (VPS, cloud, serverless) | Architect + DevOps | Antes do deploy | Impacta decisoes de arquitetura |
| ~~PA-005~~ | **Resolvido:** Multi-idioma confirmado (PT-BR primario, EN como segundo idioma). i18n desde o MVP. | Product Owner | Resolvido 2026-04-04 | -- |
| ~~PA-006~~ | **Resolvido:** Frequencia alta de coleta -- objetivo e capturar vagas novas o mais rapido possivel. Sugestao: a cada 1-2h para fontes com API, a cada 3-4h para scraping (respeitar rate limits). Decisao final de intervalo com o Architect. | Product Owner | Resolvido 2026-04-04 | -- |

---

## 9. Glossario

| Termo | Definicao no Contexto do Projeto |
|-------|----------------------------------|
| Vaga | Oportunidade de trabalho coletada de fonte externa, normalizada para formato padrao do JobRadar |
| Fonte | Plataforma externa de onde vagas sao coletadas (ex: Gupy, Indeed, portal publico) |
| Modalidade | Formato de trabalho: presencial, remoto, home office, hibrido ou freelance |
| Area de atuacao | Categoria profissional (ex: Desenvolvimento, Nutricao, Engenharia Civil). Lista gerenciada pelo admin |
| Senioridade | Nivel de experiencia requerido: estagio, junior, pleno, senior, especialista, gestao |
| Agregacao | Processo de coletar vagas de multiplas fontes e unifica-las no sistema |
| Normalizacao | Processo de converter dados heterogeneos de diferentes fontes para o formato padrao do JobRadar |
| Deduplicacao | Processo de identificar e mesclar vagas identicas vindas de fontes diferentes |
| Candidatura | Registro no JobRadar de que o usuario aplicou para uma vaga (tracking manual, nao aplicacao real) |
| Scraping | Coleta automatizada de dados de paginas web (quando API nao esta disponivel) |
| Worker | Processo assincrono que executa coleta de vagas em background, independente das requisicoes HTTP |
| Feed | Lista personalizada de vagas exibida no dashboard, ordenada por relevancia com base nas preferencias do usuario |
| Adapter | Componente que encapsula a logica de coleta de uma fonte especifica, permitindo adicionar/trocar fontes sem alterar codigo core |
| Rate limiting | Controle de frequencia de requisicoes para proteger a API contra abuso e proteger fontes externas contra sobrecarga |
