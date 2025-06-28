"use client";

import { useState, Suspense, useEffect, useMemo } from "react";
import {
  useReservations,
  useAdminSession,
  useUsers,
  useStaffMembers,
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
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const selectedStaffReservations = useMemo(() => {
    return reservations.filter((reservation) => reservation.staff_member_id === selectedStaffId);
  }, [reservations, selectedStaffId]);

  useEffect(() => {
    if (staffMembers.length > 0) {
      setSelectedStaffId(staffMembers[0].id);
    }
  }, [staffMembers])

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetchUsers();
      fetchStaffMembers();
    }
  }, [isAuthenticated, session, fetchUsers, fetchStaffMembers]);

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetchReservations(session.user.tenant_id, selectedStaffId);
    }
  }, [isAuthenticated, session, selectedStaffId, fetchReservations]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const handleCreateReservation = () => {
    // 予約作成後はリストを再取得
    fetchReservations(session.user.tenant_id, selectedStaffId);
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
        showBackToAdmin={true}
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
          {staffMembers && staffMembers.length > 1 && (
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center space-x-4">
                <label htmlFor="staff-filter" className="block text-sm font-medium text-gray-700">
                  担当スタッフでフィルタ:
                </label>
                <select
                  id="staff-filter"
                  value={selectedStaffId}
                  defaultValue={staffMembers[0]?.id}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="block w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
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
          />
        )}

        {viewMode === "table" && (
          <ReservationList
            tenantId={session?.user?.tenant_id || null}
            reservations={reservations}
            onDeleteReservation={deleteReservation}
            selectedStaffId={selectedStaffId}
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
