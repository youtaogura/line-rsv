'use client';

import { MonthlyAvailability } from '@/app/api/availability/monthly/route';
import { ReservationList } from '@/components/admin/ReservationList';
import {
  AdminLayout,
  AuthGuard,
  LoadingSpinner,
  ViewModeToggle,
} from '@/components/common';
import { AdminReservationCalendar } from '@/components/reservation/AdminReservationCalendar';
import { UI_TEXT } from '@/constants/ui';
import {
  useAdminSession,
  useBusinessHours,
  useReservations,
  useStaffMemberBusinessHours,
  useStaffMembers,
  useUsers,
} from '@/hooks/useAdminData';
import { availabilityApi } from '@/lib/api/availability';
import type { ReservationData, ReservationMenuSimple } from '@/lib/supabase';
import { buildApiUrl } from '@/lib/tenant-helpers';
import { Suspense, useEffect, useMemo, useState } from 'react';

function ReservationsContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession();
  const { reservations, loading, fetchReservations, deleteReservation } =
    useReservations();
  const { users, fetchUsers } = useUsers();
  const { staffMembers, fetchStaffMembers } = useStaffMembers();
  const { businessHours, fetchBusinessHours } = useBusinessHours();
  const { businessHours: staffBusinessHours, fetchStaffMemberBusinessHours } =
    useStaffMemberBusinessHours();
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [monthlyAvailability, setMonthlyAvailability] =
    useState<MonthlyAvailability | null>(null);
  const [reservationMenu] = useState<ReservationMenuSimple | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const selectedStaffReservations = useMemo(() => {
    if (selectedStaffId === 'all') {
      return reservations;
    }
    if (selectedStaffId === 'unassigned') {
      return reservations.filter((reservation) => !reservation.staff_member_id);
    }
    return reservations.filter(
      (reservation) => reservation.staff_member_id === selectedStaffId
    );
  }, [reservations, selectedStaffId]);

  const businessDaysSet = useMemo(() => {
    if (selectedStaffId === 'all' || selectedStaffId === 'unassigned') {
      return new Set(businessHours.map((hour) => hour.day_of_week));
    }
    return new Set(staffBusinessHours.map((hour) => hour.day_of_week));
  }, [selectedStaffId, businessHours, staffBusinessHours]);

  useEffect(() => {
    if (
      selectedStaffId &&
      selectedStaffId !== 'all' &&
      selectedStaffId !== 'unassigned'
    ) {
      fetchStaffMemberBusinessHours(selectedStaffId);
    }
  }, [selectedStaffId, fetchStaffMemberBusinessHours]);

  useEffect(() => {
    if (staffMembers.length > 0) {
      setSelectedStaffId(staffMembers.length > 1 ? 'all' : staffMembers[0].id);
    }
  }, [staffMembers]);

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetchUsers();
      fetchStaffMembers();
      fetchBusinessHours();
    }
  }, [
    isAuthenticated,
    session,
    fetchUsers,
    fetchStaffMembers,
    fetchBusinessHours,
  ]);

  // 月間カレンダー用の利用可能性データを取得
  useEffect(() => {
    if (
      isAuthenticated &&
      session?.user?.tenant_id &&
      viewMode === 'calendar'
    ) {
      const currentDate = new Date(currentMonth);
      availabilityApi
        .getMonthlyAvailability(
          session.user.tenant_id,
          currentDate.getFullYear(),
          currentDate.getMonth()
        )
        .then((response) => {
          setMonthlyAvailability(response.data ?? null);
        })
        .catch(console.error);
    }
  }, [isAuthenticated, session, viewMode, currentMonth]);

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      const staffIdForApi =
        selectedStaffId === 'all' || selectedStaffId === 'unassigned'
          ? 'all'
          : selectedStaffId;
      if (viewMode === 'table') {
        // 月の開始と終了日を計算
        const monthStart = `${currentMonth}-01T00:00:00`;
        const nextMonth = new Date(currentMonth + '-01');
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const monthEnd = nextMonth.toISOString().substring(0, 10) + 'T23:59:59';
        fetchReservations(
          session.user.tenant_id,
          staffIdForApi,
          monthStart,
          monthEnd
        );
      } else {
        fetchReservations(session.user.tenant_id, staffIdForApi);
      }
    }
  }, [
    isAuthenticated,
    session,
    selectedStaffId,
    currentMonth,
    viewMode,
    fetchReservations,
  ]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const handleCreateReservation = () => {
    // 予約作成後はリストを再取得
    const staffIdForApi =
      selectedStaffId === 'all' || selectedStaffId === 'unassigned'
        ? 'all'
        : selectedStaffId;
    if (viewMode === 'table') {
      const monthStart = `${currentMonth}-01T00:00:00`;
      const nextMonth = new Date(currentMonth + '-01');
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const monthEnd = nextMonth.toISOString().substring(0, 10) + 'T23:59:59';
      fetchReservations(
        session.user.tenant_id,
        staffIdForApi,
        monthStart,
        monthEnd
      );
    } else {
      fetchReservations(session.user.tenant_id, staffIdForApi);
    }
  };

  const handleCreateReservationData = async (
    reservationData: ReservationData
  ) => {
    if (!session?.user?.tenant_id) throw new Error('テナントIDが未設定です');

    const response = await fetch(
      buildApiUrl('/api/reservations', session.user.tenant_id),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '予約の作成に失敗しました');
    }

    return result;
  };

  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
  };

  const viewModes = [
    { key: 'calendar', label: 'カレンダー表示' },
    { key: 'table', label: '一覧表示' },
  ];

  return (
    <AuthGuard isLoading={isLoading} isAuthenticated={isAuthenticated}>
      <AdminLayout
        title={UI_TEXT.RESERVATION_MANAGEMENT}
        description="予約の確認と管理ができます"
        user={session?.user}
        showBackButton={true}
      >
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <ViewModeToggle
              currentMode={viewMode}
              modes={viewModes}
              onModeChange={(mode) => setViewMode(mode as 'calendar' | 'table')}
            />
          </div>

          {/* スタッフフィルタ */}
          {staffMembers && staffMembers.length > 1 && (
            <div className="bg-white p-4 rounded-xs shadow">
              <div className="flex items-center space-x-4">
                <label
                  htmlFor="staff-filter"
                  className="block text-sm font-medium text-gray-700"
                >
                  担当スタッフでフィルタ:
                </label>
                <select
                  id="staff-filter"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="block w-auto rounded-xs border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {staffMembers.length > 1 && (
                    <>
                      <option value="all">全員</option>
                      <option value="unassigned">担当なし</option>
                    </>
                  )}
                  {staffMembers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {viewMode === 'calendar' && (
          <AdminReservationCalendar
            tenantId={session?.user?.tenant_id || null}
            reservations={selectedStaffReservations}
            onDeleteReservation={deleteReservation}
            onCreateReservation={handleCreateReservation}
            availableUsers={users}
            selectedStaffId={selectedStaffId}
            businessDaysSet={businessDaysSet}
            monthlyAvailability={monthlyAvailability}
            reservationMenu={reservationMenu}
            onCreateReservationData={handleCreateReservationData}
            onMonthChange={handleMonthChange}
          />
        )}

        {viewMode === 'table' && (
          <ReservationList
            tenantId={session?.user?.tenant_id || null}
            reservations={reservations}
            onDeleteReservation={deleteReservation}
            selectedStaffId={selectedStaffId}
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
          />
        )}
      </AdminLayout>
    </AuthGuard>
  );
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ReservationsContent />
    </Suspense>
  );
}
