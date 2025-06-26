'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function LiffRedirectContent() {
  const searchParams = useSearchParams()
  const [params, setParams] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const paramsObj: { [key: string]: string } = {}
    searchParams.forEach((value, key) => {
      paramsObj[key] = value
    })
    setParams(paramsObj)
  }, [searchParams])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">LIFF リダイレクト</h1>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">取得されたパラメータ:</h2>
        {Object.keys(params).length > 0 ? (
          <div className="bg-gray-100 p-4 rounded">
            {Object.entries(params).map(([key, value]) => (
              <div key={key} className="mb-2">
                <span className="font-medium">{key}:</span> {value}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">パラメータが見つかりません</p>
        )}
      </div>
    </div>
  )
}

export default function LiffRedirectPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <LiffRedirectContent />
    </Suspense>
  )
}