'use client';

import { DashboardCard } from '@/components/admin/DashboardCard';
import { RecentReservations } from '@/components/admin/RecentReservations';
import { UnassignedReservations } from '@/components/admin/UnassignedReservations';
import { AdminLayout, AuthGuard, LoadingSpinner } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { UI_TEXT } from '@/constants/ui';
import {
  useAdminSession,
  useRecentReservations,
  useStaffMembers,
  useTenant,
  useUnassignedReservations,
} from '@/hooks/useAdminData';
import { adminApi } from '@/lib/api';
import { CalendarCheck, Clock, UserCog, Users } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';

function AdminContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession();
  const { tenant, fetchTenant } = useTenant();
  const { recentReservations, fetchRecentReservations } =
    useRecentReservations();
  const { unassignedReservations, fetchUnassignedReservations } =
    useUnassignedReservations();
  const { staffMembers, fetchStaffMembers } = useStaffMembers();
  const [loading, setLoading] = useState(true);

  const handleAssignStaff = async (reservationId: string, staffId: string) => {
    if (!session?.user?.tenant_id) throw new Error('テナントIDが未設定です');

    const result = await adminApi.assignStaffToReservation(reservationId, staffId, session.user.tenant_id);

    if (!result.success) {
      throw new Error(result.error || 'スタッフの設定に失敗しました');
    }
  };

  const handleRemoveStaff = async (reservationId: string) => {
    if (!session?.user?.tenant_id) throw new Error('テナントIDが未設定です');

    const result = await adminApi.assignStaffToReservation(reservationId, null, session.user.tenant_id);

    if (!result.success) {
      throw new Error(result.error || 'スタッフの解除に失敗しました');
    }
  };

  const handleAdminNoteUpdate = async (
    reservationId: string,
    adminNote: string
  ) => {
    if (!session?.user?.tenant_id) throw new Error('テナントIDが未設定です');

    const result = await adminApi.updateReservationAdminNote(reservationId, adminNote, session.user.tenant_id);

    if (!result.success) {
      throw new Error(result.error || '管理者メモの更新に失敗しました');
    }

    // データを再取得して画面を更新
    await fetchRecentReservations(5);
  };

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      const fetchData = async () => {
        await Promise.all([
          fetchTenant(),
          fetchRecentReservations(5),
          fetchUnassignedReservations(),
          fetchStaffMembers(),
        ]);
        setLoading(false);
      };
      fetchData();
    }
  }, [
    isAuthenticated,
    session,
    fetchTenant,
    fetchRecentReservations,
    fetchUnassignedReservations,
    fetchStaffMembers,
  ]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthGuard isLoading={isLoading} isAuthenticated={isAuthenticated}>
      <AdminLayout
        title={UI_TEXT.ADMIN_DASHBOARD}
        description={UI_TEXT.SYSTEM_ACCESS_DESCRIPTION}
        user={session?.user}
        tenant={tenant}
      >
        <DashboardGrid />
        {unassignedReservations.length > 0 && (
          <div className="mt-8">
            <UnassignedReservations
              reservations={unassignedReservations}
              staffMembers={staffMembers}
              tenantId={session?.user?.tenant_id || ''}
              onAssignStaff={handleAssignStaff}
              onRemoveStaff={handleRemoveStaff}
            />
          </div>
        )}
        <RecentReservations
          reservations={recentReservations}
          onAdminNoteUpdate={handleAdminNoteUpdate}
        />
      </AdminLayout>
    </AuthGuard>
  );
}

function DashboardGrid() {
  const dashboardCards = [
    {
      href: ROUTES.ADMIN.RESERVATIONS,
      title: UI_TEXT.RESERVATION_MANAGEMENT,
      description: UI_TEXT.RESERVATION_CONFIRM_DELETE,
      bgColor: 'bg-primary',
      icon: (
        <CalendarCheck
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        />
      ),
    },
    {
      href: ROUTES.ADMIN.BUSINESS_HOURS,
      title: UI_TEXT.BUSINESS_HOURS_MANAGEMENT,
      description: UI_TEXT.BUSINESS_HOURS_SETTINGS,
      bgColor: 'bg-primary',
      icon: (
        <Clock
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        />
      ),
    },
    {
      href: ROUTES.ADMIN.STAFF,
      title: UI_TEXT.STAFF_MANAGEMENT,
      description: UI_TEXT.STAFF_INFO_MANAGEMENT,
      bgColor: 'bg-primary',
      icon: (
        <UserCog
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        />
      ),
    },
    {
      href: ROUTES.ADMIN.USERS,
      title: UI_TEXT.USER_MANAGEMENT,
      description: UI_TEXT.USER_INFO_MANAGEMENT,
      bgColor: 'bg-primary',
      icon: (
        <Users
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
      {dashboardCards.map((card) => (
        <DashboardCard key={card.href} {...card} />
      ))}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminContent />
    </Suspense>
  );
}
