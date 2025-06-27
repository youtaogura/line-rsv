"use client";

import { useState, Suspense, useEffect } from "react";
import {
  useReservations,
  useAdminSession,
  useUsers,
} from "@/hooks/useAdminData";
import { formatDateTime } from "@/lib/admin-types";
import { AdminReservationCalendar } from "@/components/reservation/AdminReservationCalendar";
import { ReservationList } from "@/components/admin/ReservationList";
import { AuthGuard, AdminLayout, LoadingSpinner, ViewModeToggle } from '@/components/common';
import { UI_TEXT } from '@/constants/ui';

function ReservationsContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession();
  const { reservations, loading, fetchReservations, deleteReservation } =
    useReservations();
  const { users, fetchUsers } = useUsers();
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetchReservations();
      fetchUsers();
    }
  }, [isAuthenticated, session, fetchReservations, fetchUsers]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const handleCreateReservation = () => {
    // 予約作成後はリストを再取得
    fetchReservations();
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
        <div className="mb-6 flex justify-between items-center">
          <ViewModeToggle
            currentMode={viewMode}
            modes={viewModes}
            onModeChange={(mode) => setViewMode(mode as "calendar" | "table")}
          />
        </div>

        {viewMode === "calendar" && (
          <AdminReservationCalendar
            tenantId={session?.user?.tenant_id || null}
            reservations={reservations}
            onDeleteReservation={deleteReservation}
            onCreateReservation={handleCreateReservation}
            availableUsers={users}
          />
        )}

        {viewMode === "table" && (
          <ReservationList
            reservations={reservations}
            onDeleteReservation={deleteReservation}
            formatDateTime={formatDateTime}
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
