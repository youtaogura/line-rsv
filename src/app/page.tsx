'use client';

import { LoadingSpinner } from '@/components/common';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function HomeContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/error?error=missing_tenant');
  }, [router]);

  return <></>;
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeContent />
    </Suspense>
  );
}
