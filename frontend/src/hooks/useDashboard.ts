import { useCallback, useEffect, useState } from 'react'
import { api, type DashboardData } from '../services/api'

const FALLBACK: DashboardData = {
  new_jobs_24h: 0,
  favorites_count: 0,
  active_applications: 0,
  applications_by_status: {},
  recommended_jobs: [],
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData>(FALLBACK)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const result = await api.dashboard.get()
      setData(result)
    } catch {
      setData(FALLBACK)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, refresh }
}
