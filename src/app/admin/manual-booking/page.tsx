'use client'

import { useState, Suspense, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useAdminSession, useUsers, useTenant } from '@/hooks/useAdminData'
import { ReservationForm } from '@/components/reservation/ReservationForm'

function ManualBookingContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession()
  const { users, fetchUsers } = useUsers()
  const { tenant, fetchTenant } = useTenant()
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  // URLパラメータから日時を取得
  const preselectedDateTime = searchParams?.get('datetime') || undefined

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      const fetchData = async () => {
        await Promise.all([
          fetchUsers(),
          fetchTenant()
        ])
        setLoading(false)
      }
      fetchData()
    }
  }, [isAuthenticated, session, fetchUsers, fetchTenant])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">認証確認中...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
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

  const handleReservationSuccess = () => {
    // 予約成功後は予約管理ページに遷移
    window.location.href = '/admin/reservations'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">手動予約登録</h1>
            <p className="mt-2 text-gray-600">管理者として代理で予約を登録できます</p>
            {session?.user && (
              <p className="text-sm text-gray-500 mt-1">
                ログイン中: {session.user.name} ({session.user.username})
              </p>
            )}
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => window.location.href = '/admin'}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              管理画面に戻る
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              ログアウト
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">予約情報入力</h2>
            <p className="text-sm text-gray-600">
              以下のフォームから予約を登録してください。既存のユーザーを選択するか、新規ユーザー情報を入力できます。
            </p>
            {preselectedDateTime && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  選択された日時: {new Date(preselectedDateTime).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>

          <ReservationForm
            tenantId={session?.user?.tenant_id || ''}
            isAdminMode={true}
            preselectedDateTime={preselectedDateTime}
            availableUsers={users}
            onSuccess={handleReservationSuccess}
            tenantName={tenant?.name}
          />
        </div>
      </div>
    </div>
  )
}

export default function ManualBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    }>
      <ManualBookingContent />
    </Suspense>
  )
}