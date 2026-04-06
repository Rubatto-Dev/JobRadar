import {
  Bell,
  Briefcase,
  Heart,
  LayoutDashboard,
  LogOut,
  Radar,
  Search,
  Settings,
  User,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs', icon: Search, label: 'Buscar Vagas' },
  { to: '/favorites', icon: Heart, label: 'Favoritos' },
  { to: '/applications', icon: Briefcase, label: 'Candidaturas' },
  { to: '/alerts', icon: Bell, label: 'Alertas' },
]

const BOTTOM_ITEMS = [
  { to: '/settings', icon: Settings, label: 'Configuracoes' },
]

export default function AppShell() {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-surface">
      {/* Sidebar */}
      <aside className="flex w-[240px] flex-shrink-0 flex-col border-r border-border bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-radar-600 text-white">
            <Radar size={16} strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">JobRadar</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-radar-50 text-radar-700 border border-radar-200/60'
                    : 'text-ink-muted hover:bg-surface-alt hover:text-ink border border-transparent'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-3 space-y-0.5">
          {BOTTOM_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-surface-alt text-ink'
                    : 'text-ink-muted hover:bg-surface-alt hover:text-ink'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-faint transition-all hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6">
          <div />
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-radar-500" />
            </button>
            <div className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-1.5 transition-all hover:border-border-strong cursor-pointer">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-radar-100 text-radar-700">
                <User size={14} />
              </div>
              <span className="text-sm font-medium text-ink">Guilherme</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
