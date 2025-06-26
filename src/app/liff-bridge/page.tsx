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

      // /reserve画面にリダイレクト
      const params = new URLSearchParams({
        userId,
        displayName: profile.displayName,
        ...(tenantId && { tenantId })
      })
      
      window.location.href = `/reserve?${params.toString()}`
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
