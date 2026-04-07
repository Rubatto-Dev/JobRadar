import { motion } from 'framer-motion'
import { Briefcase, Download, FileText, MoreHorizontal } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { fadeUp, stagger } from '../../lib/motion'
import { api } from '../../services/api'
import type { Application } from '../../services/api'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  applied: { label: 'Aplicado', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  in_progress: { label: 'Em andamento', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  interview: { label: 'Entrevista', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  approved: { label: 'Aprovado', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  rejected: { label: 'Rejeitado', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function truncateId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) + '...' : id
}

function useApplications(filter: string | null) {
  const [applications, setApplications] = useState<Application[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.applications.list(filter ?? undefined, 0, 50)
      setApplications(res.data)
      setTotal(res.pagination.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar candidaturas')
      setApplications([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { applications, total, loading, error, refresh }
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index + 2}
      className="rounded-2xl border border-border bg-white p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-surface-alt" />
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-surface-alt" />
            <div className="h-3 w-24 animate-pulse rounded bg-surface-alt" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="space-y-2 text-right">
            <div className="h-5 w-20 animate-pulse rounded-full bg-surface-alt" />
            <div className="h-3 w-16 animate-pulse rounded bg-surface-alt" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Applications() {
  const [filter, setFilter] = useState<string | null>(null)
  const { applications, total, loading, error, refresh } = useApplications(filter)
  const [exporting, setExporting] = useState(false)

  const statusCounts = applications.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  async function handleExportCsv() {
    setExporting(true)
    try {
      const csv = await api.applications.exportCsv()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `candidaturas-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail -- could add toast later
    } finally {
      setExporting(false)
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Candidaturas</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {loading ? '...' : `${total} candidatura${total !== 1 ? 's' : ''} no total`}
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={exporting || loading}
          className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink transition-all hover:border-border-strong hover:shadow-sm disabled:opacity-50"
          aria-label="Exportar candidaturas em CSV"
        >
          <Download size={16} />
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </motion.div>

      {/* Status tabs */}
      <motion.div variants={fadeUp} custom={1} className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por status">
        <button
          role="tab"
          aria-selected={filter === null}
          onClick={() => setFilter(null)}
          className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
            filter === null
              ? 'bg-ink text-white shadow-sm'
              : 'text-ink-muted hover:bg-surface-alt hover:text-ink'
          }`}
        >
          Todas ({loading ? '...' : total})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <button
            role="tab"
            aria-selected={filter === key}
            key={key}
            onClick={() => setFilter(filter === key ? null : key)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
              filter === key
                ? `${config.bg} ${config.color} border shadow-sm`
                : 'text-ink-muted hover:bg-surface-alt hover:text-ink'
            }`}
          >
            {config.label}
            {statusCounts[key] ? (
              <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-bold">
                {statusCounts[key]}
              </span>
            ) : null}
          </button>
        ))}
      </motion.div>

      {/* Error state */}
      {error && (
        <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={refresh}
            className="mt-3 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-800 transition-colors hover:bg-red-200"
          >
            Tentar novamente
          </button>
        </motion.div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} index={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && applications.length === 0 && (
        <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-border bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-alt text-ink-muted">
            <FileText size={24} />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-ink">Nenhuma candidatura</h3>
          <p className="mt-1 text-sm text-ink-muted">
            {filter
              ? `Nenhuma candidatura com status "${STATUS_CONFIG[filter]?.label ?? filter}"`
              : 'Candidate-se a vagas para acompanhar aqui'}
          </p>
        </motion.div>
      )}

      {/* Applications list */}
      {!loading && !error && applications.length > 0 && (
        <div className="space-y-2" role="list" aria-label="Lista de candidaturas">
          {applications.map((app, i) => {
            const statusInfo = STATUS_CONFIG[app.status] ?? {
              label: app.status,
              color: 'text-gray-700',
              bg: 'bg-gray-50 border-gray-200',
            }
            return (
              <motion.div
                key={app.id}
                variants={fadeUp}
                custom={i + 2}
                className="group rounded-2xl border border-border bg-white p-5 transition-all hover:border-border-strong hover:shadow-sm"
                role="listitem"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-alt text-ink-muted">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-ink">
                        Vaga {truncateId(app.job_id)}
                      </h3>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        ID: {app.job_id}
                      </p>
                      {app.notes && (
                        <p className="mt-2 rounded-lg bg-surface-alt/70 px-3 py-2 text-xs text-ink-muted italic">
                          {app.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo.bg} ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                      <p className="mt-1.5 text-xs text-ink-faint">{formatDate(app.applied_at)}</p>
                    </div>
                    <button
                      className="rounded-lg p-1.5 text-ink-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-alt hover:text-ink-muted"
                      aria-label={`Opcoes para candidatura ${truncateId(app.job_id)}`}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
