import { Radar } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/60 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight text-ink">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-radar-600 text-white">
            <Radar size={18} strokeWidth={2.5} />
          </div>
          JobRadar
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Entrar
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-all hover:bg-ink/90"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </nav>
  )
}
