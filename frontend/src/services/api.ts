const API_BASE = '/api/v1'

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      if (!path.includes('/auth/')) {
        window.location.href = '/login'
      }
    }
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, body.detail || 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// --- Auth ---
export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface RegisterResponse {
  id: string
  email: string
  name: string
  message: string
}

// --- Jobs ---
export interface JobSummary {
  id: string
  title: string
  company: string
  location: string | null
  modality: string | null
  seniority: string | null
  salary_text: string | null
  url: string
  published_at: string | null
  is_active: boolean
  is_favorited: boolean
  application_status: string | null
}

export interface JobDetail extends JobSummary {
  description: string
  requirements: string | null
  city: string | null
  state: string | null
  country: string | null
  salary_min: number | null
  salary_max: number | null
  created_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: { offset: number; limit: number; total: number }
}

// --- Applications ---
export interface Application {
  id: string
  job_id: string
  status: string
  notes: string | null
  applied_at: string
  updated_at: string
}

// --- Favorites ---
export interface Favorite {
  id: string
  job_id: string
  created_at: string
}

// --- Dashboard ---
export interface DashboardData {
  new_jobs_24h: number
  favorites_count: number
  active_applications: number
  applications_by_status: Record<string, number>
  recommended_jobs: Array<{ id: string; title: string; company: string }>
}

// --- Preferences ---
export interface Preferences {
  id: string | null
  modalities: string[]
  locations: string[]
  seniority_levels: string[]
  keywords: string[]
  area_ids: string[]
  salary_min: number | null
  salary_max: number | null
  alert_frequency: string
  alerts_enabled: boolean
}

// --- User ---
export interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url: string | null
  location: string | null
  locale: string
  is_active: boolean
  is_admin: boolean
  email_verified: boolean
  created_at: string
}

export const api = {
  auth: {
    register(data: { name: string; email: string; password: string; lgpd_consent: boolean }) {
      return request<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    login(data: { email: string; password: string }) {
      return request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    googleAuth(credential: string) {
      return request<LoginResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      })
    },
  },

  user: {
    getProfile() {
      return request<UserProfile>('/users/me')
    },
    updateProfile(data: Partial<Pick<UserProfile, 'name' | 'location' | 'avatar_url' | 'locale'>>) {
      return request<UserProfile>('/users/me', { method: 'PATCH', body: JSON.stringify(data) })
    },
    deleteAccount(password: string) {
      return request<void>('/users/me', { method: 'DELETE', body: JSON.stringify({ password }) })
    },
    exportData() {
      return request<unknown>('/users/me/export')
    },
  },

  jobs: {
    search(params: {
      q?: string
      modality?: string[]
      seniority?: string[]
      location?: string
      sort?: string
      order?: string
      offset?: number
      limit?: number
    }) {
      const searchParams = new URLSearchParams()
      if (params.q) searchParams.set('q', params.q)
      if (params.modality) params.modality.forEach((m) => searchParams.append('modality', m))
      if (params.seniority) params.seniority.forEach((s) => searchParams.append('seniority', s))
      if (params.location) searchParams.set('location', params.location)
      if (params.sort) searchParams.set('sort', params.sort)
      if (params.order) searchParams.set('order', params.order)
      searchParams.set('offset', String(params.offset ?? 0))
      searchParams.set('limit', String(params.limit ?? 20))
      return request<PaginatedResponse<JobSummary>>(`/jobs?${searchParams}`)
    },
    getById(id: string) {
      return request<JobDetail>(`/jobs/${id}`)
    },
  },

  favorites: {
    list(offset = 0, limit = 20) {
      return request<PaginatedResponse<Favorite>>(`/favorites?offset=${offset}&limit=${limit}`)
    },
    add(jobId: string) {
      return request<Favorite>('/favorites', { method: 'POST', body: JSON.stringify({ job_id: jobId }) })
    },
    remove(jobId: string) {
      return request<void>(`/favorites/${jobId}`, { method: 'DELETE' })
    },
  },

  applications: {
    list(status?: string, offset = 0, limit = 20) {
      const params = new URLSearchParams({ offset: String(offset), limit: String(limit) })
      if (status) params.set('status', status)
      return request<PaginatedResponse<Application>>(`/applications?${params}`)
    },
    create(jobId: string, notes?: string) {
      return request<Application>('/applications', {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId, notes }),
      })
    },
    update(id: string, data: { status?: string; notes?: string }) {
      return request<Application>(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    },
    delete(id: string) {
      return request<void>(`/applications/${id}`, { method: 'DELETE' })
    },
    exportCsv() {
      const token = localStorage.getItem('access_token')
      return fetch(`${API_BASE}/applications/export/csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then((r) => r.text())
    },
  },

  dashboard: {
    get() {
      return request<DashboardData>('/dashboard')
    },
  },

  preferences: {
    get() {
      return request<Preferences>('/users/me/preferences')
    },
    update(data: Partial<Preferences>) {
      return request<Preferences>('/users/me/preferences', { method: 'PUT', body: JSON.stringify(data) })
    },
  },

  alerts: {
    getSettings() {
      return request<{ alert_frequency: string; alerts_enabled: boolean }>('/alerts/settings')
    },
    updateSettings(data: { alert_frequency?: string; alerts_enabled?: boolean }) {
      return request<{ alert_frequency: string; alerts_enabled: boolean }>('/alerts/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
  },
}

export { ApiError }
