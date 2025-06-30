'use client';

import { ErrorIcon, LoadingSpinner, PageLayout } from '@/components/common';
import { UI_TEXT } from '@/constants/ui';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'missing_tenant':
        return {
          title: 'テナントIDが必要です',
          message:
            'このサービスを利用するには、有効なテナントIDをクエリパラメータとして指定してください。',
          detail: '例: https://yourapp.com/?tenantId=your-tenant-id',
        };
      case 'invalid_tenant':
        return {
          title: 'テナントが見つかりません',
          message:
            '指定されたテナントIDは無効であるか、アクティブではありません。',
          detail: 'テナントIDを確認して再度お試しください。',
        };
      case 'server_error':
        return {
          title: 'サーバーエラー',
          message: '予約システムで問題が発生しました。',
          detail: 'しばらくしてから再度お試しください。',
        };
      default:
        return {
          title: UI_TEXT.ERROR_OCCURRED,
          message: 'アクセスに問題があります。',
          detail: UI_TEXT.TRY_AGAIN,
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <PageLayout centerContent>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <ErrorIcon />
          <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-4">
            {errorInfo.title}
          </h1>
          <p className="text-gray-600 mb-4">{errorInfo.message}</p>
          <p className="text-sm text-gray-500 mb-8">{errorInfo.detail}</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-primary text-white py-3 px-4 rounded-xs hover:bg-primary-hover transition-colors text-center block font-medium"
          >
            戻る
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>{UI_TEXT.CONTACT_SUPPORT}</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ErrorContent />
    </Suspense>
  );
}
