import { motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  Heart,
  TrendingUp,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useDashboard } from '../../hooks/useDashboard'
import { DashboardSkeleton } from '../../components/ui/Skeleton'
import { fadeUp, stagger } from '../../lib/motion'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  applied: { label: 'Aplicado', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'Em andamento', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  interview: { label: 'Entrevista', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  approved: { label: 'Aprovado', color: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Rejeitado', color: 'bg-red-50 text-red-600 border-red-200' },
}

interface StatItem {
  label: string
  value: number
  icon: LucideIcon
  color: string
}

function StatCard({ stat, i }: { stat: StatItem; i: number }) {
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
    </motion.div>
  )
}

function JobCard({ job }: { job: { id: string; title: string; company: string } }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group flex items-center justify-between rounded-xl border border-border bg-white p-4 transition-all hover:border-radar-200 hover:shadow-md hover:shadow-radar-950/[0.03] hover:-translate-y-px no-underline"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-alt text-ink-muted">
          <Building2 size={20} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink">{job.title}</h4>
          <p className="mt-0.5 text-xs text-ink-muted">{job.company}</p>
        </div>
      </div>
      <div className="rounded-lg p-2 text-ink-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-alt hover:text-ink">
        <ArrowUpRight size={16} />
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data, loading } = useDashboard()
  const firstName = user?.name?.split(' ')[0] ?? 'Usuario'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  if (loading) return <DashboardSkeleton />

  const stats: StatItem[] = [
    { label: 'Vagas novas (24h)', value: data.new_jobs_24h, icon: Zap, color: 'text-radar-600 bg-radar-50' },
    { label: 'Favoritas', value: data.favorites_count, icon: Heart, color: 'text-rose-600 bg-rose-50' },
    { label: 'Candidaturas ativas', value: data.active_applications, icon: Briefcase, color: 'text-amber-600 bg-amber-50' },
    { label: 'Entrevistas', value: data.applications_by_status['interview'] ?? 0, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
  ]

  const statusEntries = Object.entries(data.applications_by_status)

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{greeting}, {firstName}</h1>
        <p className="mt-1 text-sm text-ink-muted">Aqui esta o resumo da sua busca por vagas.</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} i={i + 1} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
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
            {data.recommended_jobs.length > 0 ? (
              data.recommended_jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              <div className="rounded-xl border border-border bg-white p-8 text-center">
                <p className="text-sm text-ink-muted">Nenhuma recomendacao disponivel no momento.</p>
                <Link
                  to="/jobs"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-radar-600 hover:text-radar-700"
                >
                  Buscar vagas
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Application status summary */}
        <motion.div variants={fadeUp} custom={5}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Status das candidaturas</h2>
            <Link
              to="/applications"
              className="flex items-center gap-1 text-sm font-medium text-radar-600 hover:text-radar-700"
            >
              Ver todas
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {statusEntries.length > 0 ? (
              statusEntries.map(([status, count]) => {
                const statusInfo = STATUS_MAP[status] ?? { label: status, color: 'bg-gray-50 text-gray-700 border-gray-200' }
                return (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded-xl border border-border bg-white p-4 transition-all hover:border-border-strong"
                  >
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                    <span className="font-display text-lg font-bold text-ink">{count}</span>
                  </div>
                )
              })
            ) : (
              <div className="rounded-xl border border-border bg-white p-8 text-center">
                <p className="text-sm text-ink-muted">Nenhuma candidatura registrada.</p>
                <Link
                  to="/jobs"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-radar-600 hover:text-radar-700"
                >
                  Encontrar vagas
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
