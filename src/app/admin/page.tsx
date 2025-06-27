'use client'

import { useState, Suspense, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useAdminSession, useReservations, useBusinessHours, useUsers, useTenant } from '@/hooks/useAdminData'
import Link from 'next/link'

function AdminContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession()
  const { reservations, fetchReservations } = useReservations()
  const { businessHours, fetchBusinessHours } = useBusinessHours()
  const { users, fetchUsers } = useUsers()
  const { tenant, fetchTenant } = useTenant()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      const fetchData = async () => {
        await Promise.all([
          fetchReservations(),
          fetchBusinessHours(),
          fetchUsers(),
          fetchTenant()
        ])
        setLoading(false)
      }
      fetchData()
    }
  }, [isAuthenticated, session, fetchReservations, fetchBusinessHours, fetchUsers, fetchTenant])

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">管理画面ダッシュボード</h1>
            <p className="mt-2 text-gray-600">システムの各機能にアクセスできます</p>
            {session?.user && (
              <p className="text-sm text-gray-500 mt-1">
                ログイン中: {session.user.name} ({session.user.username})
              </p>
            )}
            {tenant && (
              <p className="text-sm text-gray-500">
                テナント: {tenant.name}
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

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">予約数</h3>
            <p className="text-3xl font-bold text-primary">{reservations.length}</p>
            <p className="text-sm text-gray-500 mt-1">現在の予約総数</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">登録ユーザー数</h3>
            <p className="text-3xl font-bold text-success">{users.length}</p>
            <p className="text-sm text-gray-500 mt-1">会員: {users.filter(u => u.member_type === 'regular').length}人</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">営業時間設定</h3>
            <p className="text-3xl font-bold text-warning">{businessHours.length}</p>
            <p className="text-sm text-gray-500 mt-1">設定済み時間帯</p>
          </div>
        </div>

        {/* 機能メニュー */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/admin/reservations"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-primary"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">予約管理</h3>
                <p className="text-sm text-gray-500">予約の確認・削除・エクスポート</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/business-hours"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-success"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">営業時間管理</h3>
                <p className="text-sm text-gray-500">営業時間の設定・変更</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-warning"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">ユーザー管理</h3>
                <p className="text-sm text-gray-500">会員情報の編集・管理</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/manual-booking"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-red-500"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">手動予約登録</h3>
                <p className="text-sm text-gray-500">管理者による代理予約</p>
              </div>
            </div>
          </Link>
        </div>

        {/* 最近の予約 */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">最近の予約</h2>
          </div>
          <div className="px-6 py-4">
            {reservations.length === 0 ? (
              <p className="text-gray-500">予約がありません</p>
            ) : (
              <div className="space-y-2">
                {reservations.slice(0, 5).map((reservation) => (
                  <div key={reservation.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <span className="font-medium">{reservation.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({reservation.member_type === 'regular' ? '会員' : 'ゲスト'})
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(reservation.datetime).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
                {reservations.length > 5 && (
                  <div className="pt-2">
                    <Link
                      href="/admin/reservations"
                      className="text-primary hover:text-primary-hover text-sm"
                    >
                      すべての予約を見る →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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