import { GoogleLogin } from '@react-oauth/google'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { fadeUp, stagger } from '../../lib/motion'
import { api, ApiError } from '../../services/api'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginWithTokens } = useAuth()
  const toast = useToast()
  const justRegistered = (location.state as { registered?: boolean })?.registered
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      toast.success('Login realizado com sucesso!')
      navigate('/dashboard')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Erro ao conectar. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger}>
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Bem-vindo de volta</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Entre na sua conta para acessar suas vagas e candidaturas.
        </p>
      </motion.div>

      {justRegistered && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700"
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          Conta criada! Verifique seu email para confirmar e depois faca login.
        </motion.div>
      )}

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
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
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
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Senha
            </label>
            <Link to="/forgot-password" className="text-xs font-medium text-radar-600 hover:text-radar-700">
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-radar-600 to-radar-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-radar-600/20 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Entrar
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
            <span className="bg-surface px-3 text-ink-faint">ou continue com</span>
          </div>
        </div>

        <div className="mt-4 flex justify-center [&>div]:w-full">
          <GoogleLogin
            onSuccess={async (response) => {
              if (response.credential) {
                try {
                  const tokens = await api.auth.googleAuth(response.credential)
                  await loginWithTokens(tokens)
                  toast.success('Login realizado com sucesso!')
                  navigate('/dashboard')
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : 'Erro ao autenticar com Google.')
                }
              }
            }}
            onError={() => setError('Erro ao conectar com Google. Tente novamente.')}
            width="400"
            text="continue_with"
            shape="pill"
          />
        </div>
      </motion.div>

      <motion.p variants={fadeUp} custom={3} className="mt-8 text-center text-sm text-ink-muted">
        Nao tem conta?{' '}
        <Link to="/register" className="font-semibold text-radar-600 hover:text-radar-700">
          Criar conta gratis
        </Link>
      </motion.p>
    </motion.div>
  )
}
