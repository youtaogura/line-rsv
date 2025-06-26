'use client'

import { useTenant, buildUrlWithTenantId, useTenantId } from '@/lib/tenant-helpers'

export default function Home() {
  const { tenant, loading } = useTenant()
  const tenantId = useTenantId()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  if (!tenant) {
    return null // useTenant フックがエラーページにリダイレクトする
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {tenant.name}
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            レッスン予約システム
          </h2>
          <p className="text-gray-600 mb-8">
            LINEアカウントでログインして予約をお取りください
          </p>
        </div>
        
        <div className="space-y-4">
          <a
            href={buildUrlWithTenantId('/login', tenantId)}
            className="w-full bg-success text-white py-3 px-4 rounded-lg hover:bg-success/90 transition-colors text-center block font-medium"
          >
            予約を取る
          </a>
          
          <a
            href={buildUrlWithTenantId('/admin', tenantId)}
            className="w-full bg-secondary text-white py-3 px-4 rounded-lg hover:bg-secondary/90 transition-colors text-center block font-medium"
          >
            管理画面
          </a>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>初回のお客様もご利用いただけます</p>
        </div>
      </div>
    </div>
  )
}
