"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import type { User, Reservation, StaffMember, ReservationMenu, BusinessHour } from "@/lib/supabase";
import type { TimeSlot } from "@/components/reservation/types";
import type { CreateReservationParams } from "@/components/reservation/ReservationInputForm";
import { StaffSelection } from "@/components/reservation/StaffSelection";
import { ReservationCalendar } from "@/components/reservation/ReservationCalendar";
import { ReservationInputForm } from "@/components/reservation/ReservationInputForm";
import { format as formatTz } from "date-fns-tz";
import { startOfMonth, endOfMonth } from "date-fns";
import { LoadingSpinner, PageLayout } from '@/components/common';
import { calculateMonthlyAvailability } from "@/components/reservation/utils/availabilityCalculator";
import type { DayAvailabilityInfo } from "@/components/reservation/types";
import { userApi, timeSlotsApi, reservationApi, businessHoursApi, reservationMenuApi, staffApi, tenantApi } from "@/lib/api";

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
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [reservationMenu, setReservationMenu] = useState<ReservationMenu | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!urlTenantId || !urlUserId) {
      return;
    }

    const initializeData = async () => {
      // ユーザー情報を設定
      const userData = {
        user_id: urlUserId,
        displayName: urlDisplayName ?? "",
      };
      setUser(userData);

      // 初期データを一括取得
      const result = await fetchInitialData(urlTenantId, urlUserId);
      
      if (!result.success) {
        alert("データの取得に失敗しました");
        window.location.href = "/error?error=invalid_tenant";
        return;
      }

      const { user: dbUserData, tenant, staffMembers, reservationMenu, businessHours } = result.data!;
      
      // 状態を更新
      if (dbUserData) setDbUser(dbUserData);
      if (tenant) setTenant(tenant);
      setStaffMembers(staffMembers);
      setReservationMenu(reservationMenu ?? null);
      setBusinessHours(businessHours);

      // ユーザー予約を取得
      const reservationsResult = await userApi.getUserReservations(urlUserId, urlTenantId);
      if (reservationsResult.success && reservationsResult.data) {
        setUserReservations(reservationsResult.data);
      } else {
        console.error("Error fetching user reservations:", reservationsResult.error);
      }
    };

    initializeData().finally(() => {
      setLoading(false);
    });
  }, [urlTenantId, urlUserId, urlDisplayName]);

  const handleReservationSubmit = async (reservationData: CreateReservationParams) => {
    if (!urlTenantId) {
      return { success: false, error: "テナント情報が不正です" };
    }

    const result = await reservationApi.createReservation(reservationData, urlTenantId);
    
    if (!result.success) {
      console.error("Reservation error:", result.error);
      const errorMessage = result.error || "予約に失敗しました。時間をおいて再度お試しください。";
      alert(errorMessage);
      return { success: false, error: errorMessage };
    }

    alert("予約が完了しました！");
    
    // 予約一覧を再取得
    const reservationsResult = await userApi.getUserReservations(urlUserId!, urlTenantId);
    if (reservationsResult.success && reservationsResult.data) {
      setUserReservations(reservationsResult.data);
    }
    
    return { success: true };
  };

  // 月間の空きスロット計算
  const monthlyAvailabilityInfo = useMemo(() => {
    if (!businessHours.length) return new Map<string, DayAvailabilityInfo>();

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    return calculateMonthlyAvailability(
      monthStart,
      monthEnd,
      businessHours,
      userReservations,
      reservationMenu || undefined,
    );
  }, [currentMonth, businessHours, userReservations, reservationMenu]);

  // 選択された日の時間スロットを取得
  const fetchTimeSlots = async (date: Date, staffId?: string) => {
    if (!urlTenantId) return;
    
    setSlotsLoading(true);
    const result = await timeSlotsApi.getAvailableSlots(date, urlTenantId, staffId);
    
    if (result.success && result.data) {
      setAvailableSlots(result.data);
    } else {
      console.error("Error fetching time slots:", result.error);
      setAvailableSlots([]);
    }
    
    setSlotsLoading(false);
  };

  // 日付選択ハンドラー
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedDateTime(null);
    fetchTimeSlots(date, selectedStaffId);
  };

  // 月変更ハンドラー
  const handleMonthChange = (activeStartDate: Date) => {
    setCurrentMonth(startOfMonth(activeStartDate));
    setSelectedDate(null);
    setSelectedDateTime(null);
    setAvailableSlots([]);
  };

  // スタッフ変更時に時間スロットを再取得
  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate, selectedStaffId);
    }
  }, [selectedStaffId, selectedDate, urlTenantId]);

  // selectedDateTimeからselectedDateを復元
  useEffect(() => {
    if (selectedDateTime && !selectedDate) {
      const date = new Date(selectedDateTime);
      setSelectedDate(date);
    }
  }, [selectedDateTime, selectedDate]);

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

        {/* 予約コンポーネント群 */}
        {
          user && (
            <div className="space-y-8">
              {/* スタッフ選択 */}
              <StaffSelection
                staffMembers={staffMembers}
                selectedStaffId={selectedStaffId}
                onStaffSelect={setSelectedStaffId}
              />

              {/* メニュー情報表示 */}
              {reservationMenu && (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    {reservationMenu.name}
                  </h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>所要時間: {reservationMenu.duration_minutes}分</p>
                    <p>
                      開始可能時間: 毎時
                      {reservationMenu.start_minutes_options.map((min, index) => (
                        <span key={min}>
                          {index > 0 && "、"}
                          {min.toString().padStart(2, "0")}分
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              )}

              {/* カレンダー */}
              <ReservationCalendar
                reservationMenu={reservationMenu}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                currentMonth={currentMonth}
                onMonthChange={handleMonthChange}
                monthlyAvailabilityInfo={monthlyAvailabilityInfo}
                availableSlots={availableSlots}
                selectedDateTime={selectedDateTime}
                onDateTimeSelect={setSelectedDateTime}
                slotsLoading={slotsLoading}
              />

              {/* 予約入力フォーム */}
              <ReservationInputForm
                initialUser={{
                  user_id: user.user_id,
                  name: dbUser?.name || user.displayName,
                  phone: dbUser?.phone,
                  member_type: dbUser?.member_type || "guest",
                }}
                selectedDateTime={selectedDateTime}
                reservationMenu={reservationMenu}
                selectedStaffId={selectedStaffId}
                onSubmit={handleReservationSubmit}
                submitting={submitting}
                onSubmittingChange={setSubmitting}
              />
            </div>
          )
        }
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

export const fetchInitialData = async (tenantId: string, userId: string) => {
  const [
    userResult,
    tenantResult,
    staffResult,
    menuResult,
    businessHoursResult,
  ] = await Promise.all([
    userApi.getUser(userId, tenantId),
    tenantApi.getTenant(tenantId),
    staffApi.getStaffMembers(tenantId),
    reservationMenuApi.getReservationMenu(tenantId),
    businessHoursApi.getBusinessHours(tenantId),
  ]);

  // Check if any critical API calls failed
  const criticalErrors = [];
  if (!tenantResult.success) criticalErrors.push(`Tenant: ${tenantResult.error}`);
  
  if (criticalErrors.length > 0) {
    return {
      success: false,
      error: criticalErrors.join(", "),
    };
  }

  return {
    success: true,
    data: {
      user: userResult.data,
      tenant: tenantResult.data,
      staffMembers: staffResult.data || [],
      reservationMenu: menuResult.data,
      businessHours: businessHoursResult.data || [],
    },
  };
}