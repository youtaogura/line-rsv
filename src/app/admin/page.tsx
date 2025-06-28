"use client";

import { useState, Suspense, useEffect } from "react";
import {
  useAdminSession,
  useTenant,
  useRecentReservations,
} from "@/hooks/useAdminData";
import { AuthGuard, AdminLayout, LoadingSpinner } from '@/components/common';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { RecentReservations } from '@/components/admin/RecentReservations';
import { UI_TEXT } from '@/constants/ui';
import { ROUTES } from '@/constants/routes';

function AdminContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession();
  const { tenant, fetchTenant } = useTenant();
  const { recentReservations, loading: recentLoading, fetchRecentReservations } = useRecentReservations();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      const fetchData = async () => {
        await Promise.all([
          fetchTenant(),
          fetchRecentReservations(5),
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
  ]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthGuard
      isLoading={isLoading}
      isAuthenticated={isAuthenticated}
    >
      <AdminLayout
        title={UI_TEXT.ADMIN_DASHBOARD}
        description={UI_TEXT.SYSTEM_ACCESS_DESCRIPTION}
        user={session?.user}
        tenant={tenant}
      >
        <DashboardGrid />
        <RecentReservations reservations={recentReservations} />
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
      borderColor: 'border-primary',
      bgColor: 'bg-primary',
      icon: (
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      href: ROUTES.ADMIN.BUSINESS_HOURS,
      title: UI_TEXT.BUSINESS_HOURS_MANAGEMENT,
      description: UI_TEXT.BUSINESS_HOURS_SETTINGS,
      borderColor: 'border-success',
      bgColor: 'bg-success',
      icon: (
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      href: "/admin/staff",
      title: "スタッフ管理",
      description: "スタッフの追加・編集・削除と対応時間の設定",
      borderColor: 'border-info',
      bgColor: 'bg-info',
      icon: (
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      href: ROUTES.ADMIN.USERS,
      title: UI_TEXT.USER_MANAGEMENT,
      description: UI_TEXT.USER_INFO_MANAGEMENT,
      borderColor: 'border-warning',
      bgColor: 'bg-warning',
      icon: (
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
