'use client';

import {
  useTenant,
  buildUrlWithTenantId,
  useTenantId,
} from '@/lib/tenant-helpers';
import { Suspense } from 'react';
import { LoadingSpinner, PageLayout, ActionButton } from '@/components/common';

function HomeContent() {
  const { tenant, loading } = useTenant();
  const tenantId = useTenantId();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!tenant) {
    return null; // useTenant フックがエラーページにリダイレクトする
  }

  return (
    <PageLayout centerContent>
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
          <ActionButton
            href={buildUrlWithTenantId('/login', tenantId)}
            variant="success"
          >
            予約を取る
          </ActionButton>

          <ActionButton
            href={buildUrlWithTenantId('/admin', tenantId)}
            variant="secondary"
          >
            管理画面
          </ActionButton>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>初回のお客様もご利用いただけます</p>
        </div>
      </div>
    </PageLayout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeContent />
    </Suspense>
  );
}
