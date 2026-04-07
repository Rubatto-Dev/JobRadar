import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  Briefcase,
  Heart,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  User,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface Command {
  id: string
  label: string
  icon: typeof Search
  shortcut?: string
  action: () => void
  group: string
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const commands: Command[] = [
    { id: 'search', label: 'Buscar vagas', icon: Search, group: 'Navegacao', action: () => navigate('/jobs') },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Navegacao', action: () => navigate('/dashboard') },
    { id: 'favorites', label: 'Favoritos', icon: Heart, group: 'Navegacao', action: () => navigate('/favorites') },
    { id: 'applications', label: 'Candidaturas', icon: Briefcase, group: 'Navegacao', action: () => navigate('/applications') },
    { id: 'alerts', label: 'Alertas', icon: Bell, group: 'Navegacao', action: () => navigate('/alerts') },
    { id: 'profile', label: 'Meu perfil', icon: User, group: 'Conta', action: () => navigate('/settings') },
    { id: 'settings', label: 'Configuracoes', icon: Settings, group: 'Conta', action: () => navigate('/settings') },
    {
      id: 'theme',
      label: 'Alternar tema claro/escuro',
      icon: document.documentElement.classList.contains('dark') ? Sun : Moon,
      shortcut: 'T',
      group: 'Aparencia',
      action: () => {
        document.documentElement.classList.toggle('dark')
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
      },
    },
    {
      id: 'logout',
      label: 'Sair da conta',
      icon: LogOut,
      group: 'Conta',
      action: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.group.toLowerCase().includes(query.toLowerCase())
      )
    : commands

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    ;(acc[cmd.group] ||= []).push(cmd)
    return acc
  }, {})

  const execute = useCallback(
    (cmd: Command) => {
      cmd.action()
      setOpen(false)
      setQuery('')
    },
    []
  )

  // Keyboard shortcut to open
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
        setQuery('')
        setSelected(0)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Arrow key navigation
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((prev) => Math.min(prev + 1, filtered.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((prev) => Math.max(prev - 1, 0))
      }
      if (e.key === 'Enter' && filtered[selected]) {
        execute(filtered[selected])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, selected, filtered, execute])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-[201] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl dark:bg-gray-900 dark:border-gray-700"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border px-4 dark:border-gray-700">
              <Search size={18} className="text-ink-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelected(0)
                }}
                placeholder="Buscar comandos, paginas..."
                className="flex-1 bg-transparent py-4 text-sm text-ink outline-none placeholder:text-ink-faint dark:text-gray-100"
              />
              <kbd className="rounded-md border border-border bg-surface-alt px-2 py-0.5 font-mono text-[10px] text-ink-faint dark:border-gray-600 dark:bg-gray-800">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[320px] overflow-y-auto p-2">
              {Object.entries(grouped).map(([group, cmds]) => (
                <div key={group}>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                    {group}
                  </p>
                  {cmds.map((cmd) => {
                    const idx = filtered.indexOf(cmd)
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => execute(cmd)}
                        onMouseEnter={() => setSelected(idx)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          idx === selected
                            ? 'bg-radar-50 text-radar-700 dark:bg-radar-900/30 dark:text-radar-300'
                            : 'text-ink-muted hover:bg-surface-alt dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                      >
                        <cmd.icon size={16} />
                        <span className="flex-1 text-left">{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd className="rounded border border-border bg-surface-alt px-1.5 py-0.5 font-mono text-[10px] text-ink-faint dark:border-gray-600 dark:bg-gray-800">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-ink-faint">Nenhum comando encontrado</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border bg-surface-alt/50 px-4 py-2.5 text-[10px] text-ink-faint dark:border-gray-700 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border px-1 font-mono dark:border-gray-600">↑↓</kbd> navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border px-1 font-mono dark:border-gray-600">↵</kbd> selecionar
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border px-1 font-mono dark:border-gray-600">⌘K</kbd> abrir
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
