'use client';

import { ArrowLeft, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useNotifications } from '@/hooks/useNotifications';
import { AdminSidebar } from './AdminSidebar';
import { NotificationDrawer } from './NotificationDrawer';

interface AdminLayoutWithSidebarProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  user?: {
    name?: string | null;
    username?: string | null;
  };
  tenant?: {
    id?: string;
    name: string;
  } | null;
  showBackButton?: boolean;
  backUrl?: string;
}

export const AdminLayoutWithSidebar: React.FC<AdminLayoutWithSidebarProps> = ({
  children,
  title: _title,
  description: _description,
  user,
  tenant,
  showBackButton = false,
  backUrl,
}) => {
  const router = useRouter();
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] =
    useState(false);

  const { getUnreadCount } = useNotifications();
  const unreadCount = getUnreadCount();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Desktop Sidebar */}
        <AdminSidebar user={user} tenant={tenant} />

        {/* Main Content */}
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mr-auto max-w-5xl flex h-16 shrink-0 items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />

              {/* Back button for mobile or when explicitly requested */}
              {showBackButton && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="shrink-0 lg:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">戻る</span>
                  </Button>
                  <Separator
                    orientation="vertical"
                    className="mr-2 h-4 lg:hidden"
                  />
                </>
              )}

              {/* Page title */}
              <div className="flex flex-col flex-1">
                <h1 className="text-lg font-semibold">管理画面</h1>
                {tenant && (
                  <p className="text-xs text-muted-foreground">{tenant.name}</p>
                )}
              </div>

              {/* Notification bell for desktop */}
              <div className="relative ml-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsNotificationDrawerOpen(true)}
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                  <span className="sr-only">通知を開く</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-hidden">
            <div className="container mr-auto px-4 py-6 max-w-5xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />
    </SidebarProvider>
  );
};
