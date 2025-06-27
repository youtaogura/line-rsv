import React from 'react';
import { signOut } from 'next-auth/react';
import { UI_TEXT } from '@/constants/ui';
import { ROUTES } from '@/constants/routes';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  user?: {
    name?: string | null;
    username?: string | null;
  };
  tenant?: {
    name: string;
  } | null;
  showBackToAdmin?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  description,
  user,
  tenant,
  showBackToAdmin = false,
}) => {
  const handleBackToAdmin = () => {
    window.location.href = ROUTES.ADMIN.ROOT;
  };

  const handleLogout = () => {
    signOut({ callbackUrl: ROUTES.ADMIN.LOGIN });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="mt-2 text-gray-600">{description}</p>
            )}
            {user && (
              <p className="text-sm text-gray-500 mt-1">
                {UI_TEXT.LOGGED_IN_AS}: {user.name} ({user.username})
              </p>
            )}
            {tenant && (
              <p className="text-sm text-gray-500">
                {UI_TEXT.TENANT}: {tenant.name}
              </p>
            )}
          </div>
          <div className="space-x-2">
            {showBackToAdmin && (
              <button
                onClick={handleBackToAdmin}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {UI_TEXT.BACK_TO_ADMIN}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {UI_TEXT.LOGOUT}
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};