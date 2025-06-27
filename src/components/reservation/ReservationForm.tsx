'use client'

import { useState } from 'react'
import { ReservationCalendar } from './ReservationCalendar'
import { useReservationMenu } from './hooks/useReservationMenu'
import { format as formatTz } from 'date-fns-tz'
import { buildApiUrl } from '@/lib/tenant-helpers'
import type { User } from '@/lib/supabase'

interface ReservationFormProps {
  tenantId: string
  // 管理者モードかどうか
  isAdminMode?: boolean
  // 初期値
  initialUser?: {
    user_id: string
    name: string
    phone?: string
    member_type?: 'regular' | 'guest'
  }
  // 事前選択された日時
  preselectedDateTime?: string
  // 管理者モード時の既存ユーザー一覧
  availableUsers?: User[]
  // 成功時のコールバック
  onSuccess?: () => void
  // 管理者モード時のテナント名
  tenantName?: string
}

export function ReservationForm({
  tenantId,
  isAdminMode = false,
  initialUser,
  preselectedDateTime,
  availableUsers = [],
  onSuccess,
  tenantName
}: ReservationFormProps) {
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(preselectedDateTime || null)
  const [name, setName] = useState(initialUser?.name || '')
  const [phone, setPhone] = useState(initialUser?.phone || '')
  const [note, setNote] = useState('')
  const [adminNote, setAdminNote] = useState('') // 管理者専用メモ
  const [submitting, setSubmitting] = useState(false)

  // 管理者モード用の状態
  const [userMode, setUserMode] = useState<'existing' | 'new'>('existing')
  const [selectedUserId, setSelectedUserId] = useState(initialUser?.user_id || '')

  // 予約メニューを取得
  const { reservationMenu } = useReservationMenu(tenantId)


  // 既存ユーザー選択時の処理
  const handleExistingUserSelect = (userId: string) => {
    setSelectedUserId(userId)
    const user = availableUsers.find(u => u.user_id === userId)
    if (user) {
      setName(user.name)
      setPhone(user.phone || '')
    }
  }

  // 新規ユーザーモード切り替え時の処理
  const handleUserModeChange = (mode: 'existing' | 'new') => {
    setUserMode(mode)
    if (mode === 'new') {
      setSelectedUserId('')
      setName('')
      setPhone('')
    } else if (availableUsers.length > 0) {
      handleExistingUserSelect(availableUsers[0].user_id)
    }
  }

  const generateUserId = () => {
    return `admin_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDateTime || !name.trim()) {
      alert('必要な項目を入力してください。')
      return
    }

    let finalUserId = ''
    if (isAdminMode) {
      if (userMode === 'existing') {
        finalUserId = selectedUserId
      } else {
        finalUserId = generateUserId()
      }
    } else {
      finalUserId = initialUser?.user_id || ''
    }

    if (!finalUserId) {
      alert('ユーザー情報が不正です。')
      return
    }

    setSubmitting(true)

    try {
      const reservationData = {
        user_id: finalUserId,
        name: name.trim(),
        datetime: selectedDateTime,
        note: note.trim() || null,
        member_type: isAdminMode && userMode === 'new' ? 'guest' : 
                     initialUser?.member_type || 'guest',
        phone: userMode === 'new' || !initialUser ? phone.trim() || null : undefined,
        admin_note: isAdminMode ? adminNote.trim() || null : null,
        is_admin_mode: isAdminMode,
        reservation_menu_id: reservationMenu?.id || null
      }

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

      if (isAdminMode) {
        alert('予約を登録しました！')
        // 管理者モード時のみフォームをリセット
        setSelectedDateTime(null)
        setNote('')
        setAdminNote('')
        if (userMode === 'new') {
          setName('')
          setPhone('')
        }
      } else {
        alert('予約が完了しました！')
        // ユーザーモード時はフォームをリセットしない（画面に残す）
        setSelectedDateTime(null)
        setNote('')
      }

      // 成功時のコールバック実行
      if (onSuccess) {
        onSuccess()
      }

      if (!isAdminMode) {
        // 通知送信（ユーザーモードのみ）
        await fetch(buildApiUrl('/api/notify', tenantId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            datetime: selectedDateTime,
            member_type: reservationData.member_type,
            note: note.trim()
          })
        })
      }

    } catch (error) {
      console.error('Reservation error:', error)
      alert('予約処理でエラーが発生しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* カレンダー */}
      <ReservationCalendar
        tenantId={tenantId}
        selectedDateTime={selectedDateTime}
        onDateTimeSelect={setSelectedDateTime}
      />

      {/* フォーム */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {isAdminMode ? `手動予約登録${tenantName ? ` - ${tenantName}` : ''}` : '予約情報入力'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 管理者モード: ユーザー選択 */}
          {isAdminMode && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ユーザー選択方法
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="userMode"
                      value="existing"
                      checked={userMode === 'existing'}
                      onChange={(e) => handleUserModeChange(e.target.value as 'existing')}
                      className="mr-2"
                    />
                    既存ユーザー
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="userMode"
                      value="new"
                      checked={userMode === 'new'}
                      onChange={(e) => handleUserModeChange(e.target.value as 'new')}
                      className="mr-2"
                    />
                    新規ユーザー
                  </label>
                </div>
              </div>

              {userMode === 'existing' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ユーザー選択 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => handleExistingUserSelect(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">ユーザーを選択してください</option>
                    {availableUsers.map((user) => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.name} ({user.member_type === 'regular' ? '会員' : 'ゲスト'})
                        {user.phone && ` - ${user.phone}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            </div>
          )}

          {/* 名前 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              お名前 <span className="text-red-500">*</span>
            </label>
            {!isAdminMode && initialUser && userMode !== 'new' ? (
              <div className='flex gap-4 items-center'>
                <p>{name}</p>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">登録済み</span>
              </div>
            ) : (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isAdminMode && userMode === 'existing'}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors disabled:bg-gray-100"
                placeholder="お名前を入力してください"
              />
            )}
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

          {/* 電話番号 */}
          {((!isAdminMode && !initialUser) || (isAdminMode && userMode === 'new')) && (
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

          {/* メモ */}
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

          {/* 管理者専用メモ */}
          {isAdminMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                管理者メモ（内部用）
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-yellow-50"
                placeholder="内部管理用のメモ（顧客には表示されません）"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedDateTime || !name.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {submitting ? '登録中...' : (isAdminMode ? '予約を登録' : '予約する')}
          </button>
        </form>
      </div>
    </div>
  )
}