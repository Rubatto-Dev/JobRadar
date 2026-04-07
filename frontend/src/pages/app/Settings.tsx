import { motion } from 'framer-motion'
import {
  CheckCircle,
  Download,
  Save,
  Shield,
  Trash2,
  User,
  X,
  Briefcase,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fadeUp, stagger } from '../../lib/motion'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { api } from '../../services/api'

const MODALITY_OPTIONS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'remoto', label: 'Remoto' },
  { value: 'home_office', label: 'Home Office' },
  { value: 'hibrido', label: 'Hibrido' },
  { value: 'freelance', label: 'Freelance' },
]

const SENIORITY_OPTIONS = [
  { value: 'estagio', label: 'Estagio' },
  { value: 'junior', label: 'Junior' },
  { value: 'pleno', label: 'Pleno' },
  { value: 'senior', label: 'Senior' },
  { value: 'especialista', label: 'Especialista' },
  { value: 'gestao', label: 'Gestao' },
]

const LOCALE_OPTIONS = [
  { value: 'pt-br', label: 'Portugues (BR)' },
  { value: 'en', label: 'English' },
]

function TagInput({
  label,
  id,
  values,
  onChange,
  placeholder,
}: {
  label: string
  id: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      const tag = input.trim()
      if (!values.includes(tag)) {
        onChange([...values, tag])
      }
      setInput('')
    }
    if (e.key === 'Backspace' && !input && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  function removeTag(tag: string) {
    onChange(values.filter((v) => v !== tag))
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink mb-2">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 transition-all focus-within:border-radar-400 focus-within:ring-2 focus-within:ring-radar-100">
        {values.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-radar-50 px-2.5 py-0.5 text-xs font-medium text-radar-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-radar-400 hover:text-radar-700"
              aria-label={`Remover ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] border-0 bg-transparent py-1 text-sm text-ink outline-none placeholder:text-ink-faint"
        />
      </div>
      <p className="mt-1 text-xs text-ink-faint">Pressione Enter ou virgula para adicionar</p>
    </div>
  )
}

function DeleteAccountModal({
  open,
  onClose,
  onConfirm,
  deleting,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (password: string) => void
  deleting: boolean
}) {
  const [password, setPassword] = useState('')

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Confirmar exclusao de conta"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-4 w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-ink">Excluir conta</h3>
        <p className="mt-2 text-sm text-ink-muted">
          Esta acao e irreversivel. Todos os seus dados serao removidos permanentemente.
          Digite sua senha para confirmar.
        </p>
        <div className="mt-4">
          <label htmlFor="delete-password" className="block text-sm font-medium text-ink mb-1.5">
            Senha
          </label>
          <input
            id="delete-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-ink transition-all focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
            autoFocus
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-ink transition-all hover:bg-surface-alt"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(password)}
            disabled={deleting || !password}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Excluindo...' : 'Excluir conta'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function Settings() {
  const { user, logout, refreshUser } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Profile state
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [locale, setLocale] = useState('pt-br')
  const [savingProfile, setSavingProfile] = useState(false)

  // Preferences state
  const [modalities, setModalities] = useState<string[]>([])
  const [seniorityLevels, setSeniorityLevels] = useState<string[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [profile, prefs] = await Promise.all([
        api.user.getProfile(),
        api.preferences.get(),
      ])

      setName(profile.name)
      setLocation(profile.location ?? '')
      setLocale(profile.locale)

      setModalities(prefs.modalities)
      setSeniorityLevels(prefs.seniority_levels)
      setKeywords(prefs.keywords)
      setLocations(prefs.locations)
      setSalaryMin(prefs.salary_min?.toString() ?? '')
      setSalaryMax(prefs.salary_max?.toString() ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configuracoes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      await api.user.updateProfile({
        name: name.trim(),
        location: location.trim() || null,
        locale,
      })
      await refreshUser()
      toast.success('Perfil atualizado com sucesso')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSavePreferences() {
    setSavingPrefs(true)
    try {
      await api.preferences.update({
        modalities,
        seniority_levels: seniorityLevels,
        keywords,
        locations,
        salary_min: salaryMin ? Number(salaryMin) : null,
        salary_max: salaryMax ? Number(salaryMax) : null,
      })
      toast.success('Preferencias atualizadas com sucesso')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar preferencias')
    } finally {
      setSavingPrefs(false)
    }
  }

  async function handleExportData() {
    setExporting(true)
    try {
      const data = await api.user.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `jobrad-dados-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Dados exportados com sucesso')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao exportar dados')
    } finally {
      setExporting(false)
    }
  }

  async function handleDeleteAccount(password: string) {
    setDeleting(true)
    try {
      await api.user.deleteAccount(password)
      logout()
      navigate('/login')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir conta')
      setDeleting(false)
    }
  }

  function toggleCheckbox(value: string, list: string[], setter: (v: string[]) => void) {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value))
    } else {
      setter([...list, value])
    }
  }

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeUp} custom={0}>
          <div className="h-7 w-40 animate-pulse rounded bg-surface-alt" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-surface-alt" />
        </motion.div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-surface-alt" />
        ))}
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        <motion.div variants={fadeUp} custom={0}>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Configuracoes</h1>
        </motion.div>
        <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={loadData}
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
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Configuracoes</h1>
        <p className="mt-1 text-sm text-ink-muted">Gerencie seu perfil e preferencias de busca</p>
      </motion.div>

      {/* Profile section */}
      <motion.div
        variants={fadeUp}
        custom={1}
        className="rounded-2xl border border-border bg-white p-6 space-y-5"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-xl bg-radar-50 p-2.5 text-radar-600">
            <User size={20} />
          </div>
          <h2 className="text-base font-semibold text-ink">Perfil</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-ink mb-1.5">
              Nome
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-ink transition-all focus:border-radar-400 focus:outline-none focus:ring-2 focus:ring-radar-100"
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-ink mb-1.5">
              Email
            </label>
            <div className="flex items-center gap-2">
              <input
                id="profile-email"
                type="email"
                value={user?.email ?? ''}
                readOnly
                className="w-full rounded-xl border border-border bg-surface-alt px-4 py-2.5 text-sm text-ink-muted cursor-not-allowed"
              />
              {user?.email_verified && (
                <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle size={12} />
                  Verificado
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="profile-location" className="block text-sm font-medium text-ink mb-1.5">
              Localizacao
            </label>
            <input
              id="profile-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Sao Paulo, SP"
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-ink transition-all focus:border-radar-400 focus:outline-none focus:ring-2 focus:ring-radar-100"
            />
          </div>

          <div>
            <label htmlFor="profile-locale" className="block text-sm font-medium text-ink mb-1.5">
              Idioma
            </label>
            <select
              id="profile-locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink transition-all focus:border-radar-400 focus:outline-none focus:ring-2 focus:ring-radar-100"
            >
              {LOCALE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile || !name.trim()}
            className="flex items-center gap-2 rounded-xl bg-radar-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-radar-700 disabled:opacity-50"
          >
            <Save size={16} />
            {savingProfile ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </div>
      </motion.div>

      {/* Preferences section */}
      <motion.div
        variants={fadeUp}
        custom={2}
        className="rounded-2xl border border-border bg-white p-6 space-y-5"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
            <Briefcase size={20} />
          </div>
          <h2 className="text-base font-semibold text-ink">Preferencias de Vagas</h2>
        </div>

        {/* Modalities */}
        <fieldset>
          <legend className="block text-sm font-medium text-ink mb-2">Modalidade</legend>
          <div className="flex flex-wrap gap-2">
            {MODALITY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-all ${
                  modalities.includes(opt.value)
                    ? 'border-radar-300 bg-radar-50 text-radar-700 font-medium'
                    : 'border-border text-ink-muted hover:border-border-strong'
                }`}
              >
                <input
                  type="checkbox"
                  checked={modalities.includes(opt.value)}
                  onChange={() => toggleCheckbox(opt.value, modalities, setModalities)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Seniority */}
        <fieldset>
          <legend className="block text-sm font-medium text-ink mb-2">Senioridade</legend>
          <div className="flex flex-wrap gap-2">
            {SENIORITY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-all ${
                  seniorityLevels.includes(opt.value)
                    ? 'border-radar-300 bg-radar-50 text-radar-700 font-medium'
                    : 'border-border text-ink-muted hover:border-border-strong'
                }`}
              >
                <input
                  type="checkbox"
                  checked={seniorityLevels.includes(opt.value)}
                  onChange={() => toggleCheckbox(opt.value, seniorityLevels, setSeniorityLevels)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Keywords */}
        <TagInput
          label="Palavras-chave"
          id="pref-keywords"
          values={keywords}
          onChange={setKeywords}
          placeholder="Ex: React, Python, DevOps"
        />

        {/* Locations */}
        <TagInput
          label="Localizacoes"
          id="pref-locations"
          values={locations}
          onChange={setLocations}
          placeholder="Ex: Sao Paulo, Remoto"
        />

        {/* Salary range */}
        <div>
          <p className="block text-sm font-medium text-ink mb-2">Faixa salarial</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label htmlFor="salary-min" className="sr-only">
                Salario minimo
              </label>
              <input
                id="salary-min"
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="Minimo"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-ink transition-all focus:border-radar-400 focus:outline-none focus:ring-2 focus:ring-radar-100"
              />
            </div>
            <span className="text-sm text-ink-faint">ate</span>
            <div className="flex-1">
              <label htmlFor="salary-max" className="sr-only">
                Salario maximo
              </label>
              <input
                id="salary-max"
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="Maximo"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-ink transition-all focus:border-radar-400 focus:outline-none focus:ring-2 focus:ring-radar-100"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSavePreferences}
            disabled={savingPrefs}
            className="flex items-center gap-2 rounded-xl bg-radar-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-radar-700 disabled:opacity-50"
          >
            <Save size={16} />
            {savingPrefs ? 'Salvando...' : 'Salvar preferencias'}
          </button>
        </div>
      </motion.div>

      {/* Privacy section */}
      <motion.div
        variants={fadeUp}
        custom={3}
        className="rounded-2xl border border-border bg-white p-6 space-y-5"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
            <Shield size={20} />
          </div>
          <h2 className="text-base font-semibold text-ink">Dados e Privacidade</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium text-ink">Exportar meus dados</p>
              <p className="text-xs text-ink-muted">Baixe uma copia dos seus dados (LGPD)</p>
            </div>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-ink transition-all hover:border-border-strong hover:shadow-sm disabled:opacity-50"
            >
              <Download size={16} />
              {exporting ? 'Exportando...' : 'Exportar'}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/50 p-4">
            <div>
              <p className="text-sm font-medium text-red-800">Excluir conta</p>
              <p className="text-xs text-red-600">Acao irreversivel. Todos os dados serao removidos.</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          </div>
        </div>
      </motion.div>

      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        deleting={deleting}
      />
    </motion.div>
  )
}
