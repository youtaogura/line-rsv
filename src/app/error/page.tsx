"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = () => {
    switch (error) {
      case "missing_tenant":
        return {
          title: "テナントIDが必要です",
          message:
            "このサービスを利用するには、有効なテナントIDをクエリパラメータとして指定してください。",
          detail: "例: https://yourapp.com/?tenantId=your-tenant-id",
        };
      case "invalid_tenant":
        return {
          title: "テナントが見つかりません",
          message:
            "指定されたテナントIDは無効であるか、アクティブではありません。",
          detail: "テナントIDを確認して再度お試しください。",
        };
      default:
        return {
          title: "エラーが発生しました",
          message: "アクセスに問題があります。",
          detail: "しばらくしてから再度お試しください。",
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-error">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-4">
            {errorInfo.title}
          </h1>
          <p className="text-gray-600 mb-4">{errorInfo.message}</p>
          <p className="text-sm text-gray-500 mb-8">{errorInfo.detail}</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-hover transition-colors text-center block font-medium"
          >
            戻る
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>お困りの場合は管理者にお問い合わせください</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl">読み込み中...</div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
