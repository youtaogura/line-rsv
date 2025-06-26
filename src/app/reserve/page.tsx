'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { User, AvailableSlot } from '@/lib/supabase'
import { format } from 'date-fns'
import { format as formatTz } from 'date-fns-tz'
import { useTenant, buildApiUrl, useTenantId } from '@/lib/tenant-helpers'

function ReserveContent() {
  const searchParams = useSearchParams()
  const { tenant, loading: tenantLoading } = useTenant()
  const defaultTenantId = useTenantId()
  
  // URLパラメータから値を取得
  const urlUserId = searchParams.get('userId')
  const urlDisplayName = searchParams.get('displayName')
  const urlTenantId = searchParams.get('tenantId')
  
  // tenantIdの優先順位: URLパラメータ > デフォルト
  const tenantId = urlTenantId || defaultTenantId
  
  const [user, setUser] = useState<{ user_id: string; displayName: string; pictureUrl?: string } | null>(null)
  const [dbUser, setDbUser] = useState<User | null>(null)
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDateTime, setSelectedDateTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!tenant || !tenantId) {
      return
    }

    const initializeUser = async () => {
      // URLパラメータからユーザー情報が渡された場合
      if (urlUserId && urlDisplayName) {
        const userData = {
          user_id: urlUserId,
          displayName: urlDisplayName
        }
        setUser(userData)
        
        // ユーザー情報をAPIから取得
        try {
          const userResponse = await fetch(buildApiUrl(`/api/users/${urlUserId}`, tenantId))
          if (userResponse.ok) {
            const existingUser = await userResponse.json()
            setDbUser(existingUser)
            setName(existingUser.name)
          } else {
            setName(urlDisplayName)
          }
        } catch (error) {
          console.error('Error fetching user from API:', error)
          setName(urlDisplayName)
        }
      } else {
        // 従来のCookie認証を使用
        const getUserFromCookie = async () => {
          try {
            const response = await fetch('/api/user')
            if (response.ok) {
              const userData = await response.json()
              setUser(userData)
              
              // ユーザー情報をAPIから取得
              try {
                const userResponse = await fetch(buildApiUrl(`/api/users/${userData.user_id}`, tenantId))
                if (userResponse.ok) {
                  const existingUser = await userResponse.json()
                  setDbUser(existingUser)
                  setName(existingUser.name)
                } else {
                  setName(userData.displayName)
                }
              } catch (error) {
                console.error('Error fetching user from API:', error)
                setName(userData.displayName)
              }
            } else {
              window.location.href = '/login'
            }
          } catch (error) {
            console.error('User fetch error:', error)
            window.location.href = '/login'
          }
        }
        await getUserFromCookie()
      }
    }

    Promise.all([initializeUser()])
      .finally(() => setLoading(false))
  }, [tenant, tenantId, urlUserId, urlDisplayName])

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDate || !tenantId) {
        setAvailableSlots([])
        return
      }

      try {
        const response = await fetch(buildApiUrl(`/api/available-slots?date=${selectedDate}`, tenantId))
        console.log('Fetching available slots for date:', selectedDate)
        if (response.ok) {
          const data = await response.json()
          setAvailableSlots(data)
        } else {
          console.error('Error fetching slots')
          setAvailableSlots([])
        }
      } catch (error) {
        console.error('Error fetching slots:', error)
        setAvailableSlots([])
      }
    }

    fetchAvailableSlots()
  }, [selectedDate, tenantId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedDateTime || !name.trim()) {
      alert('必要な項目を入力してください。')
      return
    }

    console.log('User data:', user)
    console.log('User ID:', user.user_id)

    if (!user.user_id) {
      alert('ユーザー情報が不正です。再度ログインしてください。')
      window.location.href = '/login'
      return
    }

    setSubmitting(true)

    try {
      const member_type = dbUser ? 'regular' : 'guest'
      
      const reservationData = {
        user_id: user.user_id,
        name,
        datetime: selectedDateTime,
        note,
        member_type,
        phone: !dbUser ? phone : undefined
      }

      console.log('Reservation data:', reservationData)
      
      const response = await fetch(buildApiUrl('/api/reservations', tenantId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Reservation error:', result)
        alert(result.error || '予約に失敗しました。時間をおいて再度お試しください。')
        return
      }

      await fetch(buildApiUrl('/api/notify', tenantId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          datetime: selectedDateTime,
          member_type,
          note
        })
      })

      alert('予約が完了しました！')
      window.location.href = '/'
    } catch (error) {
      console.error('Reservation error:', error)
      alert('予約処理でエラーが発生しました。')
    } finally {
      setSubmitting(false)
    }
  }

  // テナントが読み込まれるまで待機
  if (tenantLoading || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
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

  const formatDateTime = (datetime: string) => {
    return formatTz(
      new Date(datetime),
      'yyyy/M/d HH:mm',
      { timeZone: 'Asia/Tokyo' }
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">レッスン予約</h1>
        
        {user && (
          <div className="mb-6 p-4 bg-primary-light rounded-lg">
            <p className="text-sm text-gray-600">ログイン中</p>
            <p className="font-semibold">{user.displayName}</p>
            <div className="mt-2">
              {dbUser && <span className="text-xs bg-success/10 text-success px-2 py-1 rounded font-medium">会員</span>}
              {!dbUser && <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded font-medium">ゲスト</span>}
            </div>
          </div>
        )}


        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
              placeholder="お名前を入力してください"
            />
            {dbUser && (
              <p className="text-xs text-secondary mt-1">
                会員として表示名を変更できます
              </p>
            )}
          </div>

          {!dbUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電話番号
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              予約日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                setSelectedDateTime('')
              }}
              min={format(new Date(), 'yyyy-MM-dd')}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
            />
          </div>

          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                予約時間 <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDateTime}
                onChange={(e) => setSelectedDateTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
              >
                <option value="">時間を選択してください</option>
                {availableSlots.map((slot) => (
                  <option key={slot.datetime} value={slot.datetime}>
                    {formatDateTime(slot.datetime)}
                  </option>
                ))}
              </select>
              {availableSlots.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">この日は予約可能な時間がありません</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メモ（任意）
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
              placeholder="初回レッスンです、など"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedDateTime || !name}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '予約中...' : '予約する'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ReservePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    }>
      <ReserveContent />
    </Suspense>
  )
}