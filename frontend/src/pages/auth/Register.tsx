import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../../services/api'
import { fadeUp, stagger } from '../../lib/motion'

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(
    () => [
      { label: 'Minimo 8 caracteres', ok: password.length >= 8 },
      { label: 'Uma letra maiuscula', ok: /[A-Z]/.test(password) },
      { label: 'Um numero', ok: /\d/.test(password) },
    ],
    [password]
  )

  const strength = checks.filter((c) => c.ok).length

  if (!password) return null

  return (
    <div className="mt-2.5 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength
                ? strength === 3
                  ? 'bg-emerald-500'
                  : strength === 2
                    ? 'bg-amber-400'
                    : 'bg-red-400'
                : 'bg-border'
            }`}
          />
        ))}
      </div>
      <div className="space-y-0.5">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1.5 text-xs">
            <Check
              size={12}
              className={`transition-colors ${check.ok ? 'text-emerald-500' : 'text-ink-faint'}`}
            />
            <span className={check.ok ? 'text-ink-muted' : 'text-ink-faint'}>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [lgpdConsent, setLgpdConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValid = name.length >= 3 && email.includes('@') && password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password) && lgpdConsent

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.auth.register({ name, email, password, lgpd_consent: lgpdConsent })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger}>
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Crie sua conta</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Comece a encontrar vagas que combinam com voce. Gratis.
        </p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      <motion.form variants={fadeUp} custom={1} onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink">
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-all focus:border-radar-400 focus:ring-2 focus:ring-radar-400/20"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-all focus:border-radar-400 focus:ring-2 focus:ring-radar-400/20"
          />
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-ink">
            Senha
          </label>
          <div className="relative mt-1.5">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha forte"
              className="w-full rounded-xl border border-border bg-white px-4 py-3 pr-11 text-sm text-ink placeholder:text-ink-faint outline-none transition-all focus:border-radar-400 focus:ring-2 focus:ring-radar-400/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={lgpdConsent}
              onChange={(e) => setLgpdConsent(e.target.checked)}
              className="peer sr-only"
            />
            <div className="h-5 w-5 rounded-md border border-border bg-white transition-all peer-checked:border-radar-500 peer-checked:bg-radar-500 group-hover:border-border-strong">
              {lgpdConsent && <Check size={14} className="absolute inset-0 m-auto text-white" />}
            </div>
          </div>
          <span className="text-xs leading-relaxed text-ink-muted">
            Concordo com o tratamento dos meus dados pessoais conforme a{' '}
            <a href="#" className="font-medium text-radar-600 hover:underline">
              Politica de Privacidade
            </a>{' '}
            e a LGPD.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !isValid}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-radar-600 to-radar-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-radar-600/20 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Criar conta
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </motion.form>

      <motion.div variants={fadeUp} custom={2} className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface px-3 text-ink-faint">ou cadastre-se com</span>
          </div>
        </div>

        <button className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-ink transition-all hover:bg-surface-alt hover:border-border-strong">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>
      </motion.div>

      <motion.p variants={fadeUp} custom={3} className="mt-8 text-center text-sm text-ink-muted">
        Ja tem conta?{' '}
        <Link to="/login" className="font-semibold text-radar-600 hover:text-radar-700">
          Entrar
        </Link>
      </motion.p>
    </motion.div>
  )
}
