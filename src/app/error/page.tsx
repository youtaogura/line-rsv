'use client';

import { LoadingSpinner, PageLayout } from '@/components/common';
import { Button } from '@/components/ui/button';
import { UI_TEXT } from '@/constants/ui';
import { AlertTriangle } from 'lucide-react';
import { Suspense } from 'react';

function ErrorContent() {
  // const searchParams = useSearchParams();
  // const error = searchParams.get('error');

  const getErrorMessage = () => {
    return {
      title: UI_TEXT.ERROR_OCCURRED,
      message: 'アクセスに問題があります。',
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <PageLayout centerContent>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AlertTriangle className="inline w-8 h-8 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-4">
            {errorInfo.title}
          </h1>
          <p className="text-gray-600 mb-4">{errorInfo.message}</p>
        </div>

        <div className="space-y-4">
          <Button onClick={() => window.history.back()} className="w-full ">
            戻る
          </Button>

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
