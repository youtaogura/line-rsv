import { useState, useEffect, useCallback } from 'react'
import { buildApiUrl } from '@/lib/tenant-helpers'
import type { BusinessHour } from '@/lib/supabase'

interface UseBusinessHoursReturn {
  businessHours: BusinessHour[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useBusinessHours(tenantId: string | null): UseBusinessHoursReturn {
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBusinessHours = useCallback(async () => {
    if (!tenantId) {
      setError('Tenant ID is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(buildApiUrl('/api/business-hours', tenantId))

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch business hours')
      }

      const data = await response.json()
      setBusinessHours(data)
    } catch (err) {
      console.error('Error fetching business hours:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setBusinessHours([])
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const refetch = useCallback(() => {
    fetchBusinessHours()
  }, [fetchBusinessHours])

  useEffect(() => {
    fetchBusinessHours()
  }, [fetchBusinessHours])

  return {
    businessHours,
    loading,
    error,
    refetch
  }
}