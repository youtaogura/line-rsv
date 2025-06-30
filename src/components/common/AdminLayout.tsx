import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminLayoutWithSidebar } from '@/components/admin/AdminLayoutWithSidebar';
import React from 'react';

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
  showBackButton?: boolean;
  backUrl?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  description,
  user,
  tenant,
  showBackButton = false,
  backUrl,
}) => {
  return (
    <>
      {/* Desktop layout with sidebar */}
      <div className="hidden lg:block">
        <AdminLayoutWithSidebar
          title={title}
          description={description}
          user={user}
          tenant={tenant}
          showBackButton={showBackButton}
          backUrl={backUrl}
        >
          {children}
        </AdminLayoutWithSidebar>
      </div>

      {/* Mobile layout with header */}
      <div className="lg:hidden">
        <div className="min-h-screen bg-background">
          <AdminHeader
            title={title}
            user={user}
            tenant={tenant}
            showBackButton={showBackButton}
            backUrl={backUrl}
          />
          <main className="container mx-auto px-4 py-6">{children}</main>
        </div>
      </div>
    </>
  );
};
