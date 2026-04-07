import { motion } from 'framer-motion'
import { Building2, ExternalLink, Heart, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { fadeUp, stagger } from '../../lib/motion'
import { api, type Favorite, type JobDetail } from '../../services/api'

interface FavoriteWithJob {
  favorite: Favorite
  job: JobDetail | null
  loading: boolean
}

function useFavorites() {
  const [items, setItems] = useState<FavoriteWithJob[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.favorites.list(0, 50)
      setTotal(res.pagination.total)

      const initial: FavoriteWithJob[] = res.data.map((f) => ({
        favorite: f,
        job: null,
        loading: true,
      }))
      setItems(initial)
      setLoading(false)

      const jobPromises = res.data.map(async (f) => {
        try {
          const job = await api.jobs.getById(f.job_id)
          return { jobId: f.job_id, job }
        } catch {
          return { jobId: f.job_id, job: null }
        }
      })

      const results = await Promise.all(jobPromises)
      setItems((prev) =>
        prev.map((item) => {
          const result = results.find((r) => r.jobId === item.favorite.job_id)
          return result ? { ...item, job: result.job, loading: false } : { ...item, loading: false }
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar favoritos')
      setItems([])
      setTotal(0)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { items, total, loading, error, setItems, setTotal, refresh }
}

function SkeletonCard({ index }: { index: number }) {
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
            <div className="h-4 w-40 animate-pulse rounded bg-surface-alt" />
            <div className="h-3 w-28 animate-pulse rounded bg-surface-alt" />
            <div className="h-3 w-20 animate-pulse rounded bg-surface-alt" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 animate-pulse rounded-lg bg-surface-alt" />
          <div className="h-8 w-8 animate-pulse rounded-lg bg-surface-alt" />
        </div>
      </div>
    </motion.div>
  )
}

export default function Favorites() {
  const { items, total, loading, error, setItems, setTotal, refresh } = useFavorites()
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  async function handleRemove(jobId: string) {
    setRemovingIds((prev) => new Set(prev).add(jobId))
    try {
      await api.favorites.remove(jobId)
      setItems((prev) => prev.filter((item) => item.favorite.job_id !== jobId))
      setTotal((prev) => prev - 1)
    } catch {
      // keep item in list on failure
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Favoritos</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {loading ? '...' : `${total} vaga${total !== 1 ? 's' : ''} salva${total !== 1 ? 's' : ''}`}
        </p>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={refresh}
            className="mt-3 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-800 transition-colors hover:bg-red-200"
          >
            Tentar novamente
          </button>
        </motion.div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-border bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-alt text-ink-muted">
            <Heart size={24} />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-ink">Nenhuma vaga salva</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Favorite vagas na busca para acompanhar aqui
          </p>
        </motion.div>
      )}

      {/* List */}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-2" role="list" aria-label="Lista de vagas favoritas">
          {items.map((item, i) => {
            const { favorite, job, loading: jobLoading } = item
            const isRemoving = removingIds.has(favorite.job_id)

            return (
              <motion.div
                key={favorite.id}
                variants={fadeUp}
                custom={i + 2}
                className="group rounded-2xl border border-border bg-white p-5 transition-all hover:border-border-strong hover:shadow-sm"
                role="listitem"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-alt text-ink-muted">
                      <Building2 size={20} />
                    </div>
                    <div>
                      {jobLoading ? (
                        <div className="space-y-2">
                          <div className="h-4 w-36 animate-pulse rounded bg-surface-alt" />
                          <div className="h-3 w-24 animate-pulse rounded bg-surface-alt" />
                        </div>
                      ) : job ? (
                        <>
                          <h3 className="text-sm font-semibold text-ink">{job.title}</h3>
                          <p className="mt-0.5 text-xs text-ink-muted">{job.company}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-3">
                            {job.location && (
                              <span className="text-xs text-ink-faint">{job.location}</span>
                            )}
                            {job.salary_text && (
                              <span className="text-xs font-medium text-emerald-700">{job.salary_text}</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-ink-muted">Vaga indisponivel</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {job?.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-ink transition-all hover:border-border-strong hover:shadow-sm"
                        aria-label={`Ver vaga ${job.title} em nova aba`}
                      >
                        <ExternalLink size={14} />
                        Ver vaga
                      </a>
                    )}
                    <button
                      onClick={() => handleRemove(favorite.job_id)}
                      disabled={isRemoving}
                      className="rounded-lg p-2 text-ink-faint transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      aria-label={`Remover ${job?.title ?? 'vaga'} dos favoritos`}
                    >
                      <Trash2 size={16} />
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
