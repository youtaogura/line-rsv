'use client'

import { useState, Suspense, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useAdminSession, useBusinessHours } from '@/hooks/useAdminData'
import { BusinessHourForm } from '@/components/admin/BusinessHourForm'
import { BusinessHourList } from '@/components/admin/BusinessHourList'

function BusinessHoursContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession()
  const { businessHours, fetchBusinessHours, createBusinessHour, deleteBusinessHour } = useBusinessHours()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      const fetchData = async () => {
        await fetchBusinessHours()
        setLoading(false)
      }
      fetchData()
    }
  }, [isAuthenticated, session, fetchBusinessHours])

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
            <h1 className="text-3xl font-bold text-gray-900">営業時間管理</h1>
            <p className="mt-2 text-gray-600">営業時間の設定と管理ができます</p>
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

        <div className="space-y-8">
          {/* 営業時間追加フォーム */}
          <BusinessHourForm onCreateBusinessHour={createBusinessHour} />

          {/* 現在の営業時間一覧 */}
          <BusinessHourList 
            businessHours={businessHours}
            onDeleteBusinessHour={deleteBusinessHour}
          />
        </div>
      </div>
    </div>
  )
}

export default function BusinessHoursPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    }>
      <BusinessHoursContent />
    </Suspense>
  )
}