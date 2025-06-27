'use client'

import { useState, Suspense, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Reservation, BusinessHour, User } from '@/lib/supabase'
import { format } from 'date-fns'
import { format as formatTz } from 'date-fns-tz'
import {  buildApiUrl } from '@/lib/tenant-helpers'
import { ReservationForm } from '@/components/reservation/ReservationForm'

interface AdminSession {
  user: {
    id: string
    name?: string | null
    username: string
    tenant_id: string
  }
}

function AdminContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [tenant, setTenant] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    member_type: 'guest' as 'regular' | 'guest'
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState<'reservations' | 'business-hours' | 'users' | 'manual-booking'>('reservations')
  
  const [newBusinessHour, setNewBusinessHour] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '18:00'
  })

  const fetchReservations = useCallback(async () => {
    try {
      const tenantId = (session as unknown as AdminSession)?.user?.tenant_id
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

  const fetchBusinessHours = useCallback(async () => {
    try {
      const tenantId = (session as unknown as AdminSession)?.user?.tenant_id
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

  const fetchUsers = useCallback(async () => {
    try {
      const tenantId = (session as unknown as AdminSession)?.user?.tenant_id
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

  const fetchTenant = useCallback(async () => {
    try {
      const tenantId = (session as unknown as AdminSession)?.user?.tenant_id
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

  // fetchData関数をuseCallbackでメモ化
  const fetchData = useCallback(async () => {
    await Promise.all([fetchReservations(), fetchBusinessHours(), fetchUsers(), fetchTenant()])
  }, [fetchReservations, fetchBusinessHours, fetchUsers, fetchTenant])

  useEffect(() => {
    if (status === 'loading') return // セッション確認中

    if (status === 'unauthenticated') {
      router.push('/admin/login')
      return
    }

    if (session?.user) {
      fetchData()
    }
  }, [session, status, router, fetchData])

  const createBusinessHour = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const tenantId = (session as unknown as AdminSession)?.user?.tenant_id
      if (!tenantId) {
        alert('セッション情報が正しくありません')
        return
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
        setNewBusinessHour({
          day_of_week: 1,
          start_time: '09:00',
          end_time: '18:00'
        })
        alert('営業時間を追加しました')
      } else {
        alert(data.error || '営業時間の追加に失敗しました')
      }
    } catch (error) {
      console.error('Create business hour error:', error)
      alert('営業時間の追加に失敗しました')
    }
  }

  const deleteBusinessHour = async (id: string) => {
    if (!confirm('この営業時間を削除しますか？')) return
    
    try {
      const tenantId = (session as unknown as AdminSession)?.user?.tenant_id
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

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setEditFormData({
      name: user.name,
      phone: user.phone || '',
      member_type: user.member_type
    })
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditingUser(null)
    setIsEditModalOpen(false)
    setEditFormData({
      name: '',
      phone: '',
      member_type: 'guest'
    })
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setIsUpdating(true)
    
    try {
      const response = await fetch(`/api/users/${editingUser.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      })
      
      if (response.ok) {
        const updatedUser = await response.json()
        setUsers(users.map(user => 
          user.user_id === editingUser.user_id ? updatedUser : user
        ))
        closeEditModal()
        alert('ユーザー情報を更新しました')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'ユーザー情報の更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('ユーザー情報の更新に失敗しました')
    } finally {
      setIsUpdating(false)
    }
  }

  const getDayName = (day_of_week: number) => {
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return days[day_of_week]
  }

  const deleteReservation = async (reservationId: string) => {
    if (!confirm('この予約を削除しますか？')) return
    
    try {
      const tenantId = (session as unknown as AdminSession)?.user?.tenant_id
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

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push(timeString)
      }
    }
    return options
  }

  const exportToJson = () => {
    const dataStr = JSON.stringify(reservations, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `reservations_${format(new Date(), 'yyyy-MM-dd')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const exportToCsv = () => {
    const headers = ['名前', '会員種別', '予約日時', '備考', '作成日時']
    const csvContent = [
      headers.join(','),
      ...reservations.map(r => [
        r.name,
        r.member_type === 'regular' ? '会員' : 'ゲスト',
        formatTz(new Date(r.datetime), 'yyyy/M/d HH:mm', { timeZone: 'Asia/Tokyo' }),
        r.note || '',
        formatTz(new Date(r.created_at), 'yyyy/M/d HH:mm', { timeZone: 'Asia/Tokyo' })
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const dataUri = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvContent)
    const exportFileDefaultName = `reservations_${format(new Date(), 'yyyy-MM-dd')}.csv`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const formatDateTime = (datetime: string) => {
    return formatTz(
      new Date(datetime),
      'yyyy/M/d HH:mm',
      { timeZone: 'Asia/Tokyo' }
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">認証確認中...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              認証が必要です
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              管理者としてログインしてください
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">予約管理画面</h1>
            <p className="mt-2 text-gray-600">予約の確認と営業時間の管理ができます</p>
            {session?.user && (
              <p className="text-sm text-gray-500 mt-1">
                ログイン中: {(session as unknown as AdminSession).user.name} ({(session as unknown as AdminSession).user.username})
              </p>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            ログアウト
          </button>
        </div>

        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === 'reservations'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              予約一覧
            </button>
            <button
              onClick={() => setActiveTab('business-hours')}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === 'business-hours'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              営業時間管理
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === 'users'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              ユーザー管理
            </button>
            <button
              onClick={() => setActiveTab('manual-booking')}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === 'manual-booking'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              手動予約登録
            </button>
          </nav>
        </div>

        {activeTab === 'reservations' && (
          <>
            <div className="mb-6 flex space-x-4">
              <button
                onClick={exportToJson}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover"
              >
                JSON出力
              </button>
              <button
                onClick={exportToCsv}
                className="bg-success text-white px-4 py-2 rounded-md hover:bg-success/90"
              >
                CSV出力
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      名前
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      会員種別
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      予約日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      備考
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      予約作成日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        予約がありません
                      </td>
                    </tr>
                  ) : (
                    reservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {reservation.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            reservation.member_type === 'regular' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {reservation.member_type === 'regular' ? '会員' : 'ゲスト'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(reservation.datetime)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {reservation.note || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(reservation.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => deleteReservation(reservation.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'business-hours' && (
          <>
            <div className="mb-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">新しい営業時間を追加</h2>
                <form onSubmit={createBusinessHour} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">
                        曜日
                      </label>
                      <select
                        id="dayOfWeek"
                        value={newBusinessHour.day_of_week}
                        onChange={(e) => setNewBusinessHour({...newBusinessHour, day_of_week: parseInt(e.target.value)})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      >
                        <option value={1}>月曜日</option>
                        <option value={2}>火曜日</option>
                        <option value={3}>水曜日</option>
                        <option value={4}>木曜日</option>
                        <option value={5}>金曜日</option>
                        <option value={6}>土曜日</option>
                        <option value={0}>日曜日</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                        開始時間
                      </label>
                      <select
                        id="startTime"
                        value={newBusinessHour.start_time}
                        onChange={(e) => setNewBusinessHour({...newBusinessHour, start_time: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      >
                        {generateTimeOptions().map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                        終了時間
                      </label>
                      <select
                        id="endTime"
                        value={newBusinessHour.end_time}
                        onChange={(e) => setNewBusinessHour({...newBusinessHour, end_time: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      >
                        {generateTimeOptions().map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        追加
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">現在の営業時間</h2>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      曜日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      開始時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      終了時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      30分刻みスロット数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {businessHours.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        営業時間が設定されていません
                      </td>
                    </tr>
                  ) : (
                    businessHours.map((businessHour) => {
                      const startTime = new Date(`2000-01-01T${businessHour.start_time}`)
                      const endTime = new Date(`2000-01-01T${businessHour.end_time}`)
                      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
                      const slotCount = Math.floor(durationMinutes / 30)
                      
                      return (
                        <tr key={businessHour.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {getDayName(businessHour.day_of_week)}曜日
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {businessHour.start_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {businessHour.end_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {slotCount}個
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => deleteBusinessHour(businessHour.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'manual-booking' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">手動予約登録</h2>
            <p className="text-sm text-gray-600 mb-6">管理者として代理で予約を登録することができます</p>
            <ReservationForm
              tenantId={(session as unknown as AdminSession)?.user?.tenant_id || ''}
              isAdminMode={true}
              availableUsers={users}
              onSuccess={fetchReservations}
              tenantName={tenant?.name}
            />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">ユーザー管理</h2>
              <p className="text-sm text-gray-600 mt-1">登録ユーザーの会員種別を管理できます</p>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザーID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名前
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    電話番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    会員種別
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      登録ユーザーがいません
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.user_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {user.user_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.member_type === 'regular' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {user.member_type === 'regular' ? '会員' : 'ゲスト'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-primary hover:text-primary-hover font-medium"
                        >
                          編集
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit User Modal */}
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ユーザー情報編集</h3>
                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電話番号
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      会員種別 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editFormData.member_type}
                      onChange={(e) => setEditFormData({...editFormData, member_type: e.target.value as 'regular' | 'guest'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
                    >
                      <option value="guest">ゲスト</option>
                      <option value="regular">会員</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating || !editFormData.name.trim()}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUpdating ? '更新中...' : '更新'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    }>
      <AdminContent />
    </Suspense>
  )
}