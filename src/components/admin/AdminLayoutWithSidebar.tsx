'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutWithSidebarProps {
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
  showBackButton?: boolean;
  backUrl?: string;
}

export const AdminLayoutWithSidebar: React.FC<AdminLayoutWithSidebarProps> = ({
  children,
  title,
  description,
  user,
  tenant,
  showBackButton = false,
  backUrl,
}) => {
  const router = useRouter();

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
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
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
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold">{title}</h1>
              {tenant && (
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {tenant.name}
                </p>
              )}
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-hidden">
            <div className="container mx-auto px-4 py-6 max-w-none">
              {description && (
                <div className="mb-6">
                  <p className="text-muted-foreground">{description}</p>
                </div>
              )}
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
