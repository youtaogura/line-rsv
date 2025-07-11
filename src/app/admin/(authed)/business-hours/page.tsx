'use client';

import { BusinessHourDialog } from '@/components/admin/BusinessHourDialog';
import { BusinessHourList } from '@/components/admin/BusinessHourList';
import { AdminLayout, AuthGuard, LoadingSpinner } from '@/components/common';
import { UI_TEXT } from '@/constants/ui';
import {
  useAdminSession,
  useAdminBusinessHours,
  useAdminTenant,
} from '@/hooks/admin';
import { Suspense, useEffect, useState } from 'react';

function BusinessHoursContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession();
  const { tenant, fetchTenant } = useAdminTenant();
  const {
    businessHours,
    fetchBusinessHours,
    createBusinessHour,
    deleteBusinessHour,
  } = useAdminBusinessHours();
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">営業時間一覧</h2>
            </div>
            <BusinessHourDialog onCreateBusinessHour={createBusinessHour} />
          </div>
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
