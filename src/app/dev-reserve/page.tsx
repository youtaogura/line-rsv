'use client';

import { LoadingSpinner } from '@/components/common';
import { UI_TEXT } from '@/constants/ui';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

const env = process.env.NODE_ENV;

function DevReserveContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const userId = searchParams.get('userId');
    const displayName = searchParams.get('displayName');
    const tenantId = searchParams.get('tenantId');

    if (env !== 'development' || !userId || !displayName) {
      window.location.href = '/error';
      return;
    }

    // パラメータをsession storageに保存
    const userData = {
      userId,
      displayName,
      ...(tenantId && { tenantId }),
    };
    sessionStorage.setItem('reserveParams', JSON.stringify(userData));

    // /reserve画面にリダイレクト
    window.location.href = '/reserve';
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">{UI_TEXT.DEV_MODE} - リダイレクト中...</p>
    </div>
  );
}

export default function DevReserve() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DevReserveContent />
    </Suspense>
  );
}
