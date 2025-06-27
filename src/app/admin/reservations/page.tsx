'use client'

import { useState, Suspense, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useReservations, useAdminSession } from '@/hooks/useAdminData'
import { formatDateTime } from '@/lib/admin-types'
import { AdminReservationCalendar } from '@/components/reservation/AdminReservationCalendar'
import { ReservationList } from '@/components/admin/ReservationList'
import { ReservationExport } from '@/components/admin/ReservationExport'

function ReservationsContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession()
  const { reservations, loading, fetchReservations, deleteReservation } = useReservations()
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar')

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetchReservations()
    }
  }, [isAuthenticated, session, fetchReservations])

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

  const handleCreateReservation = (datetime: string) => {
    // 手動予約登録ページに遷移
    window.location.href = `/admin/manual-booking?datetime=${encodeURIComponent(datetime)}`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">予約管理</h1>
            <p className="mt-2 text-gray-600">予約の確認と管理ができます</p>
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

        <div className="mb-6 flex justify-between items-center">
          <ReservationExport reservations={reservations} />
          
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md ${
                viewMode === 'calendar' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              カレンダー表示
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md ${
                viewMode === 'table' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              テーブル表示
            </button>
          </div>
        </div>

        {viewMode === 'calendar' && (
          <AdminReservationCalendar
            tenantId={session?.user?.tenant_id || null}
            reservations={reservations}
            onDeleteReservation={deleteReservation}
            onCreateReservation={handleCreateReservation}
          />
        )}

        {viewMode === 'table' && (
          <ReservationList
            reservations={reservations}
            onDeleteReservation={deleteReservation}
            formatDateTime={formatDateTime}
          />
        )}
      </div>
    </div>
  )
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    }>
      <ReservationsContent />
    </Suspense>
  )
}