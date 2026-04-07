import { motion } from 'framer-motion'
import { Bell, ExternalLink, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fadeUp, stagger } from '../../lib/motion'
import { useToast } from '../../hooks/useToast'
import { api, type Preferences } from '../../services/api'

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
]

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  home_office: 'Home Office',
  hibrido: 'Hibrido',
  freelance: 'Freelance',
}

const SENIORITY_LABELS: Record<string, string> = {
  estagio: 'Estagio',
  junior: 'Junior',
  pleno: 'Pleno',
  senior: 'Senior',
  especialista: 'Especialista',
  gestao: 'Gestao',
}

export default function Alerts() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [enabled, setEnabled] = useState(false)
  const [frequency, setFrequency] = useState('daily')
  const [preferences, setPreferences] = useState<Preferences | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [settings, prefs] = await Promise.all([
          api.alerts.getSettings(),
          api.preferences.get(),
        ])
        setEnabled(settings.alerts_enabled)
        setFrequency(settings.alert_frequency)
        setPreferences(prefs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar configuracoes')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const result = await api.alerts.updateSettings({
        alerts_enabled: enabled,
        alert_frequency: frequency,
      })
      setEnabled(result.alerts_enabled)
      setFrequency(result.alert_frequency)
      toast.success('Alertas atualizados com sucesso')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeUp} custom={0}>
          <div className="h-7 w-32 animate-pulse rounded bg-surface-alt" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-surface-alt" />
        </motion.div>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-alt" />
          ))}
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeUp} custom={0}>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Alertas</h1>
        </motion.div>
        <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-800 transition-colors hover:bg-red-200"
          >
            Tentar novamente
          </button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Alertas</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Receba notificacoes sobre novas vagas que combinam com seu perfil
        </p>
      </motion.div>

      {/* Settings */}
      <motion.div
        variants={fadeUp}
        custom={1}
        className="rounded-2xl border border-border bg-white p-6 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-radar-50 p-2.5 text-radar-600">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Alertas por email</h2>
              <p className="text-xs text-ink-muted">Receba vagas novas diretamente no seu email</p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={enabled}
            aria-label="Ativar ou desativar alertas por email"
            onClick={() => setEnabled(!enabled)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              enabled ? 'bg-radar-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {enabled && (
          <div>
            <label htmlFor="alert-frequency" className="block text-sm font-medium text-ink mb-2">
              Frequencia
            </label>
            <select
              id="alert-frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full max-w-xs rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink transition-all focus:border-radar-400 focus:outline-none focus:ring-2 focus:ring-radar-100"
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-radar-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-radar-700 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </motion.div>

      {/* Preferences summary */}
      <motion.div
        variants={fadeUp}
        custom={2}
        className="rounded-2xl border border-border bg-white p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Filtros ativos</h2>
          <Link
            to="/settings"
            className="flex items-center gap-1 text-sm font-medium text-radar-600 hover:text-radar-700"
          >
            Editar preferencias
            <ExternalLink size={14} />
          </Link>
        </div>

        {preferences && (
          <div className="space-y-3">
            {preferences.keywords.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-muted mb-1.5">Palavras-chave</p>
                <div className="flex flex-wrap gap-1.5">
                  {preferences.keywords.map((k) => (
                    <span key={k} className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs text-ink">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {preferences.modalities.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-muted mb-1.5">Modalidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {preferences.modalities.map((m) => (
                    <span key={m} className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs text-ink">
                      {MODALITY_LABELS[m] ?? m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {preferences.seniority_levels.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-muted mb-1.5">Senioridade</p>
                <div className="flex flex-wrap gap-1.5">
                  {preferences.seniority_levels.map((s) => (
                    <span key={s} className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs text-ink">
                      {SENIORITY_LABELS[s] ?? s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {preferences.locations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-muted mb-1.5">Localizacoes</p>
                <div className="flex flex-wrap gap-1.5">
                  {preferences.locations.map((l) => (
                    <span key={l} className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs text-ink">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {preferences.keywords.length === 0 &&
              preferences.modalities.length === 0 &&
              preferences.seniority_levels.length === 0 &&
              preferences.locations.length === 0 && (
                <p className="text-sm text-ink-muted">
                  Nenhum filtro configurado.{' '}
                  <Link to="/settings" className="font-medium text-radar-600 hover:text-radar-700">
                    Configure suas preferencias
                  </Link>
                </p>
              )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
