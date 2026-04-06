# USER_STORIES.md -- JobRadar

> **Versao:** 1.0 | **Data:** 2026-04-04 | **Status:** Validado
> **Agente:** User Stories / BDD Expert

---

## Personas

| ID | Nome | Perfil | Uso |
|----|------|--------|-----|
| P1 | Ana | Candidata ativa, 28 anos, dev frontend, BH-MG, busca remoto/hibrido | Diario |
| P2 | Carlos | Profissional em transicao, 35 anos, eng. civil -> dados, SP-SP, presencial/hibrido | 3-4x/semana |
| P3 | Marina | Admin da plataforma, monitora fontes, gerencia usuarios e metricas | Diario |

---

## Epico 1: Autenticacao e Perfil

### US-001 -- Cadastro com email e senha

**Como** Ana (candidata ativa),
**quero** me cadastrar com email e senha,
**para** criar minha conta e comecar a buscar vagas.

- **Prioridade:** Must
- **RFs:** RF-001
- **TASKs:** TASK-003

**Criterios de aceitacao:**

```gherkin
Scenario: Cadastro com dados validos
  Given que Ana esta na pagina de cadastro
  And nao possui conta no sistema
  When preenche nome, email valido e senha com min 8 caracteres, 1 maiuscula e 1 numero
  And aceita o consentimento LGPD
  Then o sistema cria a conta com status email_verified=false
  And envia email de confirmacao
  And retorna id, email, name e mensagem de confirmacao

Scenario: Cadastro com senha fraca
  Given que Ana esta na pagina de cadastro
  When preenche senha com menos de 8 caracteres ou sem maiuscula ou sem numero
  Then o sistema retorna erro 400 com mensagem de validacao

Scenario: Cadastro com email ja existente
  Given que ja existe uma conta com email "ana@email.com"
  When Ana tenta se cadastrar com o mesmo email
  Then o sistema retorna erro 409 indicando email duplicado

Scenario: Cadastro sem consentimento LGPD
  Given que Ana esta na pagina de cadastro
  When preenche todos os campos mas nao aceita o consentimento LGPD
  Then o sistema retorna erro 400 indicando que o consentimento e obrigatorio
```

---

### US-002 -- Login via Google OAuth

**Como** Ana (candidata ativa),
**quero** entrar com minha conta Google,
**para** simplificar o processo de cadastro e login sem criar mais uma senha.

- **Prioridade:** Must
- **RFs:** RF-002
- **TASKs:** TASK-004

**Criterios de aceitacao:**

```gherkin
Scenario: Login com Google para novo usuario
  Given que Ana nao possui conta no sistema
  When autentica via Google OAuth e envia o credential (Google ID token)
  Then o sistema cria uma conta vinculada ao google_id
  And retorna access_token (15min), refresh_token (7d) e dados do usuario

Scenario: Login com Google para usuario existente
  Given que Ana ja possui conta vinculada ao Google
  When autentica via Google OAuth
  Then o sistema retorna access_token e refresh_token sem criar nova conta

Scenario: Login com Google token invalido
  Given que o credential enviado e invalido ou expirado
  When tenta autenticar via Google OAuth
  Then o sistema retorna erro 401
```

---

### US-003 -- Recuperacao de senha

**Como** Carlos (profissional em transicao),
**quero** recuperar minha senha via email,
**para** conseguir acessar minha conta caso esqueca a senha.

- **Prioridade:** Must
- **RFs:** RF-003
- **TASKs:** TASK-003

**Criterios de aceitacao:**

```gherkin
Scenario: Solicitar recuperacao de senha com email valido
  Given que Carlos possui conta com email "carlos@email.com"
  When solicita recuperacao de senha informando o email
  Then o sistema envia email com token de recuperacao (expira em 30 min)
  And retorna mensagem generica "If email exists, reset link was sent"

Scenario: Solicitar recuperacao com email inexistente
  Given que nao existe conta com email "inexistente@email.com"
  When solicita recuperacao de senha informando este email
  Then o sistema retorna a mesma mensagem generica (sem revelar existencia)

Scenario: Resetar senha com token valido
  Given que Carlos recebeu email com token de recuperacao
  And o token ainda nao expirou (dentro de 30 min)
  When envia o token junto com a nova senha valida
  Then o sistema atualiza a senha com hash bcrypt
  And retorna mensagem de sucesso

Scenario: Resetar senha com token expirado
  Given que Carlos recebeu email com token de recuperacao
  And o token expirou (mais de 30 min)
  When envia o token junto com a nova senha
  Then o sistema retorna erro 400 indicando token invalido/expirado
```

---

### US-004 -- Editar perfil

**Como** Ana (candidata ativa),
**quero** editar meu perfil (nome, localizacao, foto, idioma),
**para** manter minhas informacoes atualizadas.

- **Prioridade:** Must
- **RFs:** RF-004
- **TASKs:** TASK-005

**Criterios de aceitacao:**

```gherkin
Scenario: Atualizar nome e localizacao
  Given que Ana esta autenticada
  When envia PATCH /users/me com nome e localizacao novos
  Then o sistema atualiza os campos informados
  And retorna o perfil atualizado

Scenario: Atualizar idioma preferido
  Given que Ana esta autenticada
  When envia PATCH /users/me com locale "en"
  Then o sistema atualiza o idioma para ingles
  And respostas futuras seguem o idioma selecionado

Scenario: Tentar editar sem autenticacao
  Given que o usuario nao esta autenticado
  When tenta acessar PATCH /users/me
  Then o sistema retorna erro 401
```

---

### US-005 -- Exclusao de conta (LGPD)

**Como** Carlos (profissional em transicao),
**quero** excluir minha conta e todos os meus dados pessoais,
**para** exercer meu direito de exclusao garantido pela LGPD.

- **Prioridade:** Must
- **RFs:** RF-005
- **TASKs:** TASK-005

**Criterios de aceitacao:**

```gherkin
Scenario: Excluir conta com senha correta
  Given que Carlos esta autenticado
  When envia DELETE /users/me com a senha correta de confirmacao
  Then o sistema remove todos os dados pessoais (perfil, preferencias, favoritos, candidaturas, historico)
  And retorna status 204

Scenario: Excluir conta com senha incorreta
  Given que Carlos esta autenticado
  When envia DELETE /users/me com senha incorreta
  Then o sistema retorna erro 401
  And nao remove nenhum dado

Scenario: Excluir conta OAuth (sem senha)
  Given que Carlos se cadastrou via Google OAuth e nao tem senha definida
  When envia DELETE /users/me
  Then o sistema deve exigir confirmacao alternativa e remover os dados
```

---

### US-006 -- Confirmacao de email

**Como** Ana (candidata ativa),
**quero** confirmar meu email apos o cadastro,
**para** ativar minha conta e garantir que o email e valido.

- **Prioridade:** Must
- **RFs:** RF-001
- **TASKs:** TASK-003

**Criterios de aceitacao:**

```gherkin
Scenario: Confirmar email com token valido
  Given que Ana se cadastrou e recebeu email de confirmacao com token
  When acessa GET /auth/verify-email?token={token}
  Then o sistema marca email_verified=true
  And retorna mensagem "Email verified"

Scenario: Confirmar email com token invalido
  Given que o token informado nao existe ou ja foi usado
  When acessa GET /auth/verify-email?token={token_invalido}
  Then o sistema retorna erro 400

Scenario: Tentar login sem email verificado
  Given que Ana se cadastrou mas nao confirmou o email
  When tenta fazer login com email e senha corretos
  Then o sistema retorna erro 403 indicando email nao verificado
```

---

### US-007 -- Login com email e senha

**Como** Carlos (profissional em transicao),
**quero** fazer login com meu email e senha,
**para** acessar minha conta e continuar buscando vagas.

- **Prioridade:** Must
- **RFs:** RF-001
- **TASKs:** TASK-003

**Criterios de aceitacao:**

```gherkin
Scenario: Login com credenciais validas
  Given que Carlos possui conta com email verificado
  When envia email e senha corretos
  Then o sistema retorna access_token (15min), refresh_token (7d), token_type e dados do usuario

Scenario: Login com credenciais invalidas
  Given que Carlos possui conta no sistema
  When envia senha incorreta
  Then o sistema retorna erro 401 "Credenciais invalidas"

Scenario: Login com conta desativada
  Given que a conta de Carlos foi desativada pelo admin
  When tenta fazer login
  Then o sistema retorna erro 423 "Conta desativada"

Scenario: Renovar token de acesso
  Given que Carlos possui um refresh_token valido
  When envia POST /auth/refresh com o refresh_token
  Then o sistema retorna novo access_token
```

---

## Epico 2: Preferencias do Usuario

### US-008 -- Selecionar modalidade de trabalho

**Como** Ana (candidata ativa),
**quero** selecionar minhas modalidades de trabalho preferidas (presencial, remoto, home office, hibrido, freelance),
**para** receber apenas vagas compativeis com meu estilo de trabalho.

- **Prioridade:** Must
- **RFs:** RF-006
- **TASKs:** TASK-012

**Criterios de aceitacao:**

```gherkin
Scenario: Selecionar multiplas modalidades
  Given que Ana esta autenticada
  When envia PUT /users/me/preferences com modalities ["remoto", "hibrido"]
  Then o sistema salva as modalidades selecionadas
  And retorna as preferencias atualizadas

Scenario: Selecionar modalidade invalida
  Given que Ana esta autenticada
  When envia PUT /users/me/preferences com modalities ["invalida"]
  Then o sistema retorna erro 400 com validacao

Scenario: Alterar modalidades existentes
  Given que Ana ja tem modalidades ["remoto"] salvas
  When envia PUT /users/me/preferences com modalities ["presencial", "hibrido"]
  Then o sistema substitui as modalidades anteriores pelas novas
```

---

### US-009 -- Selecionar areas de atuacao

**Como** Carlos (profissional em transicao),
**quero** selecionar minhas areas de interesse a partir de uma lista predefinida,
**para** filtrar vagas apenas nas areas que estou considerando para transicao.

- **Prioridade:** Must
- **RFs:** RF-007
- **TASKs:** TASK-012, TASK-013

**Criterios de aceitacao:**

```gherkin
Scenario: Selecionar areas de atuacao validas
  Given que Carlos esta autenticado
  And existem areas ativas "Dados" e "Automacoes" no sistema
  When envia PUT /users/me/preferences com area_ids dos IDs correspondentes
  Then o sistema vincula as areas selecionadas as preferencias

Scenario: Selecionar area inexistente
  Given que Carlos esta autenticado
  When envia PUT /users/me/preferences com area_id de UUID inexistente
  Then o sistema retorna erro 400 indicando area invalida

Scenario: Listar areas disponiveis com busca
  Given que existem areas ativas no sistema
  When acessa GET /areas
  Then o sistema retorna a lista de areas ativas com nome localizado e slug
```

---

### US-010 -- Selecionar localizacao preferida

**Como** Carlos (profissional em transicao),
**quero** definir minha localizacao preferida (cidade, estado ou "qualquer lugar"),
**para** ver apenas vagas acessiveis geograficamente.

- **Prioridade:** Must
- **RFs:** RF-008
- **TASKs:** TASK-012

**Criterios de aceitacao:**

```gherkin
Scenario: Definir localizacao por cidade e estado
  Given que Carlos esta autenticado
  When envia PUT /users/me/preferences com locations ["Sao Paulo-SP"]
  Then o sistema salva a localizacao preferida

Scenario: Definir "qualquer lugar"
  Given que Carlos esta autenticado
  When envia PUT /users/me/preferences com locations ["qualquer"]
  Then o sistema salva indicando sem restricao geografica

Scenario: Definir multiplas localizacoes
  Given que Carlos esta autenticado
  When envia PUT /users/me/preferences com locations ["Sao Paulo-SP", "Campinas-SP"]
  Then o sistema salva todas as localizacoes informadas
```

---

### US-011 -- Selecionar senioridade

**Como** Carlos (profissional em transicao),
**quero** selecionar niveis de senioridade (estagio, junior, pleno, senior, especialista, gestao),
**para** ver vagas compativeis com meu nivel de experiencia na nova area.

- **Prioridade:** Must
- **RFs:** RF-009
- **TASKs:** TASK-012

**Criterios de aceitacao:**

```gherkin
Scenario: Selecionar multiplas senioridades
  Given que Carlos esta autenticado
  When envia PUT /users/me/preferences com seniority_levels ["estagio", "junior"]
  Then o sistema salva os niveis selecionados

Scenario: Selecionar senioridade invalida
  Given que Carlos esta autenticado
  When envia PUT /users/me/preferences com seniority_levels ["invalido"]
  Then o sistema retorna erro 400 com validacao de enum
```

---

### US-012 -- Definir faixa salarial

**Como** Ana (candidata ativa),
**quero** definir uma faixa salarial desejada,
**para** filtrar vagas que estejam dentro do meu interesse financeiro.

- **Prioridade:** Should
- **RFs:** RF-010
- **TASKs:** TASK-012

**Criterios de aceitacao:**

```gherkin
Scenario: Definir faixa salarial
  Given que Ana esta autenticada
  When envia PUT /users/me/preferences com salary_min=500000 e salary_max=1000000 (centavos)
  Then o sistema salva a faixa salarial

Scenario: Deixar faixa salarial em branco
  Given que Ana esta autenticada
  When envia PUT /users/me/preferences com salary_min=null e salary_max=null
  Then o sistema salva sem restricao salarial

Scenario: Definir faixa invertida
  Given que Ana esta autenticada
  When envia PUT /users/me/preferences com salary_min > salary_max
  Then o sistema retorna erro 400 de validacao
```

---

### US-013 -- Definir palavras-chave

**Como** Ana (candidata ativa),
**quero** adicionar palavras-chave extras (ex: "Python", "React", "CLT"),
**para** refinar minha busca e receber vagas mais especificas.

- **Prioridade:** Should
- **RFs:** RF-011
- **TASKs:** TASK-012

**Criterios de aceitacao:**

```gherkin
Scenario: Adicionar palavras-chave
  Given que Ana esta autenticada
  When envia PUT /users/me/preferences com keywords ["Python", "React", "CLT"]
  Then o sistema salva as palavras-chave

Scenario: Preferencias sem palavras-chave
  Given que Ana esta autenticada
  When envia PUT /users/me/preferences com keywords []
  Then o sistema salva sem restricao de palavras-chave
```

---

### US-014 -- Visualizar preferencias salvas

**Como** Ana (candidata ativa),
**quero** visualizar minhas preferencias atuais,
**para** conferir e ajustar minhas configuracoes de busca.

- **Prioridade:** Must
- **RFs:** RF-006, RF-007, RF-008, RF-009
- **TASKs:** TASK-012

**Criterios de aceitacao:**

```gherkin
Scenario: Visualizar preferencias configuradas
  Given que Ana esta autenticada e tem preferencias salvas
  When acessa GET /users/me/preferences
  Then o sistema retorna modalities, areas, locations, seniority_levels, salary, keywords, alert_frequency, alerts_enabled

Scenario: Visualizar preferencias quando nao configuradas
  Given que Ana esta autenticada mas nunca configurou preferencias
  When acessa GET /users/me/preferences
  Then o sistema retorna valores default (listas vazias, alerts_enabled=true, alert_frequency="daily")
```

---

## Epico 3: Agregacao de Vagas

### US-015 -- Coleta automatica de vagas

**Como** Ana (candidata ativa),
**quero** que o sistema colete vagas automaticamente de multiplas fontes,
**para** ter acesso centralizado a vagas sem precisar visitar cada plataforma.

- **Prioridade:** Must
- **RFs:** RF-012, RF-014
- **TASKs:** TASK-006, TASK-007, TASK-008, TASK-010

**Criterios de aceitacao:**

```gherkin
Scenario: Coleta periodica de vagas da Gupy
  Given que a fonte Gupy esta ativa e configurada com intervalo de 2h
  When o scheduler dispara a task de coleta
  Then o worker coleta vagas da API Gupy (portal.api.gupy.io) com paginacao completa
  And normaliza os campos para o formato padrao (RawJob)
  And persiste as vagas novas no banco
  And atualiza last_collected_at na fonte

Scenario: Coleta periodica de vagas do Remotive
  Given que a fonte Remotive esta ativa e configurada com intervalo de 6h
  When o scheduler dispara a task de coleta
  Then o worker coleta vagas da API Remotive (max 4 requests/dia)
  And normaliza os campos e strip HTML da descricao
  And persiste as vagas novas no banco

Scenario: Coleta falha por erro de rede
  Given que a fonte Gupy esta ativa
  When o worker tenta coletar e a API retorna erro de rede
  Then o worker faz ate 3 tentativas com backoff exponencial
  And registra last_error na fonte
  And loga o erro com nivel ERROR
```

---

### US-016 -- Normalizacao de dados de vagas

**Como** Ana (candidata ativa),
**quero** que vagas de diferentes fontes estejam em formato padronizado,
**para** comparar vagas de forma consistente independente da fonte.

- **Prioridade:** Must
- **RFs:** RF-013
- **TASKs:** TASK-009

**Criterios de aceitacao:**

```gherkin
Scenario: Normalizar modalidade de trabalho
  Given que uma vaga da Gupy tem workplaceType "remote"
  When o sistema normaliza a vaga
  Then a modalidade e mapeada para "remoto"
  And variantes como "home office", "trabalho remoto", "remote" sao normalizadas corretamente

Scenario: Normalizar senioridade
  Given que uma vaga tem senioridade "Jr" ou "Junior Developer"
  When o sistema normaliza a vaga
  Then a senioridade e mapeada para "junior"
  And termos em PT e EN sao reconhecidos

Scenario: Normalizar salario de texto
  Given que uma vaga tem salary_text "$20k-$35k"
  When o sistema normaliza o salario
  Then extrai salary_min=2000000 e salary_max=3500000 (centavos)

Scenario: Sanitizar HTML da descricao
  Given que uma vaga tem descricao com tags HTML e scripts
  When o sistema normaliza a vaga
  Then remove scripts e mantem formatacao basica (p, br, ul, li)
```

---

### US-017 -- Deduplicacao de vagas

**Como** Carlos (profissional em transicao),
**quero** que vagas duplicadas de fontes diferentes sejam mescladas,
**para** nao ver a mesma vaga repetida nos resultados.

- **Prioridade:** Must
- **RFs:** RF-015
- **TASKs:** TASK-009

**Criterios de aceitacao:**

```gherkin
Scenario: Deduplicar por fingerprint exato
  Given que ja existe uma vaga com fingerprint SHA256("dev python|empresa x|sao paulo")
  When o worker tenta inserir vaga com mesmo titulo, empresa e localizacao
  Then o sistema identifica duplicata pelo fingerprint
  And ignora a insercao (duplicates_skipped++)

Scenario: Deduplicar por similaridade >= 90%
  Given que ja existe vaga "Desenvolvedor Python" da "Empresa X" em "SP"
  When o worker tenta inserir "Dev Python" da "Empresa X" em "Sao Paulo"
  Then o sistema detecta similaridade >= 90% via pg_trgm
  And ignora a insercao

Scenario: Fingerprint ignora case e acentos
  Given que existe vaga "Desenvolvedor Sênior"
  When o worker tenta inserir "desenvolvedor senior" (sem acento, lowercase)
  Then o sistema gera o mesmo fingerprint
  And identifica como duplicata
```

---

### US-018 -- Expiracao de vagas

**Como** Ana (candidata ativa),
**quero** que vagas desatualizadas sejam marcadas como expiradas,
**para** nao perder tempo com vagas que ja foram preenchidas.

- **Prioridade:** Should
- **RFs:** RF-016
- **TASKs:** TASK-011

**Criterios de aceitacao:**

```gherkin
Scenario: Expirar vagas sem revalidacao apos 30 dias
  Given que existem vagas com updated_at ha mais de 30 dias
  When o worker de manutencao executa diariamente
  Then marca essas vagas como is_active=false
  And retorna contagem de vagas expiradas

Scenario: Manter vagas recentes ativas
  Given que existem vagas com updated_at dentro dos ultimos 30 dias
  When o worker de manutencao executa
  Then nao altera o status dessas vagas
```

---

### US-019 -- Adicao de novas fontes sem alteracao de codigo

**Como** Marina (admin),
**quero** que novas fontes de vagas possam ser adicionadas via adapter pattern,
**para** escalar a cobertura de vagas sem reescrever o sistema.

- **Prioridade:** Should
- **RFs:** RF-017
- **TASKs:** TASK-006

**Criterios de aceitacao:**

```gherkin
Scenario: Nova fonte implementa o protocol
  Given que um novo adapter (ex: JobicyAdapter) implementa JobSourceAdapterProtocol
  And esta registrado no JobSource com adapter_class e base_url
  When o scheduler dispara coleta
  Then o CollectionService carrega o adapter dinamicamente
  And executa coleta normalmente

Scenario: Fonte sem adapter configurado
  Given que uma fonte tem adapter_class que nao existe
  When o scheduler tenta coletar dessa fonte
  Then o sistema loga erro e continua com as demais fontes
```

---

## Epico 4: Busca e Filtros

### US-020 -- Busca full-text de vagas

**Como** Ana (candidata ativa),
**quero** buscar vagas por texto livre (titulo, empresa, descricao),
**para** encontrar vagas especificas rapidamente.

- **Prioridade:** Must
- **RFs:** RF-018
- **TASKs:** TASK-014

**Criterios de aceitacao:**

```gherkin
Scenario: Buscar por termo simples
  Given que existem vagas com "Python" no titulo ou descricao
  When Ana envia GET /jobs?q=python
  Then o sistema retorna vagas relevantes usando tsvector
  And resultados sao ordenados por relevancia

Scenario: Buscar com termo em portugues e ingles
  Given que o search_vector usa dicionarios 'portuguese' e 'english'
  When Ana busca por "desenvolvedor"
  Then o sistema encontra variantes via stemming (desenvolvimento, developer, etc)

Scenario: Buscar sem resultados
  Given que nao existem vagas com o termo "xyzabc123"
  When Ana envia GET /jobs?q=xyzabc123
  Then o sistema retorna lista vazia com total=0
```

---

### US-021 -- Filtros combinaveis

**Como** Carlos (profissional em transicao),
**quero** filtrar vagas por modalidade, area, localizacao, senioridade, faixa salarial, data e fonte,
**para** encontrar apenas vagas que se encaixam no meu perfil.

- **Prioridade:** Must
- **RFs:** RF-019
- **TASKs:** TASK-014

**Criterios de aceitacao:**

```gherkin
Scenario: Filtrar por modalidade
  Given que existem vagas remotas, presenciais e hibridas
  When Carlos envia GET /jobs?modality=remoto&modality=hibrido
  Then o sistema retorna apenas vagas remotas OU hibridas (OR dentro do filtro)

Scenario: Combinar filtros diferentes
  Given que existem vagas no sistema
  When Carlos envia GET /jobs?modality=presencial&seniority=junior&location=Sao Paulo
  Then o sistema retorna vagas que sao presenciais AND junior AND em Sao Paulo (AND entre filtros)

Scenario: Filtrar por faixa salarial
  Given que existem vagas com e sem salario publicado
  When Carlos envia GET /jobs?salary_min=300000&salary_max=800000
  Then o sistema retorna apenas vagas com salario dentro da faixa

Scenario: Filtrar por data de publicacao
  Given que existem vagas publicadas em diferentes datas
  When Carlos envia GET /jobs?published_after=2026-04-01
  Then o sistema retorna apenas vagas publicadas apos a data informada

Scenario: Filtrar por fonte
  Given que existem vagas da Gupy e do Remotive
  When Carlos envia GET /jobs?source=gupy
  Then o sistema retorna apenas vagas da fonte Gupy
```

---

### US-022 -- Ordenacao de resultados

**Como** Ana (candidata ativa),
**quero** ordenar resultados por relevancia, data de publicacao ou salario,
**para** ver primeiro o que mais me interessa.

- **Prioridade:** Must
- **RFs:** RF-020
- **TASKs:** TASK-014

**Criterios de aceitacao:**

```gherkin
Scenario: Ordenar por relevancia (padrao)
  Given que Ana faz busca com texto
  When nao especifica sort
  Then resultados sao ordenados por relevancia do tsvector (rank)

Scenario: Ordenar por data de publicacao
  Given que Ana quer ver vagas mais recentes
  When envia GET /jobs?sort=published_at&order=desc
  Then resultados sao ordenados da mais recente para a mais antiga

Scenario: Ordenar por salario
  Given que Ana quer ver vagas com maior salario
  When envia GET /jobs?sort=salary&order=desc
  Then resultados sao ordenados por salary_max decrescente
```

---

### US-023 -- Paginacao de resultados

**Como** Ana (candidata ativa),
**quero** que os resultados sejam paginados com 20 itens por pagina,
**para** navegar pelos resultados de forma organizada.

- **Prioridade:** Must
- **RFs:** RF-021
- **TASKs:** TASK-015

**Criterios de aceitacao:**

```gherkin
Scenario: Paginacao padrao
  Given que existem 50 vagas nos resultados
  When Ana envia GET /jobs sem offset/limit
  Then retorna os primeiros 20 itens com pagination.total=50

Scenario: Navegar para proxima pagina
  Given que existem 50 vagas nos resultados
  When Ana envia GET /jobs?offset=20&limit=20
  Then retorna itens 21 a 40

Scenario: Limit maximo de 50
  Given que Ana tenta solicitar muitos itens
  When envia GET /jobs?limit=100
  Then o sistema aplica limit=50 (maximo permitido)
```

---

### US-024 -- Historico de buscas recentes

**Como** Ana (candidata ativa),
**quero** ver minhas ultimas 10 buscas realizadas,
**para** repetir buscas anteriores sem digitar novamente.

- **Prioridade:** Should
- **RFs:** RF-022
- **TASKs:** TASK-021

**Criterios de aceitacao:**

```gherkin
Scenario: Salvar busca automaticamente
  Given que Ana esta autenticada
  When realiza uma busca com query "python remoto" e filtros
  Then o sistema salva a busca no historico automaticamente

Scenario: Listar buscas recentes
  Given que Ana tem 15 buscas no historico
  When acessa GET /search-history
  Then o sistema retorna as ultimas 10 buscas ordenadas por data (mais recente primeiro)

Scenario: Limpar historico
  Given que Ana tem buscas no historico
  When envia DELETE /search-history
  Then o sistema remove todo o historico
  And retorna status 204
```

---

### US-025 -- Feed personalizado de vagas recomendadas

**Como** Carlos (profissional em transicao),
**quero** ver vagas recomendadas no dashboard com base nas minhas preferencias,
**para** descobrir vagas relevantes sem precisar buscar ativamente.

- **Prioridade:** Should
- **RFs:** RF-023
- **TASKs:** TASK-014, TASK-020

**Criterios de aceitacao:**

```gherkin
Scenario: Feed baseado nas preferencias
  Given que Carlos tem preferencias definidas (seniority=["junior"], modality=["presencial"], locations=["Sao Paulo-SP"])
  When acessa GET /jobs/recommended
  Then o sistema retorna vagas que correspondem as preferencias
  And ordenadas por relevancia

Scenario: Feed sem preferencias configuradas
  Given que Carlos nao configurou preferencias
  When acessa GET /jobs/recommended
  Then o sistema retorna vagas mais recentes como fallback
```

---

## Epico 5: Favoritos e Candidaturas

### US-026 -- Favoritar vagas

**Como** Ana (candidata ativa),
**quero** favoritar vagas que me interessam,
**para** salvar e acessar facilmente depois.

- **Prioridade:** Must
- **RFs:** RF-024
- **TASKs:** TASK-016

**Criterios de aceitacao:**

```gherkin
Scenario: Favoritar uma vaga
  Given que Ana esta autenticada
  And a vaga com ID existente nao esta nos favoritos
  When envia POST /favorites com job_id
  Then o sistema cria o favorito e retorna status 201

Scenario: Favoritar vaga ja favoritada
  Given que Ana ja favoritou a vaga
  When tenta favoritar novamente
  Then o sistema retorna erro 409

Scenario: Desfavoritar uma vaga
  Given que Ana tem a vaga nos favoritos
  When envia DELETE /favorites/{job_id}
  Then o sistema remove o favorito e retorna status 204

Scenario: Listar favoritos paginados
  Given que Ana tem 25 vagas favoritadas
  When acessa GET /favorites
  Then o sistema retorna os primeiros 20 favoritos com paginacao

Scenario: Favoritar vaga inexistente
  Given que o job_id informado nao existe
  When envia POST /favorites
  Then o sistema retorna erro 404
```

---

### US-027 -- Registrar candidatura

**Como** Ana (candidata ativa),
**quero** registrar que apliquei para uma vaga com status inicial "aplicada",
**para** acompanhar meu processo seletivo.

- **Prioridade:** Must
- **RFs:** RF-025
- **TASKs:** TASK-017

**Criterios de aceitacao:**

```gherkin
Scenario: Registrar candidatura
  Given que Ana esta autenticada
  And nao possui candidatura para esta vaga
  When envia POST /applications com job_id e notes (opcional)
  Then o sistema cria candidatura com status "applied" e data atual
  And retorna status 201

Scenario: Candidatura duplicada
  Given que Ana ja registrou candidatura para esta vaga
  When tenta registrar novamente
  Then o sistema retorna erro 409

Scenario: Candidatura para vaga inexistente
  Given que o job_id informado nao existe
  When envia POST /applications
  Then o sistema retorna erro 404
```

---

### US-028 -- Atualizar status de candidatura

**Como** Ana (candidata ativa),
**quero** atualizar o status da minha candidatura (aplicada, em andamento, entrevista, aprovada, rejeitada),
**para** acompanhar o progresso de cada processo seletivo.

- **Prioridade:** Must
- **RFs:** RF-025
- **TASKs:** TASK-017

**Criterios de aceitacao:**

```gherkin
Scenario: Atualizar status da candidatura
  Given que Ana tem uma candidatura com status "applied"
  When envia PATCH /applications/{id} com status "interview"
  Then o sistema atualiza o status e updated_at
  And retorna a candidatura atualizada

Scenario: Atualizar notas da candidatura
  Given que Ana tem uma candidatura
  When envia PATCH /applications/{id} com notes "Entrevista marcada para 10/04"
  Then o sistema atualiza as notas

Scenario: Atualizar candidatura de outro usuario
  Given que a candidatura pertence a outro usuario
  When Ana tenta atualizar
  Then o sistema retorna erro 404 (nao revela existencia)
```

---

### US-029 -- Historico de candidaturas

**Como** Ana (candidata ativa),
**quero** ver meu historico de candidaturas com filtro por status e ordenacao por data,
**para** ter visao completa do meu progresso.

- **Prioridade:** Must
- **RFs:** RF-026
- **TASKs:** TASK-017

**Criterios de aceitacao:**

```gherkin
Scenario: Listar todas as candidaturas
  Given que Ana tem 15 candidaturas registradas
  When acessa GET /applications
  Then o sistema retorna lista paginada com dados da vaga, status, notas e datas

Scenario: Filtrar por status
  Given que Ana tem candidaturas em diferentes status
  When acessa GET /applications?status=interview
  Then o sistema retorna apenas candidaturas com status "interview"

Scenario: Ordenar por data
  Given que Ana tem candidaturas
  When acessa GET /applications?sort=applied_at&order=desc
  Then retorna candidaturas da mais recente para a mais antiga
```

---

### US-030 -- Adicionar notas a candidatura

**Como** Ana (candidata ativa),
**quero** adicionar notas/comentarios a uma candidatura,
**para** registrar informacoes importantes do processo (ex: data de entrevista).

- **Prioridade:** Should
- **RFs:** RF-027
- **TASKs:** TASK-017

**Criterios de aceitacao:**

```gherkin
Scenario: Adicionar nota na criacao
  Given que Ana esta registrando uma candidatura
  When envia POST /applications com notes "Enviado via site da empresa"
  Then a candidatura e criada com as notas

Scenario: Editar nota existente
  Given que Ana tem uma candidatura com notas
  When envia PATCH /applications/{id} com notes atualizadas
  Then o sistema substitui as notas anteriores
```

---

### US-031 -- Exportar candidaturas em CSV

**Como** Ana (candidata ativa),
**quero** exportar minha lista de candidaturas em CSV,
**para** acompanhar em planilha ou compartilhar com terceiros.

- **Prioridade:** Could
- **RFs:** RF-028
- **TASKs:** TASK-027

**Criterios de aceitacao:**

```gherkin
Scenario: Exportar candidaturas em CSV
  Given que Ana tem candidaturas registradas
  When acessa GET /applications/export
  Then o sistema retorna arquivo CSV com headers: title, company, status, notes, applied_at, url
  And encoding UTF-8 com BOM para compatibilidade com Excel
  And Content-Disposition: attachment

Scenario: Exportar sem candidaturas
  Given que Ana nao tem candidaturas registradas
  When acessa GET /applications/export
  Then o sistema retorna CSV com apenas o header
```

---

## Epico 6: Alertas e Notificacoes

### US-032 -- Alertas por email de novas vagas

**Como** Carlos (profissional em transicao),
**quero** receber alertas por email quando novas vagas corresponderem as minhas preferencias,
**para** ser informado sem precisar acessar o sistema o tempo todo.

- **Prioridade:** Must
- **RFs:** RF-029
- **TASKs:** TASK-018

**Criterios de aceitacao:**

```gherkin
Scenario: Alerta imediato apos coleta
  Given que Carlos tem preferencias configuradas (seniority=["junior"], modality=["presencial"])
  And alert_frequency="immediate"
  When o worker coleta novas vagas que correspondem as preferencias
  Then o sistema envia email via Resend com lista de vagas compativeis
  And registra envio em alert_log

Scenario: Alerta diario
  Given que Carlos tem alert_frequency="daily"
  When o scheduler dispara alerta diario
  Then o sistema agrupa vagas novas das ultimas 24h que correspondem as preferencias
  And envia email unico com todas as vagas

Scenario: Matching por modalidade e senioridade
  Given que Carlos tem preferencias modality=["presencial"] e seniority=["junior"]
  When novas vagas sao coletadas
  Then o sistema cruza modalidade E senioridade
  And envia alerta apenas para vagas que correspondem a AMBOS os criterios

Scenario: Matching por palavras-chave
  Given que Carlos tem keywords=["dados", "automacao"]
  When novas vagas sao coletadas
  Then o sistema filtra vagas que contem pelo menos uma das palavras-chave no titulo ou descricao
```

---

### US-033 -- Configurar frequencia de alertas

**Como** Ana (candidata ativa),
**quero** escolher a frequencia dos meus alertas (imediato, diario, semanal),
**para** receber notificacoes no ritmo que prefiro.

- **Prioridade:** Must
- **RFs:** RF-030
- **TASKs:** TASK-019

**Criterios de aceitacao:**

```gherkin
Scenario: Alterar frequencia de alertas
  Given que Ana esta autenticada
  When envia PUT /alerts/settings com frequency "weekly"
  Then o sistema atualiza a frequencia de alertas

Scenario: Visualizar configuracao de alertas
  Given que Ana esta autenticada
  When acessa GET /alerts/settings
  Then o sistema retorna alerts_enabled, frequency e channels
```

---

### US-034 -- Opt-out de notificacoes

**Como** Carlos (profissional em transicao),
**quero** desativar completamente todas as notificacoes,
**para** exercer meu direito de nao receber comunicacoes (LGPD).

- **Prioridade:** Must
- **RFs:** RF-031
- **TASKs:** TASK-019

**Criterios de aceitacao:**

```gherkin
Scenario: Desativar alertas
  Given que Carlos esta autenticado
  When envia PUT /alerts/settings com alerts_enabled=false
  Then o sistema desativa todas as notificacoes
  And nenhum email e enviado ate reativacao

Scenario: Worker respeita opt-out
  Given que Carlos tem alerts_enabled=false
  When novas vagas correspondem as preferencias de Carlos
  Then o sistema NAO envia alerta para Carlos
  And NAO registra em alert_log
```

---

### US-035 -- Resumo semanal

**Como** Carlos (profissional em transicao),
**quero** receber um resumo semanal com vagas mais relevantes que nao visualizei,
**para** nao perder oportunidades mesmo sem acessar o sistema diariamente.

- **Prioridade:** Should
- **RFs:** RF-033
- **TASKs:** TASK-018

**Criterios de aceitacao:**

```gherkin
Scenario: Enviar resumo semanal
  Given que Carlos tem alertas ativos e frequencia "weekly" ou "daily"
  When o scheduler semanal dispara
  Then o sistema envia email com top vagas relevantes da semana
  And templates em PT-BR ou EN conforme user.locale

Scenario: Nao enviar resumo se nao houver vagas novas
  Given que nao houve vagas novas que correspondem as preferencias de Carlos na semana
  When o scheduler semanal dispara
  Then o sistema NAO envia email para Carlos
```

---

## Epico 7: Dashboard do Usuario

### US-036 -- Feed de vagas recomendadas no dashboard

**Como** Ana (candidata ativa),
**quero** ver vagas recomendadas ao acessar o dashboard,
**para** ter acesso rapido a vagas relevantes sem precisar buscar.

- **Prioridade:** Must
- **RFs:** RF-034
- **TASKs:** TASK-020

**Criterios de aceitacao:**

```gherkin
Scenario: Dashboard com vagas recomendadas
  Given que Ana esta autenticada e tem preferencias configuradas
  When acessa GET /dashboard
  Then o sistema retorna top 5 vagas recomendadas baseadas nas preferencias no campo recent_jobs

Scenario: Dashboard sem preferencias
  Given que Ana esta autenticada mas nao configurou preferencias
  When acessa GET /dashboard
  Then o sistema retorna vagas mais recentes como fallback
```

---

### US-037 -- Contadores do dashboard

**Como** Ana (candidata ativa),
**quero** ver contadores de vagas novas (24h), favoritas e candidaturas ativas,
**para** ter visao rapida do meu estado no sistema.

- **Prioridade:** Must
- **RFs:** RF-035
- **TASKs:** TASK-020

**Criterios de aceitacao:**

```gherkin
Scenario: Contadores do dashboard
  Given que Ana esta autenticada
  And existem 42 vagas novas nas ultimas 24h
  And Ana tem 15 favoritos e 8 candidaturas ativas
  When acessa GET /dashboard
  Then o sistema retorna new_jobs_24h=42, total_favorites=15, active_applications=8

Scenario: Contadores zerados para usuario novo
  Given que Ana acabou de se cadastrar
  When acessa GET /dashboard
  Then o sistema retorna todos os contadores zerados (exceto new_jobs_24h que e global)
```

---

### US-038 -- Grafico de candidaturas por status

**Como** Ana (candidata ativa),
**quero** ver minhas candidaturas agrupadas por status,
**para** entender meu funil de candidaturas.

- **Prioridade:** Should
- **RFs:** RF-036
- **TASKs:** TASK-020

**Criterios de aceitacao:**

```gherkin
Scenario: Candidaturas agrupadas por status
  Given que Ana tem candidaturas em diferentes status
  When acessa GET /dashboard
  Then o sistema retorna applications_by_status com contagem por status
  And inclui: applied, in_progress, interview, approved, rejected
```

---

## Epico 8: Painel Administrativo

### US-039 -- Status das fontes de vagas

**Como** Marina (admin),
**quero** ver o status de cada fonte de vagas (ativa, erro, ultima coleta, total de vagas),
**para** identificar rapidamente problemas na coleta.

- **Prioridade:** Must
- **RFs:** RF-038
- **TASKs:** TASK-022

**Criterios de aceitacao:**

```gherkin
Scenario: Listar status das fontes
  Given que Marina esta autenticada como admin
  When acessa GET /admin/sources
  Then o sistema retorna lista de fontes com name, slug, is_active, last_collected_at, last_error, collection_interval_minutes, total_jobs

Scenario: Fonte com erro
  Given que a ultima coleta da Gupy falhou
  When Marina acessa GET /admin/sources
  Then a fonte Gupy aparece com last_error preenchido

Scenario: Acesso negado para nao-admin
  Given que Ana esta autenticada como usuario normal
  When tenta acessar GET /admin/sources
  Then o sistema retorna erro 403
```

---

### US-040 -- Metricas da plataforma

**Como** Marina (admin),
**quero** ver metricas da plataforma (usuarios, vagas, atividade),
**para** acompanhar a saude e crescimento do sistema.

- **Prioridade:** Must
- **RFs:** RF-039
- **TASKs:** TASK-022

**Criterios de aceitacao:**

```gherkin
Scenario: Visualizar metricas
  Given que Marina esta autenticada como admin
  When acessa GET /admin/metrics
  Then o sistema retorna users (total, active_7d, new_24h), jobs (total_active, new_24h, expired_24h) e status resumido de cada fonte

Scenario: Metricas refletem dados reais
  Given que existem 150 usuarios e 8500 vagas ativas
  When Marina acessa GET /admin/metrics
  Then os numeros correspondem ao estado real do banco
```

---

### US-041 -- Ativar/desativar fontes

**Como** Marina (admin),
**quero** ativar ou desativar fontes de vagas,
**para** controlar quais fontes estao coletando dados.

- **Prioridade:** Must
- **RFs:** RF-040
- **TASKs:** TASK-023

**Criterios de aceitacao:**

```gherkin
Scenario: Desativar fonte
  Given que Marina esta autenticada como admin
  And a fonte Gupy esta ativa
  When envia PATCH /admin/sources/{id} com is_active=false
  Then o sistema desativa a fonte
  And o scheduler nao dispara coleta para fontes desativadas

Scenario: Alterar intervalo de coleta
  Given que Marina esta autenticada como admin
  When envia PATCH /admin/sources/{id} com collection_interval_minutes=360
  Then o sistema atualiza o intervalo de coleta
```

---

### US-042 -- Forcar coleta imediata

**Como** Marina (admin),
**quero** forcar a coleta imediata de uma fonte especifica,
**para** atualizar os dados sem esperar o proximo ciclo agendado.

- **Prioridade:** Must
- **RFs:** RF-038
- **TASKs:** TASK-022

**Criterios de aceitacao:**

```gherkin
Scenario: Forcar coleta de fonte
  Given que Marina esta autenticada como admin
  When envia POST /admin/sources/{id}/collect
  Then o sistema enfileira task de coleta no Celery
  And retorna status 202 com task_id e mensagem "Collection task queued"
```

---

### US-043 -- Gerenciar areas de atuacao

**Como** Marina (admin),
**quero** criar, editar e ativar/desativar areas de atuacao,
**para** manter a lista de categorias atualizada.

- **Prioridade:** Should
- **RFs:** RF-041
- **TASKs:** TASK-013, TASK-023

**Criterios de aceitacao:**

```gherkin
Scenario: Criar nova area
  Given que Marina esta autenticada como admin
  When envia POST /admin/areas com name_pt="Inteligencia Artificial", name_en="Artificial Intelligence"
  Then o sistema cria a area com slug gerado automaticamente
  And retorna status 201

Scenario: Desativar area
  Given que Marina esta autenticada como admin
  When envia PATCH /admin/areas/{id} com is_active=false
  Then a area nao aparece mais em GET /areas

Scenario: Editar area
  Given que Marina esta autenticada como admin
  When envia PATCH /admin/areas/{id} com name_pt atualizado
  Then o sistema atualiza o nome
```

---

### US-044 -- Gerenciar usuarios

**Como** Marina (admin),
**quero** listar, buscar, desativar e excluir usuarios,
**para** gerenciar a base de usuarios da plataforma.

- **Prioridade:** Should
- **RFs:** RF-042
- **TASKs:** TASK-022

**Criterios de aceitacao:**

```gherkin
Scenario: Listar usuarios paginados
  Given que Marina esta autenticada como admin
  When acessa GET /admin/users
  Then o sistema retorna lista paginada de usuarios (sem password_hash)

Scenario: Buscar usuario por email ou nome
  Given que Marina esta autenticada como admin
  When acessa GET /admin/users?search=ana@email
  Then o sistema filtra usuarios pelo termo de busca

Scenario: Desativar usuario
  Given que Marina esta autenticada como admin
  When envia PATCH /admin/users/{id} com is_active=false
  Then o usuario nao consegue mais fazer login (erro 423)

Scenario: Filtrar por status
  Given que Marina esta autenticada como admin
  When acessa GET /admin/users?is_active=false
  Then retorna apenas usuarios desativados
```

---

### US-045 -- Logs de erro de coleta

**Como** Marina (admin),
**quero** ver logs de erro detalhados de cada fonte de vagas,
**para** diagnosticar problemas de scraping/API.

- **Prioridade:** Should
- **RFs:** RF-043
- **TASKs:** TASK-022

**Criterios de aceitacao:**

```gherkin
Scenario: Visualizar logs de erro
  Given que Marina esta autenticada como admin
  And a fonte Gupy teve erros de coleta
  When acessa GET /admin/sources/{id}/logs
  Then o sistema retorna lista de logs com timestamp, level, message e details

Scenario: Fonte sem erros
  Given que a fonte nunca teve erros
  When acessa GET /admin/sources/{id}/logs
  Then o sistema retorna lista vazia
```

---

## Epico 9: API REST

### US-046 -- API versionada REST

**Como** desenvolvedor consumindo a API,
**quero** que a API siga padrao REST com versionamento /api/v1/,
**para** garantir estabilidade e compatibilidade futura.

- **Prioridade:** Must
- **RFs:** RF-044
- **TASKs:** TASK-001

**Criterios de aceitacao:**

```gherkin
Scenario: Todos os endpoints sob /api/v1
  Given que a API esta rodando
  When acesso qualquer endpoint documentado
  Then a URL segue o padrao /api/v1/{recurso}

Scenario: Resposta padrao JSON
  Given que a API esta rodando
  When faco uma requisicao a qualquer endpoint
  Then a resposta e em formato JSON com Content-Type application/json
```

---

### US-047 -- Paginacao padronizada

**Como** desenvolvedor consumindo a API,
**quero** que endpoints de listagem usem paginacao padronizada com offset/limit,
**para** consumir dados de forma previsivel.

- **Prioridade:** Must
- **RFs:** RF-045
- **TASKs:** TASK-015

**Criterios de aceitacao:**

```gherkin
Scenario: Resposta paginada
  Given que um endpoint de listagem retorna mais de 20 itens
  When faco uma requisicao com offset e limit
  Then a resposta inclui data (array), pagination.offset, pagination.limit e pagination.total

Scenario: Limite maximo
  Given que envio limit=100
  When o sistema processa a requisicao
  Then aplica limit=50 (maximo)
```

---

### US-048 -- Documentacao OpenAPI auto-gerada

**Como** desenvolvedor consumindo a API,
**quero** documentacao OpenAPI/Swagger auto-gerada,
**para** explorar e testar endpoints sem documentacao manual.

- **Prioridade:** Must
- **RFs:** RF-046
- **TASKs:** TASK-001

**Criterios de aceitacao:**

```gherkin
Scenario: Swagger UI acessivel
  Given que a API esta rodando
  When acesso /docs
  Then a documentacao Swagger UI e exibida com todos os endpoints

Scenario: OpenAPI JSON acessivel
  Given que a API esta rodando
  When acesso /openapi.json
  Then retorna o schema OpenAPI completo em JSON
```

---

### US-049 -- Rate limiting

**Como** Marina (admin),
**quero** que a API tenha rate limiting por usuario e por IP,
**para** proteger o sistema contra abuso e sobrecarga.

- **Prioridade:** Must
- **RFs:** RF-047
- **TASKs:** TASK-024

**Criterios de aceitacao:**

```gherkin
Scenario: Requisicoes dentro do limite (autenticado)
  Given que Ana esta autenticada
  And fez menos de 100 requisicoes no ultimo minuto
  When faz mais uma requisicao
  Then a requisicao e processada normalmente
  And headers X-RateLimit-Limit e X-RateLimit-Remaining sao retornados

Scenario: Requisicoes acima do limite (autenticado)
  Given que Ana esta autenticada
  And fez 100 requisicoes no ultimo minuto
  When faz mais uma requisicao
  Then o sistema retorna erro 429 com Retry-After

Scenario: Requisicoes acima do limite (nao autenticado)
  Given que um IP nao autenticado fez 30 requisicoes no ultimo minuto
  When faz mais uma requisicao
  Then o sistema retorna erro 429 com Retry-After e detail "Rate limit exceeded"
```

---

### US-050 -- i18n do backend

**Como** Carlos (profissional em transicao),
**quero** receber mensagens de erro e respostas no meu idioma preferido,
**para** entender melhor as informacoes do sistema.

- **Prioridade:** Must
- **RFs:** (suporte transversal)
- **TASKs:** TASK-025

**Criterios de aceitacao:**

```gherkin
Scenario: Mensagens em PT-BR por padrao
  Given que Carlos nao especificou idioma
  When faz uma requisicao que retorna erro
  Then a mensagem de erro esta em PT-BR

Scenario: Mensagens em EN via header
  Given que Carlos envia header Accept-Language: en
  When faz uma requisicao que retorna erro
  Then a mensagem de erro esta em EN

Scenario: Idioma do usuario autenticado
  Given que Carlos esta autenticado com locale="en"
  And nao envia header Accept-Language
  When faz uma requisicao
  Then o sistema usa o locale do perfil do usuario
```

---

## LGPD (transversal)

### US-051 -- Exportacao de dados pessoais (LGPD)

**Como** Ana (candidata ativa),
**quero** exportar todos os meus dados pessoais em JSON,
**para** exercer meu direito de portabilidade garantido pela LGPD.

- **Prioridade:** Must
- **RFs:** RF-005 (LGPD), RNF-013
- **TASKs:** TASK-026

**Criterios de aceitacao:**

```gherkin
Scenario: Exportar dados completos
  Given que Ana esta autenticada
  When acessa GET /users/me/export
  Then o sistema retorna JSON com perfil, preferencias, favoritos, candidaturas e historico de buscas
  And NAO inclui dados internos (password_hash, IDs de sistema)

Scenario: Exportar sem dados adicionais
  Given que Ana acabou de se cadastrar e nao tem favoritos, candidaturas ou historico
  When acessa GET /users/me/export
  Then o sistema retorna JSON com perfil e listas vazias
```

---

### US-052 -- Consentimento LGPD no cadastro

**Como** Carlos (profissional em transicao),
**quero** que o sistema registre meu consentimento explicito no cadastro,
**para** estar em conformidade com a LGPD.

- **Prioridade:** Must
- **RFs:** RNF-011
- **TASKs:** TASK-003

**Criterios de aceitacao:**

```gherkin
Scenario: Registrar consentimento no cadastro
  Given que Carlos esta se cadastrando
  When aceita o checkbox de consentimento LGPD
  Then o sistema registra lgpd_consent_at com timestamp atual

Scenario: Rejeitar cadastro sem consentimento
  Given que Carlos esta se cadastrando
  When NAO aceita o checkbox de consentimento
  Then o sistema retorna erro 400 e nao cria a conta
```

---

## Mapeamento RF -> User Story

| RF | User Story(s) | Prioridade |
|----|---------------|------------|
| RF-001 | US-001, US-006, US-007 | Must |
| RF-002 | US-002 | Must |
| RF-003 | US-003 | Must |
| RF-004 | US-004 | Must |
| RF-005 | US-005, US-051 | Must |
| RF-006 | US-008, US-014 | Must |
| RF-007 | US-009, US-014 | Must |
| RF-008 | US-010, US-014 | Must |
| RF-009 | US-011, US-014 | Must |
| RF-010 | US-012 | Should |
| RF-011 | US-013 | Should |
| RF-012 | US-015 | Must |
| RF-013 | US-016 | Must |
| RF-014 | US-015 | Must |
| RF-015 | US-017 | Must |
| RF-016 | US-018 | Should |
| RF-017 | US-019 | Should |
| RF-018 | US-020 | Must |
| RF-019 | US-021 | Must |
| RF-020 | US-022 | Must |
| RF-021 | US-023 | Must |
| RF-022 | US-024 | Should |
| RF-023 | US-025 | Should |
| RF-024 | US-026 | Must |
| RF-025 | US-027, US-028 | Must |
| RF-026 | US-029 | Must |
| RF-027 | US-030 | Should |
| RF-028 | US-031 | Could |
| RF-029 | US-032 | Must |
| RF-030 | US-033 | Must |
| RF-031 | US-034 | Must |
| RF-032 | -- (Web Push: fora do MVP) | Should |
| RF-033 | US-035 | Should |
| RF-034 | US-036 | Must |
| RF-035 | US-037 | Must |
| RF-036 | US-038 | Should |
| RF-037 | -- (historico de visualizacoes: coberto parcialmente por US-024) | Should |
| RF-038 | US-039, US-042 | Must |
| RF-039 | US-040 | Must |
| RF-040 | US-041 | Must |
| RF-041 | US-043 | Should |
| RF-042 | US-044 | Should |
| RF-043 | US-045 | Should |
| RF-044 | US-046 | Must |
| RF-045 | US-047 | Must |
| RF-046 | US-048 | Must |
| RF-047 | US-049 | Must |
| RNF-011 | US-052 | Must |
| RNF-013 | US-051 | Must |

---

## Mapeamento User Story -> TASK

| User Story | TASK(s) |
|------------|---------|
| US-001 | TASK-003 |
| US-002 | TASK-004 |
| US-003 | TASK-003 |
| US-004 | TASK-005 |
| US-005 | TASK-005 |
| US-006 | TASK-003 |
| US-007 | TASK-003 |
| US-008 | TASK-012 |
| US-009 | TASK-012, TASK-013 |
| US-010 | TASK-012 |
| US-011 | TASK-012 |
| US-012 | TASK-012 |
| US-013 | TASK-012 |
| US-014 | TASK-012 |
| US-015 | TASK-006, TASK-007, TASK-008, TASK-010 |
| US-016 | TASK-009 |
| US-017 | TASK-009 |
| US-018 | TASK-011 |
| US-019 | TASK-006 |
| US-020 | TASK-014 |
| US-021 | TASK-014 |
| US-022 | TASK-014 |
| US-023 | TASK-015 |
| US-024 | TASK-021 |
| US-025 | TASK-014, TASK-020 |
| US-026 | TASK-016 |
| US-027 | TASK-017 |
| US-028 | TASK-017 |
| US-029 | TASK-017 |
| US-030 | TASK-017 |
| US-031 | TASK-027 |
| US-032 | TASK-018 |
| US-033 | TASK-019 |
| US-034 | TASK-019 |
| US-035 | TASK-018 |
| US-036 | TASK-020 |
| US-037 | TASK-020 |
| US-038 | TASK-020 |
| US-039 | TASK-022 |
| US-040 | TASK-022 |
| US-041 | TASK-023 |
| US-042 | TASK-022 |
| US-043 | TASK-013, TASK-023 |
| US-044 | TASK-022 |
| US-045 | TASK-022 |
| US-046 | TASK-001 |
| US-047 | TASK-015 |
| US-048 | TASK-001 |
| US-049 | TASK-024 |
| US-050 | TASK-025 |
| US-051 | TASK-026 |
| US-052 | TASK-003 |

---

## Priorizacao MoSCoW

### Must Have (34 stories)
US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008, US-009, US-010, US-011, US-014, US-015, US-016, US-017, US-020, US-021, US-022, US-023, US-026, US-027, US-028, US-029, US-032, US-033, US-034, US-036, US-037, US-039, US-040, US-041, US-046, US-047, US-048, US-049, US-050, US-051, US-052

### Should Have (14 stories)
US-012, US-013, US-018, US-019, US-024, US-025, US-030, US-035, US-038, US-043, US-044, US-045

### Could Have (1 story)
US-031

### Won't Have (MVP)
- Web Push notifications (RF-032)
- Historico de vagas visualizadas como feature dedicada (RF-037)

---

## Definition of Done

Uma user story e considerada DONE quando:

1. Todos os cenarios BDD (Given/When/Then) passam como testes automatizados
2. Testes unitarios cobrem happy path + cenarios de erro
3. Code review aprovado (/review)
4. Security review S2 aprovado para a SPEC correspondente
5. API documentada via OpenAPI (auto-gerado pelo FastAPI)
6. Mensagens de erro traduzidas (PT-BR + EN)
7. Sem secrets hardcoded, sem SQL por concatenacao, sem print()
