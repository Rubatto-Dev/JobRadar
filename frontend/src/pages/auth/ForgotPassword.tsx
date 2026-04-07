import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../../services/api'
import { fadeUp, stagger } from '../../lib/motion'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.auth.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center">
        <motion.div variants={fadeUp} custom={0} className="space-y-4">
          <Mail size={48} className="mx-auto text-radar-500" />
          <h1 className="font-display text-2xl font-bold text-ink">Verifique seu email</h1>
          <p className="text-sm text-ink-muted">
            Se existe uma conta com <strong>{email}</strong>, enviamos um link para redefinir sua senha.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-radar-600 hover:text-radar-700"
          >
            <ArrowLeft size={14} />
            Voltar ao login
          </Link>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger}>
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Esqueceu a senha?</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Informe seu email e enviaremos um link para redefinir sua senha.
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

        <button
          type="submit"
          disabled={loading}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-radar-600 to-radar-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-radar-600/20 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Enviar link
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </motion.form>

      <motion.p variants={fadeUp} custom={2} className="mt-8 text-center">
        <Link to="/login" className="flex items-center justify-center gap-1 text-sm font-medium text-radar-600 hover:text-radar-700">
          <ArrowLeft size={14} />
          Voltar ao login
        </Link>
      </motion.p>
    </motion.div>
  )
}
