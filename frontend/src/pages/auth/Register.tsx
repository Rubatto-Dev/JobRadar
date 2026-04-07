import { GoogleLogin } from '@react-oauth/google'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
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
  const { loginWithTokens } = useAuth()
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

        <div className="mt-4 flex justify-center [&>div]:w-full">
          <GoogleLogin
            onSuccess={async (response) => {
              if (response.credential) {
                try {
                  const tokens = await api.auth.googleAuth(response.credential)
                  await loginWithTokens(tokens)
                  navigate('/dashboard')
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : 'Erro ao autenticar com Google.')
                }
              }
            }}
            onError={() => setError('Erro ao conectar com Google. Tente novamente.')}
            width="400"
            text="signup_with"
            shape="pill"
          />
        </div>
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
