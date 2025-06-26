import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Tenant } from './supabase'

export function useTenantId(): string | null {
  const searchParams = useSearchParams()
  return searchParams.get('tenantId')
}

export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const tenantId = useTenantId()
  const router = useRouter()

  useEffect(() => {
    const fetchTenant = async () => {
      if (!tenantId) {
        router.push('/error?error=missing_tenant')
        return
      }

      try {
        const response = await fetch(`/api/tenants/${tenantId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/error?error=invalid_tenant')
          } else {
            throw new Error('Failed to fetch tenant')
          }
          return
        }

        const tenantData = await response.json()
        setTenant(tenantData)
        setError(null)
      } catch (err) {
        console.error('Error fetching tenant:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        router.push('/error?error=invalid_tenant')
      } finally {
        setLoading(false)
      }
    }

    fetchTenant()
  }, [tenantId, router])

  return { tenant, loading, error }
}

export function buildUrlWithTenantId(path: string, tenantId: string | null): string {
  if (!tenantId) {
    return path
  }

  const url = new URL(path, window.location.origin)
  url.searchParams.set('tenantId', tenantId)
  return url.pathname + url.search
}

export function getTenantIdFromUrl(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('tenantId')
}

export function redirectToError(errorType: 'missing_tenant' | 'invalid_tenant') {
  if (typeof window !== 'undefined') {
    window.location.href = `/error?error=${errorType}`
  }
}

// APIコール用のヘルパー
export function buildApiUrl(endpoint: string, tenantId: string | null): string {
  if (!tenantId) {
    throw new Error('Tenant ID is required for API calls')
  }

  const url = new URL(endpoint, window.location.origin)
  url.searchParams.set('tenantId', tenantId)
  return url.toString()
}