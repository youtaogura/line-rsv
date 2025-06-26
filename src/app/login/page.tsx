'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleDevLogin = async (userType: 'member' | 'guest') => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType })
      })
      
      if (response.ok) {
        window.location.href = '/reserve'
      } else {
        alert('ダミーログインに失敗しました')
      }
    } catch (error) {
      console.error('Dev login error:', error)
      alert('ダミーログインでエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ゴルフレッスン予約
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            LINEアカウントでログインしてください
          </p>
        </div>
        
        <div className="space-y-4">
          <a
            href="/api/auth/line"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            LINEでログイン
          </a>

          {isDevelopment && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">開発用</span>
                </div>
              </div>

              <button
                onClick={() => handleDevLogin('member')}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? '処理中...' : 'ダミーログイン（会員）'}
              </button>

              <button
                onClick={() => handleDevLogin('guest')}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? '処理中...' : 'ダミーログイン（ゲスト）'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}