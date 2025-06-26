'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function DevReserveContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const userId = searchParams.get('userId')
    const displayName = searchParams.get('displayName')
    const tenantId = searchParams.get('tenantId')

    if (!userId || !displayName) {
      alert('必要なパラメータ（userId, displayName）が不足しています。')
      return
    }

    // パラメータをsession storageに保存
    const userData = {
      userId,
      displayName,
      ...(tenantId && { tenantId })
    }
    sessionStorage.setItem('reserveParams', JSON.stringify(userData))
    
    // /reserve画面にリダイレクト
    window.location.href = '/reserve'
  }, [searchParams])

  return <p>開発用リダイレクト中...</p>
}

export default function DevReserve() {
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <DevReserveContent />
    </Suspense>
  )
}