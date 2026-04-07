import { motion } from 'framer-motion'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../../services/api'
import { fadeUp, stagger } from '../../lib/motion'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Token de verificacao ausente.')
      return
    }

    api.auth
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setError(err instanceof ApiError ? err.message : 'Token invalido ou expirado.')
      })
  }, [token])

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center">
      {status === 'loading' && (
        <motion.div variants={fadeUp} custom={0} className="space-y-4">
          <Loader2 size={48} className="mx-auto animate-spin text-radar-500" />
          <p className="text-sm text-ink-muted">Verificando seu email...</p>
        </motion.div>
      )}

      {status === 'success' && (
        <motion.div variants={fadeUp} custom={0} className="space-y-4">
          <CheckCircle size={48} className="mx-auto text-emerald-500" />
          <h1 className="font-display text-2xl font-bold text-ink">Email verificado!</h1>
          <p className="text-sm text-ink-muted">Sua conta esta confirmada. Agora voce pode fazer login.</p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-radar-600 to-radar-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-radar-600/20 transition-all hover:shadow-xl hover:brightness-110"
          >
            Ir para o login
          </Link>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div variants={fadeUp} custom={0} className="space-y-4">
          <XCircle size={48} className="mx-auto text-red-500" />
          <h1 className="font-display text-2xl font-bold text-ink">Erro na verificacao</h1>
          <p className="text-sm text-ink-muted">{error}</p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-white px-6 py-3 text-sm font-medium text-ink transition-all hover:bg-surface-alt"
          >
            Voltar ao login
          </Link>
        </motion.div>
      )}
    </motion.div>
  )
}
