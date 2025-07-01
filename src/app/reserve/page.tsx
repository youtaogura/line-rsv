'use client';

import { LoadingSpinner, PageLayout } from '@/components/common';
import { ReservationCalendar } from '@/components/reservation/ReservationCalendar';
import type { CreateReservationParams } from '@/components/reservation/ReservationInputForm';
import { ReservationInputForm } from '@/components/reservation/ReservationInputForm';
import { StaffSelection } from '@/components/reservation/StaffSelection';
import {
  availabilityApi,
  businessHoursApi,
  reservationApi,
  reservationMenuApi,
  staffApi,
  tenantApi,
  userApi,
} from '@/lib/api';
import type {
  BusinessHour,
  Reservation,
  ReservationMenu,
  StaffMember,
  StaffMemberBusinessHour,
  User,
} from '@/lib/supabase';
import { startOfMonth } from 'date-fns';
import { format as formatTz } from 'date-fns-tz';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { MonthlyAvailability } from '../api/public/availability/monthly/route';

function ReserveContent() {
  const [urlUserId, setUrlUserId] = useState<string | null>(null);
  const [urlDisplayName, setUrlDisplayName] = useState<string | null>(null);
  const [urlTenantId, setUrlTenantId] = useState<string | null>(null);

  useEffect(() => {
    const storedParams = sessionStorage.getItem('reserveParams');
    if (storedParams) {
      const params = JSON.parse(storedParams);
      setUrlUserId(params.userId);
      setUrlDisplayName(params.displayName);
      setUrlTenantId(params.tenantId);
      // 使用後はsession storageをクリア
      if (process.env.NODE_ENV !== 'development') {
        sessionStorage.removeItem('reserveParams');
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
  const [reservationMenu, setReservationMenu] =
    useState<ReservationMenu | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [staffBusinessHours, setStaffBusinessHours] = useState<
    StaffMemberBusinessHour[]
  >([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('any');
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date())
  );
  const [monthlyAvailability, setMonthlyAvailability] =
    useState<MonthlyAvailability>();
  const staffId = useMemo(
    () => (selectedStaffId !== 'any' ? selectedStaffId : ''),
    [selectedStaffId]
  );

  useEffect(() => {
    if (!urlTenantId || !urlUserId) {
      return;
    }

    const initializeData = async () => {
      // ユーザー情報を設定
      const userData = {
        user_id: urlUserId,
        displayName: urlDisplayName ?? '',
      };
      setUser(userData);

      // 初期データを一括取得
      const result = await fetchInitialData(urlTenantId, urlUserId);

      if (!result.success) {
        alert('データの取得に失敗しました');
        window.location.href = '/error?error=invalid_tenant';
        return;
      }

      const {
        user: dbUserData,
        tenant,
        staffMembers,
        reservationMenu,
        businessHours,
        staffBusinessHours,
      } = result.data!;

      // 状態を更新
      if (dbUserData) setDbUser(dbUserData);
      if (tenant) setTenant(tenant);
      setStaffMembers(staffMembers);
      setReservationMenu(reservationMenu ?? null);
      setBusinessHours(businessHours || []);
      setStaffBusinessHours(staffBusinessHours || []);

      // ユーザー予約を取得
      const reservationsResult = await userApi.getUserReservations(
        urlUserId,
        urlTenantId
      );
      if (reservationsResult.success && reservationsResult.data) {
        setUserReservations(reservationsResult.data);
      } else {
        console.error(
          'Error fetching user reservations:',
          reservationsResult.error
        );
      }
    };

    initializeData().finally(() => {
      setLoading(false);
    });
  }, [urlTenantId, urlUserId, urlDisplayName]);

  const handleReservationSubmit = async (
    reservationData: CreateReservationParams
  ) => {
    if (!urlTenantId) {
      return { success: false, error: 'テナント情報が不正です' };
    }

    const result = await reservationApi.createReservation(
      reservationData,
      urlTenantId
    );

    if (!result.success) {
      console.error('Reservation error:', result.error);
      const errorMessage =
        result.error || '予約に失敗しました。時間をおいて再度お試しください。';
      alert(errorMessage);
      return { success: false, error: errorMessage };
    }

    alert('予約が完了しました！');

    // 予約一覧を再取得
    const reservationsResult = await userApi.getUserReservations(
      urlUserId!,
      urlTenantId
    );
    if (reservationsResult.success && reservationsResult.data) {
      setUserReservations(reservationsResult.data);
    }

    return { success: true };
  };

  useEffect(() => {
    if (!urlTenantId) return;
    availabilityApi
      .getMonthlyAvailability(
        urlTenantId,
        currentMonth.getFullYear(),
        currentMonth.getMonth()
      )
      .then((response) => {
        setMonthlyAvailability(response.data ?? undefined);
      });
  }, [urlTenantId, currentMonth]);

  // 日付選択ハンドラー
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedDateTime(null);
  };

  // 月変更ハンドラー
  const handleMonthChange = (activeStartDate: Date) => {
    setCurrentMonth(startOfMonth(activeStartDate));
    setSelectedDate(null);
    setSelectedDateTime(null);
  };

  // selectedDateTimeからselectedDateを復元
  useEffect(() => {
    if (selectedDateTime && !selectedDate) {
      const date = new Date(selectedDateTime);
      setSelectedDate(date);
    }
  }, [selectedDateTime, selectedDate]);

  // 営業日のSetを作成（スタッフ選択時はそのスタッフの対応可能日も考慮）
  const businessDaysSet = useMemo(() => {
    if (selectedStaffId && selectedStaffId !== 'any') {
      // 選択されたスタッフの対応可能日を取得
      return new Set(
        staffBusinessHours
          .filter((hour) => hour.staff_member_id === selectedStaffId)
          .map((hour) => hour.day_of_week)
      );
    }
    // スタッフが選択されていない場合はテナントの営業時間を使用
    return new Set(businessHours.map((hour) => hour.day_of_week));
  }, [businessHours, staffBusinessHours, selectedStaffId]);

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
          <div className="mb-8 bg-white rounded-xs shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              あなたの予約一覧
            </h2>
            <div className="space-y-3">
              {userReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xs"
                >
                  <div className="flex-1">
                    <div className="font-medium text-blue-900">
                      {formatTz(
                        new Date(reservation.datetime),
                        'yyyy年M月d日 HH:mm',
                        { timeZone: 'Asia/Tokyo' }
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
        {user && (
          <div className="space-y-8">
            {/* スタッフ選択 */}
            <StaffSelection
              staffMembers={staffMembers}
              selectedStaffId={selectedStaffId}
              onStaffSelect={setSelectedStaffId}
            />

            {/* カレンダー */}
            {monthlyAvailability && (
              <ReservationCalendar
                reservationMenu={reservationMenu}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                currentMonth={currentMonth}
                onMonthChange={handleMonthChange}
                monthlyAvailability={monthlyAvailability}
                selectedDateTime={selectedDateTime}
                onDateTimeSelect={setSelectedDateTime}
                selectedStaffId={staffId}
                businessDaysSet={businessDaysSet}
              />
            )}

            {/* 予約入力フォーム */}
            <ReservationInputForm
              initialUser={{
                user_id: user.user_id,
                name: dbUser?.name || user.displayName,
                phone: dbUser?.phone,
                member_type: dbUser?.member_type || 'guest',
              }}
              selectedDateTime={selectedDateTime}
              reservationMenu={reservationMenu}
              selectedStaffId={staffId}
              onSubmit={handleReservationSubmit}
              submitting={submitting}
              onSubmittingChange={setSubmitting}
            />
          </div>
        )}
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

const fetchInitialData = async (tenantId: string, userId: string) => {
  const [
    userResult,
    tenantResult,
    staffResult,
    menuResult,
    businessHoursResult,
    staffBusinessHoursResult,
  ] = await Promise.all([
    userApi.getUser(userId, tenantId),
    tenantApi.getTenant(tenantId),
    staffApi.getStaffMembers(tenantId),
    reservationMenuApi.getReservationMenu(tenantId),
    businessHoursApi.getBusinessHours(tenantId),
    staffApi.getStaffMemberBusinessHours(tenantId, 'all'),
  ]);

  // Check if any critical API calls failed
  const criticalErrors = [];
  if (!tenantResult.success)
    criticalErrors.push(`Tenant: ${tenantResult.error}`);

  if (criticalErrors.length > 0) {
    return {
      success: false,
      error: criticalErrors.join(', '),
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
      staffBusinessHours: staffBusinessHoursResult.data || [],
    },
  };
};
