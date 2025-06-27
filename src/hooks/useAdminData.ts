import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Reservation, BusinessHour, User } from '@/lib/supabase'
import { buildApiUrl } from '@/lib/tenant-helpers'
import type { AdminSession } from '@/lib/admin-types'

export const useAdminSession = () => {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/admin/login')
      return
    }
  }, [session, status, router])

  return {
    session: session as unknown as AdminSession,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated'
  }
}

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const { session } = useAdminSession()

  const fetchReservations = useCallback(async () => {
    try {
      const tenantId = session?.user?.tenant_id
      if (!tenantId) {
        console.error('No tenant ID found in session')
        return
      }

      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('datetime', { ascending: true })

      if (error) {
        console.error('Error fetching reservations:', error)
      } else {
        setReservations(data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [session])

  const deleteReservation = async (reservationId: string) => {
    if (!confirm('この予約を削除しますか？')) return
    
    try {
      const tenantId = session?.user?.tenant_id
      if (!tenantId) {
        alert('セッション情報が正しくありません')
        return
      }

      const response = await fetch(buildApiUrl(`/api/reservations?id=${reservationId}`, tenantId), {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setReservations(reservations.filter(r => r.id !== reservationId))
        alert('予約を削除しました')
      } else {
        const data = await response.json()
        alert(data.error || '予約の削除に失敗しました')
      }
    } catch (error) {
      console.error('Delete reservation error:', error)
      alert('予約の削除に失敗しました')
    }
  }

  return {
    reservations,
    loading,
    fetchReservations,
    deleteReservation
  }
}

export const useBusinessHours = () => {
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([])
  const { session } = useAdminSession()

  const fetchBusinessHours = useCallback(async () => {
    try {
      const tenantId = session?.user?.tenant_id
      if (!tenantId) {
        console.error('No tenant ID found in session')
        return
      }

      const response = await fetch(buildApiUrl('/api/business-hours', tenantId))
      const data = await response.json()
      
      if (response.ok) {
        setBusinessHours(data)
      } else {
        console.error('Error fetching business hours:', data.error)
      }
    } catch (error) {
      console.error('Fetch business hours error:', error)
    }
  }, [session])

  const createBusinessHour = async (newBusinessHour: {
    day_of_week: number
    start_time: string
    end_time: string
  }) => {
    try {
      const tenantId = session?.user?.tenant_id
      if (!tenantId) {
        alert('セッション情報が正しくありません')
        return false
      }

      const response = await fetch(buildApiUrl('/api/business-hours', tenantId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBusinessHour),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setBusinessHours([...businessHours, data])
        alert('営業時間を追加しました')
        return true
      } else {
        alert(data.error || '営業時間の追加に失敗しました')
        return false
      }
    } catch (error) {
      console.error('Create business hour error:', error)
      alert('営業時間の追加に失敗しました')
      return false
    }
  }

  const deleteBusinessHour = async (id: string) => {
    if (!confirm('この営業時間を削除しますか？')) return
    
    try {
      const tenantId = session?.user?.tenant_id
      if (!tenantId) {
        alert('セッション情報が正しくありません')
        return
      }

      const response = await fetch(buildApiUrl(`/api/business-hours?id=${id}`, tenantId), {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setBusinessHours(businessHours.filter(bh => bh.id !== id))
        alert('営業時間を削除しました')
      } else {
        const data = await response.json()
        alert(data.error || '営業時間の削除に失敗しました')
      }
    } catch (error) {
      console.error('Delete business hour error:', error)
      alert('営業時間の削除に失敗しました')
    }
  }

  return {
    businessHours,
    fetchBusinessHours,
    createBusinessHour,
    deleteBusinessHour
  }
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const { session } = useAdminSession()

  const fetchUsers = useCallback(async () => {
    try {
      const tenantId = session?.user?.tenant_id
      if (!tenantId) {
        console.error('No tenant ID found in session')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
      } else {
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Fetch users error:', error)
    }
  }, [session])

  const updateUser = async (userId: string, updateData: {
    name: string
    phone: string
    member_type: 'regular' | 'guest'
  }) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      
      if (response.ok) {
        const updatedUser = await response.json()
        setUsers(users.map(user => 
          user.user_id === userId ? updatedUser : user
        ))
        alert('ユーザー情報を更新しました')
        return true
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'ユーザー情報の更新に失敗しました')
        return false
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('ユーザー情報の更新に失敗しました')
      return false
    }
  }

  return {
    users,
    fetchUsers,
    updateUser
  }
}

export const useTenant = () => {
  const [tenant, setTenant] = useState<{ id: string; name: string } | null>(null)
  const { session } = useAdminSession()

  const fetchTenant = useCallback(async () => {
    try {
      const tenantId = session?.user?.tenant_id
      if (!tenantId) {
        console.error('No tenant ID found in session')
        return
      }

      const response = await fetch(buildApiUrl(`/api/tenants/${tenantId}`, tenantId))
      if (response.ok) {
        const tenantData = await response.json()
        setTenant(tenantData)
      } else {
        console.error('Error fetching tenant data')
      }
    } catch (error) {
      console.error('Fetch tenant error:', error)
    }
  }, [session])

  return {
    tenant,
    fetchTenant
  }
}