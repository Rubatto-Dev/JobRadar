import { Radar } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-ink-faint">
        <div className="flex items-center gap-2">
          <Radar size={16} className="text-ink-muted" />
          <span>JobRadar</span>
        </div>
        <p>2026 rubatto-dev. Feito com proposito.</p>
      </div>
    </footer>
  )
}
