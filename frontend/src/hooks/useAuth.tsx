import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, type LoginResponse, type UserProfile } from '../services/api'

interface AuthState {
  user: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithTokens: (tokens: LoginResponse) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const profile = await api.user.getProfile()
      setUser(profile)
    } catch {
      // Try refresh token before giving up
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const tokens = await api.auth.refreshToken(refreshToken)
          localStorage.setItem('access_token', tokens.access_token)
          localStorage.setItem('refresh_token', tokens.refresh_token)
          const profile = await api.user.getProfile()
          setUser(profile)
          return
        } catch {
          // Refresh also failed
        }
      }
      setUser(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.auth.login({ email, password })
    localStorage.setItem('access_token', result.access_token)
    localStorage.setItem('refresh_token', result.refresh_token)
    const profile = await api.user.getProfile()
    setUser(profile)
  }, [])

  const loginWithTokens = useCallback(async (tokens: LoginResponse) => {
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    const profile = await api.user.getProfile()
    setUser(profile)
  }, [])

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      api.auth.logout(refreshToken).catch(() => {})
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: !!user, login, loginWithTokens, logout, refreshUser }),
    [user, loading, login, loginWithTokens, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
