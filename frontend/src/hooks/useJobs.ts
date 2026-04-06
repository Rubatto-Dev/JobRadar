import { useCallback, useEffect, useState } from 'react'
import { api, type JobSummary, type PaginatedResponse } from '../services/api'

interface UseJobsParams {
  q?: string
  modality?: string[]
  seniority?: string[]
  location?: string
  sort?: string
  offset?: number
  limit?: number
}

const EMPTY: PaginatedResponse<JobSummary> = { data: [], pagination: { offset: 0, limit: 20, total: 0 } }

export function useJobs(params: UseJobsParams) {
  const [result, setResult] = useState<PaginatedResponse<JobSummary>>(EMPTY)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.jobs.search(params)
      setResult(data)
    } catch {
      setResult(EMPTY)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)])

  useEffect(() => {
    const timer = setTimeout(fetch, 300) // debounce
    return () => clearTimeout(timer)
  }, [fetch])

  return { jobs: result.data, total: result.pagination.total, loading }
}
