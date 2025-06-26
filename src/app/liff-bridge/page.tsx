'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LiffBridgeContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    import('@line/liff').then(async (liff) => {
      await liff.default.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })

      if (!liff.default.isLoggedIn()) {
        liff.default.login()
        return
      }

      const profile = await liff.default.getProfile()
      const userId = profile.userId
      const tenantId = searchParams.get('tenantId') || ''

      if (!tenantId) {
        alert('不正なアクセスです。')
        window.location.href = '/error?error=missing_tenant'
      }

      // パラメータをsession storageに保存
      const userData = {
        userId,
        displayName: profile.displayName,
        ...(tenantId && { tenantId })
      }
      sessionStorage.setItem('reserveParams', JSON.stringify(userData))
      
      // /reserve画面にリダイレクト
      window.location.href = '/reserve'
    })
  }, [searchParams])

  return <p>読み込み中...</p>
}

export default function LiffBridge() {
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <LiffBridgeContent />
    </Suspense>
  )
}
