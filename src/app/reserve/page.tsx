'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { User } from '@/lib/supabase'
import { useTenant, buildApiUrl, useTenantId } from '@/lib/tenant-helpers'
import { ReservationCalendar } from '@/components/reservation/ReservationCalendar'
import { format as formatTz } from 'date-fns-tz'

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
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null)
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
      // ユーザー存在チェック・登録処理
      let finalDbUser = dbUser
      
      if (!dbUser) {
        // ユーザーがDBに存在しない場合、ゲストとして登録
        try {
          const createUserResponse = await fetch(buildApiUrl(`/api/users/${user.user_id}`, tenantId), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: name.trim(),
              phone: phone?.trim() || null,
            }),
          })

          if (createUserResponse.ok) {
            finalDbUser = await createUserResponse.json()
            setDbUser(finalDbUser)
            console.log('Guest user created:', finalDbUser)
          } else {
            const errorResult = await createUserResponse.json()
            console.error('Failed to create guest user:', errorResult)
            alert('ゲストユーザーの登録に失敗しました。')
            return
          }
        } catch (error) {
          console.error('Error creating guest user:', error)
          alert('ゲストユーザーの登録でエラーが発生しました。')
          return
        }
      }

      const member_type = finalDbUser ? 'regular' : 'guest'
      
      const reservationData = {
        user_id: user.user_id,
        name,
        datetime: selectedDateTime,
        note,
        member_type,
        phone: !finalDbUser ? phone : undefined
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">レッスン予約</h1>

        {/* 新しいカレンダーUI */}
        <ReservationCalendar
          tenantId={tenantId}
          selectedDateTime={selectedDateTime}
          onDateTimeSelect={setSelectedDateTime}
        />

        {/* フォーム */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">予約情報入力</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                お名前 <span className="text-red-500">*</span>
              </label>
              {
                !dbUser ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                    placeholder="お名前を入力してください"
                  />

                ): 
                <div className='flex gap-4 items-center'>
                <p>{name}</p>
                 <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">登録済み</span>
                  </div>
              }
            </div>

            {/* 選択した日時の表示 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                予約日時 <span className="text-red-500">*</span>
              </label>
              <div className={`w-full px-4 py-3 border rounded-md transition-colors ${
                selectedDateTime 
                  ? 'border-green-300 bg-green-50 text-green-800' 
                  : 'border-red-300 bg-red-50 text-red-800'
              }`}>
                {selectedDateTime ? (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">
                      {formatTz(
                        new Date(selectedDateTime),
                        'yyyy年M月d日 HH:mm',
                        { timeZone: 'Asia/Tokyo' }
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>日時を選択してください。</span>
                  </div>
                )}
              </div>
            </div>

            {!dbUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                  placeholder="電話番号を入力してください"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メモ（任意）
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                placeholder="特記事項やご要望があればご記入ください"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedDateTime || !name}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitting ? '予約中...' : '予約する'}
            </button>
          </form>
        </div>
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