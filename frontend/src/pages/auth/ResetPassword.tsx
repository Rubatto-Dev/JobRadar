import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Check, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const isValid = password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setError('')
    setLoading(true)

    try {
      await api.auth.resetPassword(token, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao redefinir. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center">
        <motion.div variants={fadeUp} custom={0} className="space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h1 className="font-display text-2xl font-bold text-ink">Link invalido</h1>
          <p className="text-sm text-ink-muted">O link de redefinicao de senha e invalido ou expirou.</p>
          <Link
            to="/forgot-password"
            className="mt-4 inline-flex text-sm font-medium text-radar-600 hover:text-radar-700"
          >
            Solicitar novo link
          </Link>
        </motion.div>
      </motion.div>
    )
  }

  if (success) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center">
        <motion.div variants={fadeUp} custom={0} className="space-y-4">
          <CheckCircle size={48} className="mx-auto text-emerald-500" />
          <h1 className="font-display text-2xl font-bold text-ink">Senha redefinida!</h1>
          <p className="text-sm text-ink-muted">Sua senha foi alterada com sucesso.</p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-radar-600 to-radar-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-radar-600/20 transition-all hover:shadow-xl hover:brightness-110"
          >
            Ir para o login
          </Link>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger}>
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Nova senha</h1>
        <p className="mt-2 text-sm text-ink-muted">Crie uma nova senha para sua conta.</p>
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
          <label htmlFor="password" className="block text-sm font-medium text-ink">
            Nova senha
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
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

        <button
          type="submit"
          disabled={loading || !isValid}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-radar-600 to-radar-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-radar-600/20 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Redefinir senha
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </motion.form>
    </motion.div>
  )
}
