import type { LucideIcon } from 'lucide-react'
import { Bell, Briefcase, Globe, Search, Target, Zap } from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
  color: string
}

export interface Step {
  step: string
  title: string
  description: string
}

export interface Stat {
  value: string
  label: string
}

export const FEATURES: Feature[] = [
  {
    icon: Search,
    title: 'Busca unificada',
    description:
      'Gupy, Remotive e mais fontes em uma unica busca com filtros avancados por modalidade, senioridade e salario.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Target,
    title: 'Personalizacao',
    description:
      'Configure suas preferencias e receba vagas que realmente combinam com seu perfil e objetivos.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Bell,
    title: 'Alertas inteligentes',
    description:
      'Receba notificacoes por email quando novas vagas compativeis com seu perfil forem encontradas.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Briefcase,
    title: 'Tracking de candidaturas',
    description:
      'Acompanhe o status de cada candidatura: aplicado, entrevista, aprovado. Tudo organizado.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Globe,
    title: 'Brasil e remoto global',
    description:
      'Vagas presenciais no Brasil e oportunidades remotas em empresas do mundo inteiro.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Zap,
    title: 'Rapido e leve',
    description:
      'Interface minimalista, busca instantanea e zero distracao. Foco total em encontrar sua proxima vaga.',
    color: 'bg-cyan-50 text-cyan-600',
  },
]

export const STEPS: Step[] = [
  {
    step: '01',
    title: 'Crie sua conta',
    description: 'Cadastro rapido com email ou Google. Sem cartao de credito.',
  },
  {
    step: '02',
    title: 'Configure preferencias',
    description: 'Defina modalidade, area, senioridade e faixa salarial desejada.',
  },
  {
    step: '03',
    title: 'Receba vagas filtradas',
    description: 'O JobRadar coleta, normaliza e entrega vagas relevantes para voce.',
  },
  {
    step: '04',
    title: 'Acompanhe candidaturas',
    description: 'Favorite vagas, registre candidaturas e monitore o progresso.',
  },
]

export const STATS: Stat[] = [
  { value: '50k+', label: 'Vagas agregadas' },
  { value: '2', label: 'Fontes integradas' },
  { value: '< 2h', label: 'Atualizacao' },
]
