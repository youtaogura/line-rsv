'use client';

import { MonthlyAvailability } from '@/app/api/admin/availability/monthly/route';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { RecentReservations } from '@/components/admin/RecentReservations';
import { UnassignedReservations } from '@/components/admin/UnassignedReservations';
import { AdminLayout, AuthGuard, LoadingSpinner } from '@/components/common';
import { ReservationDetailModal } from '@/components/common/ReservationDetailModal';
import { ROUTES } from '@/constants/routes';
import { UI_TEXT } from '@/constants/ui';
import {
  useAdminRecentReservations,
  useAdminSession,
  useAdminStaffMembers,
  useAdminTenant,
  useAdminUnassignedReservations,
} from '@/hooks/admin';
import { adminApi } from '@/lib/api';
import { ReservationWithStaff } from '@/lib/types/reservation';
import { format } from 'date-fns';
import { CalendarCheck, Clock, UserCog, Users } from 'lucide-react';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

function AdminContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession();
  const { tenant, fetchTenant } = useAdminTenant();
  const { recentReservations, fetchRecentReservations } =
    useAdminRecentReservations();
  const { unassignedReservations, fetchUnassignedReservations } =
    useAdminUnassignedReservations();
  const { staffMembers, fetchStaffMembers } = useAdminStaffMembers();
  const [loading, setLoading] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationWithStaff | null>(null);
  const [monthlyAvailabilityMap, setMonthlyAvailabilityMap] = useState<
    Map<string, MonthlyAvailability>
  >(new Map());

  const handleAdminNoteUpdate = async (
    reservationId: string,
    adminNote: string
  ) => {
    if (!session?.user?.tenant_id) throw new Error('テナントIDが未設定です');

    const result = await adminApi.updateReservationAdminNote(
      reservationId,
      adminNote
    );

    if (!result.success) {
      throw new Error(result.error || '管理者メモの更新に失敗しました');
    }

    // データを再取得して画面を更新
    await fetchRecentReservations(5);
  };

  const handleReservationClick = (reservation: ReservationWithStaff) => {
    const date = new Date(reservation.datetime);
    const month = format(date, 'yyyy-MM');
    if (monthlyAvailabilityMap.has(month)) {
      setSelectedReservation(reservation);
      setIsDetailModalOpen(true);
      return;
    }
    fetchMonthlyAvailability(date).then(() => {
      setSelectedReservation(reservation);
      setIsDetailModalOpen(true);
    });
  };

  const fetchMonthlyAvailability = useCallback((date: Date) => {
    return adminApi
      .getMonthlyAvailability(date.getFullYear(), date.getMonth())
      .then((response) => {
        if (!response.data) {
          alert('スタッフの空き情報の取得に失敗しました。');
          throw response.error;
        }
        setMonthlyAvailabilityMap(
          monthlyAvailabilityMap.set(format(date, 'yyyy-MM'), response.data)
        );
      })
      .catch(console.error);
  }, []);

  const handleStaffAssignment = async (
    reservationId: string,
    staffId: string
  ) => {
    if (!session?.user?.tenant_id) throw new Error('テナントIDが未設定です');

    const result = await adminApi.assignStaffToReservation(
      reservationId,
      staffId
    );

    if (!result.success) {
      throw new Error(result.error || 'スタッフの設定に失敗しました');
    }

    // データを再取得して画面を更新
    await fetchRecentReservations(5);
    await fetchUnassignedReservations();
  };

  const monthlyAvailability = useMemo(() => {
    if (!selectedReservation) {
      return null;
    }
    return monthlyAvailabilityMap.get(
      format(new Date(selectedReservation.datetime), 'yyyy-MM')
    );
  }, [monthlyAvailabilityMap, selectedReservation]);

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      const fetchData = async () => {
        await Promise.all([
          fetchTenant(),
          fetchRecentReservations(5),
          fetchUnassignedReservations(),
          fetchStaffMembers(),
          fetchMonthlyAvailability(new Date()),
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
    fetchMonthlyAvailability,
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
              onReservationClick={handleReservationClick}
            />
          </div>
        )}
        <RecentReservations
          reservations={recentReservations}
          onReservationClick={handleReservationClick}
        />

        {/* 予約詳細モーダル */}
        {selectedReservation && (
          <ReservationDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedReservation(null);
            }}
            reservation={selectedReservation}
            monthlyAvailability={monthlyAvailability}
            staffMembers={staffMembers}
            onAdminNoteUpdate={handleAdminNoteUpdate}
            onStaffAssignment={handleStaffAssignment}
          />
        )}
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
