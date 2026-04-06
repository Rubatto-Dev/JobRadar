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
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, body.detail || 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    register(data: { name: string; email: string; password: string; lgpd_consent: boolean }) {
      return request<{ id: string; email: string; name: string; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    login(data: { email: string; password: string }) {
      return request<{ access_token: string; refresh_token: string; token_type: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    googleAuth(credential: string) {
      return request<{ access_token: string; refresh_token: string }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      })
    },
  },
}

export { ApiError }
