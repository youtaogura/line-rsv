"use client";

import { useState, useEffect, Suspense } from "react";
import type { User, Reservation } from "@/lib/supabase";
import { buildApiUrl } from "@/lib/tenant-helpers";
import { ReservationForm } from "@/components/reservation/ReservationForm";
import { format as formatTz } from "date-fns-tz";
import { LoadingSpinner, PageLayout } from '@/components/common';

function ReserveContent() {
  const [urlUserId, setUrlUserId] = useState<string | null>(null);
  const [urlDisplayName, setUrlDisplayName] = useState<string | null>(null);
  const [urlTenantId, setUrlTenantId] = useState<string | null>(null);

  useEffect(() => {
    const storedParams = sessionStorage.getItem("reserveParams");
    if (storedParams) {
      const params = JSON.parse(storedParams);
      setUrlUserId(params.userId);
      setUrlDisplayName(params.displayName);
      setUrlTenantId(params.tenantId);
      // 使用後はsession storageをクリア
      if (process.env.NODE_ENV !== "development") {
        sessionStorage.removeItem("reserveParams");
      }
    }
  }, []);

  const [tenant, setTenant] = useState<{
    tenant_id: string;
    name: string;
  } | null>(null);
  const [user, setUser] = useState<{
    user_id: string;
    displayName: string;
    pictureUrl?: string;
  } | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [_reservationsLoading, setReservationsLoading] = useState(false);

  useEffect(() => {
    if (!urlTenantId || !urlUserId) {
      return;
    }

    const initializeUser = async () => {
      const userData = {
        user_id: urlUserId,
        displayName: urlDisplayName ?? "",
      };
      setUser(userData);

      // ユーザー情報をAPIから取得
      try {
        const userResponse = await fetch(
          buildApiUrl(`/api/users/${urlUserId}`, urlTenantId),
        );
        if (userResponse.ok) {
          const existingUser = await userResponse.json();
          setDbUser(existingUser);
        }
      } catch (error) {
        console.error("Error fetching user from API:", error);
      }
    };

    const initializeTenant = async () => {
      try {
        const tenantResponse = await fetch(
          buildApiUrl(`/api/tenants/${urlTenantId}`, urlTenantId),
        );
        if (tenantResponse.ok) {
          const existingTenant = await tenantResponse.json();
          setTenant(existingTenant);
        } else {
          setTenant({ tenant_id: urlTenantId, name: urlDisplayName ?? "" });
        }
      } catch (error) {
        console.error("Error fetching tenant from API:", error);
        setTenant({ tenant_id: urlTenantId, name: urlDisplayName ?? "" });
      }
    };

    const fetchUserReservations = async () => {
      setReservationsLoading(true);
      try {
        const response = await fetch(
          buildApiUrl(`/api/reservations?user_id=${urlUserId}`, urlTenantId),
        );
        if (response.ok) {
          const reservations = await response.json();
          setUserReservations(reservations);
        } else {
          console.error("Failed to fetch user reservations");
        }
      } catch (error) {
        console.error("Error fetching user reservations:", error);
      } finally {
        setReservationsLoading(false);
      }
    };

    Promise.all([
      initializeUser(),
      initializeTenant(),
      fetchUserReservations(),
    ]).finally(() => {
      setLoading(false);
    });
  }, [urlTenantId, urlUserId, urlDisplayName]);

  const handleReservationSuccess = async () => {
    // 予約成功後の処理 - 予約一覧を再取得
    try {
      const response = await fetch(
        buildApiUrl(`/api/reservations?user_id=${urlUserId}`, urlTenantId),
      );
      if (response.ok) {
        const reservations = await response.json();
        setUserReservations(reservations);
      }
    } catch (error) {
      console.error("Error refreshing reservations:", error);
    }
  };

  if (!tenant || loading) {
    return <LoadingSpinner />;
  }

  return (
    <PageLayout className="py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          {tenant?.name} レッスン予約
        </h1>

        {/* 既存予約一覧 */}
        {userReservations.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              あなたの予約一覧
            </h2>
            <div className="space-y-3">
              {userReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-blue-900">
                      {formatTz(
                        new Date(reservation.datetime),
                        "yyyy年M月d日 HH:mm",
                        { timeZone: "Asia/Tokyo" },
                      )}
                    </div>
                    {reservation.note && (
                      <div className="text-sm text-blue-700 mt-1">
                        メモ: {reservation.note}
                      </div>
                    )}
                  </div>
                  <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                    予約済み
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ReservationFormコンポーネントを使用 */}
        <ReservationForm
          tenantId={urlTenantId || ""}
          isAdminMode={false}
          initialUser={
            user
              ? {
                  user_id: user.user_id,
                  name: dbUser?.name || user.displayName,
                  phone: dbUser?.phone,
                  member_type: dbUser?.member_type || "guest",
                }
              : undefined
          }
          onSuccess={handleReservationSuccess}
          tenantName={tenant?.name}
        />
      </div>
    </PageLayout>
  );
}

export default function ReservePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ReserveContent />
    </Suspense>
  );
}
