'use client'

import { useState, useEffect } from 'react'
import type { User, AvailableSlot } from '@/lib/supabase'
import { format } from 'date-fns'
import { format as formatTz } from 'date-fns-tz'

export default function ReservePage() {
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
    const getUserFromCookie = async () => {
      try {
        const response = await fetch('/api/user')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          
          // ユーザー情報をAPIから取得
          try {
            const userResponse = await fetch(`/api/users/${userData.user_id}`)
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

    Promise.all([getUserFromCookie()])
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDate) {
        setAvailableSlots([])
        return
      }

      try {
        const response = await fetch(`/api/available-slots?date=${selectedDate}`)
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
  }, [selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedDateTime || !name) return

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
      
      const response = await fetch('/api/reservations', {
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

      await fetch('/api/notify', {
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
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">ログイン中</p>
            <p className="font-semibold">{user.displayName}</p>
            {dbUser && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">会員</span>}
            {!dbUser && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">ゲスト</span>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              お名前 {!dbUser && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!!dbUser}
              required={!dbUser}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="初回レッスンです、など"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedDateTime || !name}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? '予約中...' : '予約する'}
          </button>
        </form>
      </div>
    </div>
  )
}