import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Building2,
  Heart,
  MapPin,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { fadeUp, stagger } from '../../lib/motion'

const MODALITIES = ['Remoto', 'Hibrido', 'Presencial', 'Freelance']
const SENIORITIES = ['Estagio', 'Junior', 'Pleno', 'Senior', 'Lideranca']

const MOCK_JOBS = [
  {
    id: '1',
    title: 'Senior React Developer',
    company: 'Nubank',
    location: 'Remoto',
    modality: 'Remoto',
    seniority: 'Senior',
    salary: 'R$ 18k-25k',
    description: 'Procuramos um desenvolvedor React senior para atuar no time de frontend, construindo interfaces de alta performance...',
    tags: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    match: 95,
    isNew: true,
    favorited: false,
    publishedAt: '2h atras',
    source: 'Gupy',
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'iFood',
    location: 'Sao Paulo, SP',
    modality: 'Hibrido',
    seniority: 'Pleno',
    salary: 'R$ 15k-22k',
    description: 'Venha fazer parte do maior ecossistema de delivery da America Latina...',
    tags: ['Python', 'FastAPI', 'React', 'AWS'],
    match: 88,
    isNew: true,
    favorited: true,
    publishedAt: '5h atras',
    source: 'Gupy',
  },
  {
    id: '3',
    title: 'Frontend Lead',
    company: 'Spotify',
    location: 'Remoto (Global)',
    modality: 'Remoto',
    seniority: 'Lideranca',
    salary: 'USD 80k-120k',
    description: 'Lead a team of frontend engineers building the next generation of music experience...',
    tags: ['React', 'Design System', 'Leadership', 'A/B Testing'],
    match: 82,
    isNew: false,
    favorited: false,
    publishedAt: '1 dia atras',
    source: 'Remotive',
  },
  {
    id: '4',
    title: 'Software Engineer - Backend',
    company: 'Mercado Livre',
    location: 'Osasco, SP',
    modality: 'Hibrido',
    seniority: 'Pleno',
    salary: 'R$ 16k-24k',
    description: 'Atue no desenvolvimento de microservicos de alta escala no maior marketplace da America Latina...',
    tags: ['Go', 'Microservices', 'AWS', 'Kafka'],
    match: 76,
    isNew: false,
    favorited: false,
    publishedAt: '2 dias atras',
    source: 'Gupy',
  },
  {
    id: '5',
    title: 'DevOps Engineer',
    company: 'PagSeguro',
    location: 'Sao Paulo, SP',
    modality: 'Presencial',
    seniority: 'Senior',
    salary: 'R$ 17k-23k',
    description: 'Buscamos um profissional para fortalecer nossa infraestrutura cloud e pipelines de CI/CD...',
    tags: ['Kubernetes', 'Terraform', 'AWS', 'Python'],
    match: 71,
    isNew: false,
    favorited: false,
    publishedAt: '3 dias atras',
    source: 'Gupy',
  },
  {
    id: '6',
    title: 'Product Designer',
    company: 'Figma',
    location: 'Remoto (Global)',
    modality: 'Remoto',
    seniority: 'Senior',
    salary: 'USD 120k-160k',
    description: 'Design the future of collaborative design tools used by millions of creators worldwide...',
    tags: ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
    match: 65,
    isNew: true,
    favorited: false,
    publishedAt: '6h atras',
    source: 'Remotive',
  },
]

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

export default function Jobs() {
  const [query, setQuery] = useState('')
  const [selectedModalities, setSelectedModalities] = useState<string[]>([])
  const [selectedSeniorities, setSelectedSeniorities] = useState<string[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['2']))

  function toggleFilter(value: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const activeFilters = selectedModalities.length + selectedSeniorities.length
  const filtered = MOCK_JOBS.filter((job) => {
    if (query && !job.title.toLowerCase().includes(query.toLowerCase()) && !job.company.toLowerCase().includes(query.toLowerCase())) return false
    if (selectedModalities.length && !selectedModalities.includes(job.modality)) return false
    if (selectedSeniorities.length && !selectedSeniorities.includes(job.seniority)) return false
    return true
  })

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Buscar Vagas</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {filtered.length} vagas encontradas
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
          className="w-full rounded-xl border border-border bg-white py-3.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink-faint outline-none transition-all focus:border-radar-400 focus:ring-2 focus:ring-radar-400/20 focus:shadow-lg focus:shadow-radar-950/[0.03]"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
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
          <div className="flex gap-1.5">
            {MODALITIES.map((m) => (
              <FilterChip
                key={m}
                label={m}
                active={selectedModalities.includes(m)}
                onClick={() => toggleFilter(m, selectedModalities, setSelectedModalities)}
              />
            ))}
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Senioridade</p>
          <div className="flex gap-1.5">
            {SENIORITIES.map((s) => (
              <FilterChip
                key={s}
                label={s}
                active={selectedSeniorities.includes(s)}
                onClick={() => toggleFilter(s, selectedSeniorities, setSelectedSeniorities)}
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

      {/* Results */}
      <div className="space-y-3">
        {filtered.map((job, i) => (
          <motion.div
            key={job.id}
            variants={fadeUp}
            custom={i + 3}
            className="group relative overflow-hidden rounded-2xl border border-border bg-white p-5 transition-all hover:border-radar-200 hover:shadow-lg hover:shadow-radar-950/[0.03]"
          >
            {/* Match gradient accent */}
            <div
              className="pointer-events-none absolute left-0 top-0 h-full w-1 rounded-l-2xl"
              style={{
                background: `linear-gradient(to bottom, ${
                  job.match >= 90 ? '#0c8eeb' : job.match >= 75 ? '#36a9fa' : '#94a3b8'
                }, transparent)`,
              }}
            />

            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-alt text-ink-muted transition-colors group-hover:bg-radar-50 group-hover:text-radar-600">
                  <Building2 size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-semibold text-ink">{job.title}</h3>
                    {job.isNew && (
                      <span className="rounded-full bg-radar-500 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                        Nova
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-ink-muted">
                    <span className="font-medium">{job.company}</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {job.location}
                    </span>
                    <span className="text-ink-faint">{job.publishedAt}</span>
                  </div>
                  <p className="mt-2.5 line-clamp-1 text-sm text-ink-muted/80">{job.description}</p>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex gap-1.5">
                      {job.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-surface-alt px-2 py-0.5 text-[11px] font-medium text-ink-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-ink-faint">via {job.source}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">{job.salary}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs font-medium text-radar-500">
                    <Sparkles size={10} />
                    {job.match}% match
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => toggleFavorite(job.id)}
                    className={`rounded-lg p-2 transition-all ${
                      favorites.has(job.id)
                        ? 'bg-rose-50 text-rose-500'
                        : 'text-ink-faint hover:bg-surface-alt hover:text-ink-muted'
                    }`}
                  >
                    <Heart size={16} fill={favorites.has(job.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button className="rounded-lg p-2 text-ink-faint transition-all hover:bg-radar-50 hover:text-radar-600">
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <Search size={40} className="mx-auto text-ink-faint" />
          <p className="mt-4 font-display text-lg font-semibold text-ink">Nenhuma vaga encontrada</p>
          <p className="mt-1 text-sm text-ink-muted">Tente ajustar os filtros ou buscar por outros termos.</p>
        </div>
      )}
    </motion.div>
  )
}
