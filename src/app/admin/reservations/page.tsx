"use client";

import { useState, Suspense, useEffect, useMemo } from "react";
import {
  useReservations,
  useAdminSession,
  useUsers,
  useStaffMembers,
  useBusinessHours,
  useStaffMemberBusinessHours,
} from "@/hooks/useAdminData";
import { AdminReservationCalendar } from "@/components/reservation/AdminReservationCalendar";
import { ReservationList } from "@/components/admin/ReservationList";
import { AuthGuard, AdminLayout, LoadingSpinner, ViewModeToggle } from '@/components/common';
import { UI_TEXT } from '@/constants/ui';

function ReservationsContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession();
  const { reservations, loading, fetchReservations, deleteReservation } =
    useReservations();
  const { users, fetchUsers } = useUsers();
  const { staffMembers, fetchStaffMembers } = useStaffMembers();
  const { businessHours, fetchBusinessHours } = useBusinessHours();
  const { businessHours: staffBusinessHours, fetchStaffMemberBusinessHours } = useStaffMemberBusinessHours();
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const selectedStaffReservations = useMemo(() => {
    if (selectedStaffId === "all") {
      return reservations;
    }
    if (selectedStaffId === "unassigned") {
      return reservations.filter((reservation) => !reservation.staff_member_id);
    }
    return reservations.filter((reservation) => reservation.staff_member_id === selectedStaffId);
  }, [reservations, selectedStaffId]);

  const businessDaysSet = useMemo(() => {
    if (selectedStaffId === "all" || selectedStaffId === "unassigned") {
      return new Set(businessHours.map((hour) => hour.day_of_week));
    }
    return new Set(staffBusinessHours.map((hour) => hour.day_of_week));
  }, [selectedStaffId, businessHours, staffBusinessHours]);

  useEffect(() => {
    if (selectedStaffId && selectedStaffId !== "all" && selectedStaffId !== "unassigned") {
      fetchStaffMemberBusinessHours(selectedStaffId);
    }
  }, [selectedStaffId, fetchStaffMemberBusinessHours]);

  useEffect(() => {
    if (staffMembers.length > 0) {
      setSelectedStaffId(staffMembers.length > 1 ? "all" : staffMembers[0].id);
    }
  }, [staffMembers])

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetchUsers();
      fetchStaffMembers();
      fetchBusinessHours();
    }
  }, [isAuthenticated, session, fetchUsers, fetchStaffMembers, fetchBusinessHours]);

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      const staffIdForApi =
        selectedStaffId === "all" || selectedStaffId === "unassigned"
          ? "all"
          : selectedStaffId;
      if (viewMode === "table") {
        // 月の開始と終了日を計算
        const monthStart = `${currentMonth}-01T00:00:00`;
        const nextMonth = new Date(currentMonth + "-01");
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const monthEnd = nextMonth.toISOString().substring(0, 10) + "T23:59:59";
        fetchReservations(session.user.tenant_id, staffIdForApi, monthStart, monthEnd);
      } else {
        fetchReservations(session.user.tenant_id, staffIdForApi);
      }
    }
  }, [isAuthenticated, session, selectedStaffId, currentMonth, viewMode, fetchReservations]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const handleCreateReservation = () => {
    // 予約作成後はリストを再取得
    const staffIdForApi = selectedStaffId === "all" || selectedStaffId === "unassigned" ? "all" : selectedStaffId;
    if (viewMode === "table") {
      const monthStart = `${currentMonth}-01T00:00:00`;
      const nextMonth = new Date(currentMonth + "-01");
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const monthEnd = nextMonth.toISOString().substring(0, 10) + "T23:59:59";
      fetchReservations(session.user.tenant_id, staffIdForApi, monthStart, monthEnd);
    } else {
      fetchReservations(session.user.tenant_id, staffIdForApi);
    }
  };

  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
  };

  const viewModes = [
    { key: 'calendar', label: 'カレンダー表示' },
    { key: 'table', label: 'テーブル表示' },
  ];

  return (
    <AuthGuard
      isLoading={isLoading}
      isAuthenticated={isAuthenticated}
    >
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
              onModeChange={(mode) => setViewMode(mode as "calendar" | "table")}
            />
          </div>
          
          {/* スタッフフィルタ */}
          {staffMembers && staffMembers.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center space-x-4">
                <label htmlFor="staff-filter" className="block text-sm font-medium text-gray-700">
                  担当スタッフでフィルタ:
                </label>
                <select
                  id="staff-filter"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="block w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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

        {viewMode === "calendar" && (
          <AdminReservationCalendar
            tenantId={session?.user?.tenant_id || null}
            reservations={selectedStaffReservations}
            onDeleteReservation={deleteReservation}
            onCreateReservation={handleCreateReservation}
            availableUsers={users}
            selectedStaffId={selectedStaffId}
            businessDaysSet={businessDaysSet}
          />
        )}

        {viewMode === "table" && (
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
