# JobRadar -- Briefing do Projeto + Mapa B2C

---

## 1. O que e o JobRadar

Sistema web para busca centralizada de vagas de emprego no Brasil e globalmente. Agrega vagas de multiplas fontes (Gupy, Remotive, e futuramente LinkedIn, Indeed, Glassdoor), personaliza resultados com base em preferencias do usuario e oferece tracking de candidaturas com alertas por email.

**Problema:** Candidatos gastam horas por dia abrindo dezenas de plataformas de vagas. O JobRadar centraliza tudo em um lugar, filtra com base no perfil do usuario e avisa quando surgem vagas relevantes.

**Repo:** https://github.com/Rubatto-Dev/JobRadar
**Landing page:** https://rubatto-dev.github.io/JobRadar/

---

## 2. Stack Tecnica

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy async, Celery |
| Frontend | React 19, Tailwind CSS, Framer Motion |
| Banco | PostgreSQL 16 |
| Cache/Broker | Redis 7 |
| Email | Resend |
| Auth | JWT + Google OAuth |
| Infra | Docker Compose |
| i18n | pt-br / en |

---

## 3. Funcionalidades Implementadas

- Cadastro/login com email e Google OAuth
- Verificacao de email, reset de senha
- Dashboard com metricas do usuario
- Busca full-text de vagas (portugues + ingles)
- Filtros: modalidade, senioridade, localizacao, salario
- Favoritar vagas
- Tracking de candidaturas com status (aplicado, entrevista, aprovado, rejeitado)
- Export CSV de candidaturas
- Alertas de vagas por email (diario)
- Preferencias do usuario (keywords, modalidades, senioridade)
- Coleta automatica de vagas via Celery (a cada 2h)
- Painel admin com metricas e gestao de fontes/usuarios
- Export de dados LGPD
- Dark mode, command palette (Cmd+K), mobile responsive

---

## 4. Arquitetura

```
Frontend (React) --> API (FastAPI) --> PostgreSQL
                                  --> Redis (cache/sessions/rate-limit)

Celery Worker --> Adapters (Gupy, Remotive) --> PostgreSQL
Celery Beat   --> Coleta (2h), Alertas (8h), Manutencao (3h)
```

---

## 5. Publico-alvo

| Segmento | Perfil | Dor principal |
|---|---|---|
| Universitarios/Estagiarios | 18-24 anos, primeiro emprego | Nao sabem onde buscar, perdem vagas por falta de organizacao |
| Juniors/Plenos | 22-32 anos, transicao de carreira | Gastam horas em 10+ plataformas, perdem o controle das candidaturas |
| Seniors/Leads | 28-40 anos, vagas seletivas | Querem vagas filtradas sem ruido, valorizam tempo |
| Freelancers | Qualquer idade, trabalho remoto | Precisam de fluxo constante de oportunidades, multiplas fontes |
| Expats/Remotos globais | Brasileiros buscando fora | Barreiras de idioma, nao conhecem plataformas internacionais |

---

## 6. Modelo de Receita (Freemium)

### Planos

| Feature | Free (R$ 0) | Pro (R$ 29,90/mes) | Enterprise (sob consulta) |
|---|---|---|---|
| Busca centralizada | ilimitado | ilimitado | ilimitado |
| Fontes de vagas | 2 | 10+ | custom |
| Filtros basicos | sim | sim | sim |
| Filtros avancados (salario, stack, beneficios) | -- | sim | sim |
| Favoritos | 20 | ilimitado | ilimitado |
| Tracking de candidaturas | 10 ativas | ilimitado | ilimitado |
| Alertas por email | 1x/semana | diario + instantaneo | real-time + Slack/Teams |
| Historico de buscas | 7 dias | ilimitado | ilimitado |
| Export CSV | -- | sim | sim |
| AI Match Score | basico | avancado (ML) | custom model |
| Analise de salario de mercado | -- | sim | sim |
| Sugestao de palavras-chave para CV | -- | sim | sim |
| Rastreio de status automatico | -- | sim | sim + API |
| Dashboard analytics pessoal | basico | completo | completo + export |
| Multiplos perfis de busca | 1 | 5 | ilimitado |
| Suporte | comunidade | email (48h) | dedicado |

---

## 7. Jornada do Cliente

```
DESCOBERTA       ATIVACAO        ENGAJAMENTO      CONVERSAO       RETENCAO        REFERRAL
    |                |               |                |               |               |
Google/SEO      Cadastro        Busca vagas      Bate limite     Encontra valor  Indica amigos
Redes sociais   gratis          Filtra           do free         no Pro          Compartilha
Indicacao       Importa CV      Favorita         Upgrade         Renova          Link referral
TikTok/Reels    Google OAuth    Candidata        Trial 7d        Alerta util     "Achei via
Comunidades     Pref. iniciais  Recebe alertas   Paga            Dashboard       JobRadar"
```

---

## 8. Canais de Aquisicao

| Canal | Estrategia | CAC estimado |
|---|---|---|
| SEO/Blog | "Melhores vagas remotas 2026", "Como encontrar estagio em TI" | R$ 2-5 |
| TikTok/Reels | Videos curtos: "Encontrei 3 vagas em 2 min", dicas de carreira | R$ 3-8 |
| Comunidades | Discord dev, Telegram vagas, Reddit r/brdev, TabNews | R$ 0-2 |
| Parcerias universidades | Feiras de carreira, nucleos de estagio | R$ 1-3 |
| Referral program | "Indique e ganhe 1 mes Pro gratis" | R$ 5-10 |
| LinkedIn organico | Posts sobre mercado, dados de vagas, tendencias | R$ 0 |
| Google Ads | "vagas remoto brasil", "buscar emprego" | R$ 15-25 |

---

## 9. Metricas-chave

| Metrica | Meta |
|---|---|
| **North Star: Candidaturas enviadas / semana** | 10k |
| MAU (Monthly Active Users) | 100k em 12 meses |
| Free -> Pro conversion | 5-8% |
| Churn mensal Pro | < 5% |
| NPS | > 50 |
| Time to first search | < 60s apos cadastro |
| Alertas abertos (open rate) | > 35% |
| Candidaturas por usuario/mes | > 8 |
| CAC medio | < R$ 10 |
| LTV Pro (12 meses) | R$ 360 |
| LTV/CAC | > 3x |

---

## 10. Projecao de Receita

| Mes | Users Free | Users Pro | MRR | ARR |
|---|---|---|---|---|
| 3 | 5.000 | 100 | R$ 2.990 | R$ 35.880 |
| 6 | 20.000 | 600 | R$ 17.940 | R$ 215.280 |
| 12 | 100.000 | 5.000 | R$ 149.500 | R$ 1.794.000 |
| 18 | 250.000 | 15.000 | R$ 448.500 | R$ 5.382.000 |
| 24 | 500.000 | 30.000 | R$ 897.000 | R$ 10.764.000 |

---

## 11. Fontes de Vagas (Roadmap)

| Fase | Fonte | Vagas estimadas |
|---|---|---|
| MVP (atual) | Gupy, Remotive | 55k+ |
| V2 | LinkedIn Jobs, Indeed, Glassdoor | 800k+ |
| V3 | Catho, Infojobs, Vagas.com.br | 650k+ |
| V4 | Workana, 99freelas, Toptal/Turing | 45k+ |
| V5 | Empresas diretas (API/Webhook) | Custom |

---

## 12. Features Roadmap (pos-MVP)

| Prioridade | Feature | Impacto |
|---|---|---|
| P0 | AI Match Score -- ML que cruza CV/perfil com vaga (score 0-100) | Alto (diferencial) |
| P0 | Import de CV -- extrai skills, experiencia, pretensao | Alto (onboarding) |
| P1 | Rastreio automatico -- monitora emails de resposta | Alto (retencao) |
| P1 | Dashboard de mercado -- salarios por area, tendencias | Medio (SEO + valor) |
| P1 | Notificacoes push + WhatsApp | Medio (engajamento) |
| P2 | Comparador de vagas (side-by-side) | Medio |
| P2 | Networking -- conectar candidatos da mesma area | Medio (retencao) |
| P2 | Prep de entrevista -- perguntas por empresa/vaga | Medio (upsell) |
| P3 | API publica | Baixo (enterprise) |
| P3 | App mobile nativo | Medio (alcance) |

---

## 13. Oportunidades para Data/Analytics

- Dados de vagas agregados de multiplas fontes (titulo, empresa, salario, modalidade, senioridade, localizacao)
- Historico de buscas dos usuarios
- Tracking de candidaturas com status e timeline
- Metricas de match entre preferencias e vagas
- Tendencias do mercado (vagas por area, salarios, modalidades ao longo do tempo)
- Analise de fontes (qual plataforma tem mais vagas, qualidade, taxa de resposta)
- Dados anonimizados para dashboard publico de mercado de trabalho brasileiro
- Modelos preditivos: probabilidade de contratacao baseada em perfil vs vaga
- Analise de sazonalidade de vagas por setor

---

## 14. Custos Operacionais (escala 100k users)

| Item | Custo mensal |
|---|---|
| Infra (VPS/Cloud) | R$ 800-2.000 |
| PostgreSQL managed | R$ 300-600 |
| Redis managed | R$ 200-400 |
| Resend (emails) | R$ 150-500 |
| Dominio + SSL | R$ 30 |
| APIs de vagas (se pagas) | R$ 500-2.000 |
| **Total** | **R$ 2.000-5.500** |

**Margem bruta estimada com 5k Pro users: ~96%**

---

## 15. Concorrentes

| Concorrente | Forca | Fraqueza | Nosso diferencial |
|---|---|---|---|
| LinkedIn | Base enorme, networking | Caro, ruidoso, nao agrega fontes | Centraliza TUDO, sem ruido |
| Catho/Infojobs | Marca conhecida no BR | UI antiga, sem inteligencia | UX moderna, AI match |
| Glassdoor | Reviews de empresas | Poucas vagas BR | Foco Brasil + global |
| Trampos.co | Comunidade dev | So uma fonte | Multi-fonte, tracking |
| Vagas.com.br | Volume BR | Sem filtros inteligentes | Filtros + alertas + analytics |

---

## Como Rodar o Projeto

```bash
git clone https://github.com/Rubatto-Dev/JobRadar.git
cd JobRadar
cp .env.example .env
docker compose up -d postgres redis
cd backend && uv run alembic upgrade head && uv run uvicorn src.main:app --reload --port 8000
cd ../frontend && nvm use 22 && npm install && npm run dev
```

- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

---

*Documento gerado em 07/04/2026 -- JobRadar by rubatto-dev*
