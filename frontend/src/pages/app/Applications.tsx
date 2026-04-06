import { motion } from 'framer-motion'
import { Building2, Download, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { fadeUp, stagger } from '../../lib/motion'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  applied: { label: 'Aplicado', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  in_progress: { label: 'Em andamento', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  interview: { label: 'Entrevista', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  approved: { label: 'Aprovado', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  rejected: { label: 'Rejeitado', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
}

const MOCK_APPLICATIONS = [
  {
    id: '1',
    title: 'Senior React Developer',
    company: 'Stone',
    status: 'interview',
    appliedAt: '02 Abr 2026',
    notes: 'Entrevista tecnica marcada para 10/04',
    salary: 'R$ 18k-22k',
  },
  {
    id: '2',
    title: 'Frontend Engineer',
    company: 'PicPay',
    status: 'applied',
    appliedAt: '30 Mar 2026',
    notes: null,
    salary: 'R$ 14k-20k',
  },
  {
    id: '3',
    title: 'Tech Lead',
    company: 'Loft',
    status: 'in_progress',
    appliedAt: '25 Mar 2026',
    notes: 'Aguardando retorno do RH',
    salary: 'R$ 22k-30k',
  },
  {
    id: '4',
    title: 'Full Stack Developer',
    company: 'Creditas',
    status: 'approved',
    appliedAt: '15 Mar 2026',
    notes: 'Proposta recebida! Negociando salario.',
    salary: 'R$ 16k-24k',
  },
  {
    id: '5',
    title: 'Senior Developer',
    company: 'VTEX',
    status: 'rejected',
    appliedAt: '10 Mar 2026',
    notes: 'Feedback: perfil bom mas buscam mais experiencia em e-commerce',
    salary: 'R$ 20k-28k',
  },
  {
    id: '6',
    title: 'Backend Engineer',
    company: 'C6 Bank',
    status: 'applied',
    appliedAt: '01 Abr 2026',
    notes: null,
    salary: 'R$ 15k-21k',
  },
]

export default function Applications() {
  const [filter, setFilter] = useState<string | null>(null)
  const filtered = filter ? MOCK_APPLICATIONS.filter((a) => a.status === filter) : MOCK_APPLICATIONS

  const statusCounts = MOCK_APPLICATIONS.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Candidaturas</h1>
          <p className="mt-1 text-sm text-ink-muted">{MOCK_APPLICATIONS.length} candidaturas no total</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink transition-all hover:border-border-strong hover:shadow-sm">
          <Download size={16} />
          Exportar CSV
        </button>
      </motion.div>

      {/* Status tabs */}
      <motion.div variants={fadeUp} custom={1} className="flex gap-2">
        <button
          onClick={() => setFilter(null)}
          className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
            filter === null
              ? 'bg-ink text-white shadow-sm'
              : 'text-ink-muted hover:bg-surface-alt hover:text-ink'
          }`}
        >
          Todas ({MOCK_APPLICATIONS.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? null : key)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
              filter === key
                ? `${config.bg} ${config.color} border shadow-sm`
                : 'text-ink-muted hover:bg-surface-alt hover:text-ink'
            }`}
          >
            {config.label}
            {statusCounts[key] && (
              <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-bold">
                {statusCounts[key]}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Applications list */}
      <div className="space-y-2">
        {filtered.map((app, i) => {
          const statusInfo = STATUS_CONFIG[app.status]
          return (
            <motion.div
              key={app.id}
              variants={fadeUp}
              custom={i + 2}
              className="group rounded-2xl border border-border bg-white p-5 transition-all hover:border-border-strong hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-alt text-ink-muted">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{app.title}</h3>
                    <p className="mt-0.5 text-sm text-ink-muted">{app.company}</p>
                    {app.notes && (
                      <p className="mt-2 rounded-lg bg-surface-alt/70 px-3 py-2 text-xs text-ink-muted italic">
                        {app.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <p className="mt-1.5 text-xs text-ink-faint">{app.appliedAt}</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600">{app.salary}</p>
                  <button className="rounded-lg p-1.5 text-ink-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-alt hover:text-ink-muted">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
