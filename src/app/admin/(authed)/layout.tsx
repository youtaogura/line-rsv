'use client';

import { SessionProvider } from 'next-auth/react';
import { NotificationsProvider } from '@/contexts/NotificationsContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={5 * 60} // 5 minutes
    >
      <NotificationsProvider>
        {children}
      </NotificationsProvider>
    </SessionProvider>
  );
}
