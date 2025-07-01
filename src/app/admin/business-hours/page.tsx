'use client';

import { BusinessHourForm } from '@/components/admin/BusinessHourForm';
import { BusinessHourList } from '@/components/admin/BusinessHourList';
import { AdminLayout, AuthGuard, LoadingSpinner } from '@/components/common';
import { UI_TEXT } from '@/constants/ui';
import { useAdminSession, useBusinessHours, useTenant } from '@/hooks/useAdminData';
import { Suspense, useEffect, useState } from 'react';

function BusinessHoursContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession();
  const { tenant, fetchTenant } = useTenant();
  const {
    businessHours,
    fetchBusinessHours,
    createBusinessHour,
    deleteBusinessHour,
  } = useBusinessHours();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      const fetchData = async () => {
        await fetchBusinessHours();
        await fetchTenant();
        setLoading(false);
      };
      fetchData();
    }
  }, [isAuthenticated, session, fetchBusinessHours, fetchTenant]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthGuard isLoading={isLoading} isAuthenticated={isAuthenticated}>
      <AdminLayout
        title={UI_TEXT.BUSINESS_HOURS_MANAGEMENT}
        description="営業時間の設定と管理ができます"
        user={session?.user}
        tenant={tenant}
        showBackButton={true}
        backUrl="/admin"
      >
        <div className="space-y-8">
          <BusinessHourForm onCreateBusinessHour={createBusinessHour} />
          <BusinessHourList
            businessHours={businessHours}
            onDeleteBusinessHour={deleteBusinessHour}
          />
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

export default function BusinessHoursPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BusinessHoursContent />
    </Suspense>
  );
}
