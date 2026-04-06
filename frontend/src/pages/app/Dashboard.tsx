import { motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  Heart,
  MapPin,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeUp, stagger } from '../../lib/motion'

const STATS = [
  { label: 'Vagas novas (24h)', value: '127', change: '+12%', icon: Zap, color: 'text-radar-600 bg-radar-50' },
  { label: 'Favoritas', value: '18', change: '+3', icon: Heart, color: 'text-rose-600 bg-rose-50' },
  { label: 'Candidaturas ativas', value: '7', change: '+2', icon: Briefcase, color: 'text-amber-600 bg-amber-50' },
  { label: 'Entrevistas', value: '3', change: '+1', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
]

const RECOMMENDED = [
  {
    title: 'Senior React Developer',
    company: 'Nubank',
    location: 'Remoto',
    salary: 'R$ 18k-25k',
    tags: ['React', 'TypeScript', 'Node.js'],
    match: 95,
    isNew: true,
  },
  {
    title: 'Full Stack Engineer',
    company: 'iFood',
    location: 'Sao Paulo, SP',
    salary: 'R$ 15k-22k',
    tags: ['Python', 'FastAPI', 'React'],
    match: 88,
    isNew: true,
  },
  {
    title: 'Frontend Lead',
    company: 'Spotify',
    location: 'Remoto (Global)',
    salary: 'USD 80k-120k',
    tags: ['React', 'Design System', 'Leadership'],
    match: 82,
    isNew: false,
  },
  {
    title: 'Software Engineer - Backend',
    company: 'Mercado Livre',
    location: 'Osasco, SP',
    salary: 'R$ 16k-24k',
    tags: ['Go', 'Microservices', 'AWS'],
    match: 76,
    isNew: false,
  },
]

const RECENT_APPLICATIONS = [
  { title: 'React Developer', company: 'Stone', status: 'interview', date: '2 dias atras' },
  { title: 'Frontend Engineer', company: 'PicPay', status: 'applied', date: '4 dias atras' },
  { title: 'Tech Lead', company: 'Loft', status: 'in_progress', date: '1 semana atras' },
  { title: 'Senior Developer', company: 'VTEX', status: 'rejected', date: '2 semanas atras' },
]

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  applied: { label: 'Aplicado', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'Em andamento', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  interview: { label: 'Entrevista', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  approved: { label: 'Aprovado', color: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Rejeitado', color: 'bg-red-50 text-red-600 border-red-200' },
}

function StatCard({ stat, i }: { stat: (typeof STATS)[0]; i: number }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={i}
      className="group relative overflow-hidden rounded-2xl border border-border bg-white p-5 transition-all hover:border-border-strong hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-muted">{stat.label}</p>
          <p className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">{stat.value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${stat.color}`}>
          <stat.icon size={20} />
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-emerald-600">{stat.change} esta semana</p>
    </motion.div>
  )
}

function JobCard({ job, i }: { job: (typeof RECOMMENDED)[0]; i: number }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={i + 4}
      className="group flex items-center justify-between rounded-xl border border-border bg-white p-4 transition-all hover:border-radar-200 hover:shadow-md hover:shadow-radar-950/[0.03] hover:-translate-y-px"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-alt text-ink-muted">
          <Building2 size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-ink">{job.title}</h4>
            {job.isNew && (
              <span className="rounded-full bg-radar-500 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                Nova
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-ink-muted">
            <span>{job.company}</span>
            <span className="flex items-center gap-0.5">
              <MapPin size={10} />
              {job.location}
            </span>
          </div>
          <div className="mt-2 flex gap-1.5">
            {job.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-surface-alt px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-emerald-600">{job.salary}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-radar-600">
            <Sparkles size={10} />
            {job.match}% match
          </div>
        </div>
        <button className="rounded-lg p-2 text-ink-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-alt hover:text-ink">
          <ArrowUpRight size={16} />
        </button>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Bom dia, Guilherme</h1>
        <p className="mt-1 text-sm text-ink-muted">Aqui esta o resumo da sua busca por vagas.</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} i={i + 1} />
        ))}
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-6">
        {/* Recommended jobs */}
        <motion.div variants={fadeUp} custom={4}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Recomendadas para voce</h2>
            <Link
              to="/jobs"
              className="flex items-center gap-1 text-sm font-medium text-radar-600 hover:text-radar-700"
            >
              Ver todas
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {RECOMMENDED.map((job, i) => (
              <JobCard key={job.title} job={job} i={i} />
            ))}
          </div>
        </motion.div>

        {/* Recent applications */}
        <motion.div variants={fadeUp} custom={5}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Candidaturas recentes</h2>
            <Link
              to="/applications"
              className="flex items-center gap-1 text-sm font-medium text-radar-600 hover:text-radar-700"
            >
              Ver todas
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {RECENT_APPLICATIONS.map((app) => {
              const statusInfo = STATUS_MAP[app.status]
              return (
                <div
                  key={app.title}
                  className="rounded-xl border border-border bg-white p-4 transition-all hover:border-border-strong"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-ink">{app.title}</h4>
                      <p className="mt-0.5 text-xs text-ink-muted">{app.company}</p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-ink-faint">{app.date}</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
