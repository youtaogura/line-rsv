'use client'

import { useEffect } from 'react'

export default function LiffBridge() {
  useEffect(() => {
    import('@line/liff').then(async (liff) => {
      await liff.default.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })

      if (!liff.default.isLoggedIn()) {
        liff.default.login()
        return
      }

      const profile = await liff.default.getProfile()
      const userId = profile.userId

      // 任意のクエリ付きで予約ページにリダイレクト
      window.location.href = `/liff-redirect?user_id=${userId}&displayName=${profile.displayName}`
    })
  }, [])

  return <p>読み込み中...</p>
}
