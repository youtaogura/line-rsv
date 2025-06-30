import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { UI_TEXT } from '@/constants/ui';

interface AuthGuardProps {
  children: React.ReactNode;
  isLoading: boolean;
  isAuthenticated: boolean;
  authenticationMessage?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  isLoading,
  isAuthenticated,
  authenticationMessage = UI_TEXT.ADMIN_LOGIN_REQUIRED,
}) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {UI_TEXT.AUTHENTICATION_REQUIRED}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {authenticationMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
