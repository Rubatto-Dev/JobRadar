import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  Building2,
  Calendar,
  Heart,
  MapPin,
  Send,
  X,
} from 'lucide-react'

interface Job {
  id: string
  title: string
  company: string
  location: string | null
  modality: string | null
  seniority: string | null
  salary: string | null
  description: string
  tags: string[]
  url: string
  publishedAt: string | null
  source: string
}

interface JobDrawerProps {
  job: Job | null
  onClose: () => void
  onFavorite?: (id: string) => void
  onApply?: (id: string) => void
  isFavorited?: boolean
}

export default function JobDrawer({ job, onClose, onFavorite, onApply, isFavorited }: JobDrawerProps) {
  return (
    <AnimatePresence>
      {job && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-[151] flex h-full w-full max-w-xl flex-col border-l border-border bg-white shadow-2xl dark:bg-gray-900 dark:border-gray-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
                >
                  <X size={18} />
                </button>
                <span className="text-xs text-ink-faint">Detalhes da vaga</span>
              </div>
              <div className="flex items-center gap-2">
                {onFavorite && (
                  <button
                    onClick={() => onFavorite(job.id)}
                    className={`rounded-lg p-2 transition-all ${
                      isFavorited
                        ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/30'
                        : 'text-ink-faint hover:bg-surface-alt hover:text-ink-muted'
                    }`}
                  >
                    <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                  </button>
                )}
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink-muted"
                >
                  <ArrowUpRight size={18} />
                </a>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Title section */}
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-alt text-ink-muted dark:bg-gray-800">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold text-ink dark:text-gray-100">{job.title}</h2>
                      <p className="text-sm text-ink-muted">{job.company}</p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.location && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-alt px-3 py-1.5 text-xs font-medium text-ink-muted dark:bg-gray-800 dark:text-gray-400">
                        <MapPin size={12} />
                        {job.location}
                      </span>
                    )}
                    {job.modality && (
                      <span className="rounded-lg bg-radar-50 px-3 py-1.5 text-xs font-medium text-radar-700 dark:bg-radar-900/30 dark:text-radar-300">
                        {job.modality}
                      </span>
                    )}
                    {job.seniority && (
                      <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        {job.seniority}
                      </span>
                    )}
                    {job.publishedAt && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-alt px-3 py-1.5 text-xs text-ink-faint dark:bg-gray-800">
                        <Calendar size={12} />
                        {job.publishedAt}
                      </span>
                    )}
                  </div>

                  {/* Salary */}
                  {job.salary && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Faixa salarial</p>
                      <p className="mt-1 font-display text-xl font-bold text-emerald-700 dark:text-emerald-300">
                        {job.salary}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {job.tags.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Tecnologias</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink-muted dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Descricao</h3>
                  <div className="mt-3 prose prose-sm max-w-none text-ink-muted leading-relaxed dark:text-gray-400">
                    <p>{job.description}</p>
                  </div>
                </div>

                {/* Source */}
                <div className="rounded-lg bg-surface-alt p-3 text-center text-xs text-ink-faint dark:bg-gray-800">
                  Vaga coletada via <strong>{job.source}</strong>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="border-t border-border p-4 dark:border-gray-700">
              <div className="flex gap-3">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-radar-600 to-radar-500 py-3 text-sm font-semibold text-white shadow-lg shadow-radar-600/20 transition-all hover:shadow-xl hover:brightness-110"
                >
                  <ArrowUpRight size={16} />
                  Ver na fonte
                </a>
                {onApply && (
                  <button
                    onClick={() => onApply(job.id)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-ink transition-all hover:bg-surface-alt hover:border-border-strong dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <Send size={16} />
                    Registrar candidatura
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
