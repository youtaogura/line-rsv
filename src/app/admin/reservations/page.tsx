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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UI_TEXT } from '@/constants/ui';
import {
  useAdminSession,
  useBusinessHours,
  useReservations,
  useStaffMemberBusinessHours,
  useStaffMembers,
  useTenant,
  useUsers,
} from '@/hooks/useAdminData';
import { availabilityApi } from '@/lib/api/availability';
import type { ReservationData, ReservationMenuSimple } from '@/lib/supabase';
import { buildApiUrl } from '@/lib/tenant-helpers';
import { Suspense, useEffect, useMemo, useState } from 'react';

function ReservationsContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession();
  const { tenant, fetchTenant } = useTenant();
  const { reservations, loading, fetchReservations, deleteReservation } =
    useReservations();
  const { users, fetchUsers } = useUsers();
  const { staffMembers, fetchStaffMembers } = useStaffMembers();
  const { businessHours, fetchBusinessHours } = useBusinessHours();
  const { businessHours: staffBusinessHours, fetchStaffMemberBusinessHours } =
    useStaffMemberBusinessHours();
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      return (
        (localStorage.getItem('reservationViewMode') as 'calendar' | 'table') ||
        'calendar'
      );
    }
    return 'calendar';
  });
  const [monthlyAvailability, setMonthlyAvailability] =
    useState<MonthlyAvailability | null>(null);
  const [reservationMenu] = useState<ReservationMenuSimple | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedStaffId') || '';
    }
    return '';
  });
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reservationsOnlySelected, setReservationsOnlySelected] =
    useState(false);

  const handleAdminNoteUpdate = async (
    reservationId: string,
    adminNote: string
  ) => {
    if (!session?.user?.tenant_id) throw new Error('テナントIDが未設定です');

    const response = await fetch(
      buildApiUrl(
        `/api/reservations?id=${reservationId}`,
        session.user.tenant_id
      ),
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_note: adminNote,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '管理者メモの更新に失敗しました');
    }

    // データを再取得して画面を更新
    if (session?.user?.tenant_id) {
      await fetchReservations(session.user.tenant_id);
    }
  };

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
      const savedStaffId = localStorage.getItem('selectedStaffId');
      
      // 保存されたスタッフIDが有効かチェック
      const isValidStaffId = savedStaffId && (
        savedStaffId === 'all' || 
        savedStaffId === 'unassigned' || 
        staffMembers.some(staff => staff.id === savedStaffId)
      );
      
      if (isValidStaffId) {
        setSelectedStaffId(savedStaffId);
      } else {
        // 保存されたIDが無効な場合はデフォルトを設定
        const defaultStaffId = staffMembers.length > 1 ? 'all' : staffMembers[0].id;
        setSelectedStaffId(defaultStaffId);
        localStorage.setItem('selectedStaffId', defaultStaffId);
      }
    }
  }, [staffMembers]);

  // selectedStaffIdが変更されたときにローカルストレージに保存
  useEffect(() => {
    if (selectedStaffId) {
      localStorage.setItem('selectedStaffId', selectedStaffId);
    }
  }, [selectedStaffId]);

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetchUsers();
      fetchStaffMembers();
      fetchBusinessHours();
      fetchTenant();
    }
  }, [
    isAuthenticated,
    session,
    fetchUsers,
    fetchStaffMembers,
    fetchBusinessHours,
    fetchTenant,
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
        tenant={tenant}
        showBackButton={true}
        backUrl="/admin"
      >
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <ViewModeToggle
              currentMode={viewMode}
              modes={viewModes}
              onModeChange={(mode) => {
                const newMode = mode as 'calendar' | 'table';
                setViewMode(newMode);
                localStorage.setItem('reservationViewMode', newMode);
              }}
            />
          </div>

          <div className="flex flex-col space-y-2 mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              予約カレンダー
            </h3>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">担当:</label>
              <Select
                value={selectedStaffId}
                onValueChange={setSelectedStaffId}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="スタッフを選択" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.length > 1 && (
                    <>
                      <SelectItem value="all">全員</SelectItem>
                      <SelectItem value="unassigned">担当なし</SelectItem>
                    </>
                  )}
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {viewMode === 'calendar' &&
              selectedStaffId &&
              selectedStaffId !== 'all' &&
              selectedStaffId !== 'unassigned' && (
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={reservationsOnlySelected}
                    onCheckedChange={setReservationsOnlySelected}
                    id="reservations-only-toggle"
                  />
                  <label
                    htmlFor="reservations-only-toggle"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    予約だけ表示
                  </label>
                </div>
              )}
          </div>
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
            reservationsOnlySelected={reservationsOnlySelected}
            onCreateReservationData={handleCreateReservationData}
            onMonthChange={handleMonthChange}
            onAdminNoteUpdate={handleAdminNoteUpdate}
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
            onAdminNoteUpdate={handleAdminNoteUpdate}
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
