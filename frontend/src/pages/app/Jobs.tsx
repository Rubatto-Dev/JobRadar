import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Building2,
  Heart,
  MapPin,
  Search,
  X,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { fadeUp, stagger } from '../../lib/motion'
import { useJobs } from '../../hooks/useJobs'
import { api } from '../../services/api'

const MODALITIES = [
  { label: 'Presencial', value: 'presencial' },
  { label: 'Remoto', value: 'remoto' },
  { label: 'Home Office', value: 'home_office' },
  { label: 'Hibrido', value: 'hibrido' },
  { label: 'Freelance', value: 'freelance' },
]

const SENIORITIES = [
  { label: 'Estagio', value: 'estagio' },
  { label: 'Junior', value: 'junior' },
  { label: 'Pleno', value: 'pleno' },
  { label: 'Senior', value: 'senior' },
  { label: 'Especialista', value: 'especialista' },
  { label: 'Gestao', value: 'gestao' },
]

function formatRelativeTime(isoDate: string | null): string {
  if (!isoDate) return ''
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diffMs = now - then
  if (diffMs < 0) return ''

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}min atras`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h atras`

  const days = Math.floor(hours / 24)
  if (days === 1) return '1 dia atras'
  if (days < 30) return `${days} dias atras`

  const months = Math.floor(days / 30)
  if (months === 1) return '1 mes atras'
  return `${months} meses atras`
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'bg-radar-600 text-white shadow-sm'
          : 'bg-white border border-border text-ink-muted hover:border-border-strong hover:text-ink'
      }`}
    >
      {label}
    </button>
  )
}

function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-surface-alt" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-2/5 rounded bg-surface-alt" />
          <div className="h-3 w-1/3 rounded bg-surface-alt" />
          <div className="h-3 w-3/4 rounded bg-surface-alt" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 rounded bg-surface-alt" />
          <div className="h-8 w-16 rounded bg-surface-alt" />
        </div>
      </div>
    </div>
  )
}

export default function Jobs() {
  const [query, setQuery] = useState('')
  const [selectedModalities, setSelectedModalities] = useState<string[]>([])
  const [selectedSeniorities, setSelectedSeniorities] = useState<string[]>([])
  const [optimisticFavorites, setOptimisticFavorites] = useState<Record<string, boolean>>({})

  const { jobs, total, loading } = useJobs({
    q: query || undefined,
    modality: selectedModalities.length ? selectedModalities : undefined,
    seniority: selectedSeniorities.length ? selectedSeniorities : undefined,
  })

  function toggleFilter(value: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  const toggleFavorite = useCallback(async (jobId: string, currentlyFavorited: boolean) => {
    const newState = !currentlyFavorited
    setOptimisticFavorites((prev) => ({ ...prev, [jobId]: newState }))
    try {
      if (newState) {
        await api.favorites.add(jobId)
      } else {
        await api.favorites.remove(jobId)
      }
    } catch {
      setOptimisticFavorites((prev) => ({ ...prev, [jobId]: currentlyFavorited }))
    }
  }, [])

  function isFavorited(jobId: string, serverValue: boolean): boolean {
    return jobId in optimisticFavorites ? optimisticFavorites[jobId] : serverValue
  }

  const activeFilters = selectedModalities.length + selectedSeniorities.length

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Buscar Vagas</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {loading ? 'Buscando vagas...' : `${total} vaga${total !== 1 ? 's' : ''} encontrada${total !== 1 ? 's' : ''}`}
          {activeFilters > 0 && ` com ${activeFilters} filtro${activeFilters > 1 ? 's' : ''}`}
        </p>
      </motion.div>

      {/* Search bar */}
      <motion.div variants={fadeUp} custom={1} className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Buscar por titulo, empresa, tecnologia... (ex: "React developer remoto")'
          aria-label="Buscar vagas"
          className="w-full rounded-xl border border-border bg-white py-3.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink-faint outline-none transition-all focus:border-radar-400 focus:ring-2 focus:ring-radar-400/20 focus:shadow-lg focus:shadow-radar-950/[0.03]"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Limpar busca"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-ink-faint hover:text-ink-muted"
          >
            <X size={14} />
          </button>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} custom={2} className="flex flex-wrap items-center gap-6">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Modalidade</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtros de modalidade">
            {MODALITIES.map((m) => (
              <FilterChip
                key={m.value}
                label={m.label}
                active={selectedModalities.includes(m.value)}
                onClick={() => toggleFilter(m.value, selectedModalities, setSelectedModalities)}
              />
            ))}
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Senioridade</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtros de senioridade">
            {SENIORITIES.map((s) => (
              <FilterChip
                key={s.value}
                label={s.label}
                active={selectedSeniorities.includes(s.value)}
                onClick={() => toggleFilter(s.value, selectedSeniorities, setSelectedSeniorities)}
              />
            ))}
          </div>
        </div>
        {activeFilters > 0 && (
          <button
            onClick={() => {
              setSelectedModalities([])
              setSelectedSeniorities([])
            }}
            className="flex items-center gap-1 text-xs font-medium text-radar-600 hover:text-radar-700"
          >
            <X size={12} />
            Limpar filtros
          </button>
        )}
      </motion.div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <motion.div key={i} variants={fadeUp} custom={i + 3}>
              <JobCardSkeleton />
            </motion.div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job, i) => {
            const favorited = isFavorited(job.id, job.is_favorited)
            return (
              <motion.div
                key={job.id}
                variants={fadeUp}
                custom={i + 3}
                className="group relative overflow-hidden rounded-2xl border border-border bg-white p-5 transition-all hover:border-radar-200 hover:shadow-lg hover:shadow-radar-950/[0.03]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-alt text-ink-muted transition-colors group-hover:bg-radar-50 group-hover:text-radar-600">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-ink">{job.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                        <span className="font-medium">{job.company}</span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {job.location}
                          </span>
                        )}
                        {job.modality && (
                          <span className="rounded-md bg-surface-alt px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                            {MODALITIES.find((m) => m.value === job.modality)?.label ?? job.modality}
                          </span>
                        )}
                        {job.seniority && (
                          <span className="rounded-md bg-surface-alt px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                            {SENIORITIES.find((s) => s.value === job.seniority)?.label ?? job.seniority}
                          </span>
                        )}
                        {job.published_at && (
                          <span className="text-ink-faint">{formatRelativeTime(job.published_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {job.salary_text && (
                      <p className="text-sm font-bold text-emerald-600">{job.salary_text}</p>
                    )}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => toggleFavorite(job.id, job.is_favorited)}
                        aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        className={`rounded-lg p-2 transition-all ${
                          favorited
                            ? 'bg-rose-50 text-rose-500'
                            : 'text-ink-faint hover:bg-surface-alt hover:text-ink-muted'
                        }`}
                      >
                        <Heart size={16} fill={favorited ? 'currentColor' : 'none'} />
                      </button>
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Ver detalhes de ${job.title}`}
                        className="rounded-lg p-2 text-ink-faint transition-all hover:bg-radar-50 hover:text-radar-600"
                      >
                        <ArrowUpRight size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && jobs.length === 0 && (
        <div className="py-20 text-center">
          <Search size={40} className="mx-auto text-ink-faint" />
          <p className="mt-4 font-display text-lg font-semibold text-ink">Nenhuma vaga encontrada</p>
          <p className="mt-1 text-sm text-ink-muted">Tente ajustar os filtros ou buscar por outros termos.</p>
        </div>
      )}
    </motion.div>
  )
}
