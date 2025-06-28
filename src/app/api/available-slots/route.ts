import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { parseISO } from "date-fns";
import {
  requireValidTenant,
  TenantValidationError,
} from "@/lib/tenant-validation";
import {
  generateTimeSlots,
  updateSlotsWithReservations,
  calculateAvailabilityWithoutStaffSelection,
} from "@/components/reservation/utils/availabilityCalculator";
import type {
  BusinessHour,
  Reservation,
  ReservationMenu,
  StaffMemberBusinessHour,
} from "@/lib/supabase";
import {
  createApiResponse,
  createErrorResponse,
  createValidationErrorResponse,
} from "@/utils/api";

export async function GET(request: NextRequest) {
  try {
    // テナント検証
    let tenant;
    try {
      tenant = await requireValidTenant(request);
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return createValidationErrorResponse({ tenant: error.message });
      }
      throw error;
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const staffMemberId = searchParams.get("staff_member_id");

    if (!date) {
      return createValidationErrorResponse({ date: "Date parameter is required" });
    }

    const targetDate = parseISO(date);

    // 予約メニューを取得（1テナント1メニューの想定）
    const { data: reservationMenus, error: menuError } = await supabase
      .from("reservation_menu")
      .select("*")
      .eq("tenant_id", tenant.id)
      .limit(1);

    if (menuError) {
      console.error("Error fetching reservation menu:", menuError);
      return createErrorResponse("Failed to fetch reservation menu");
    }

    const reservationMenu = reservationMenus?.[0] as
      | ReservationMenu
      | undefined;

    // 営業時間の取得
    let timeSlots = [];
    
    if (staffMemberId) {
      // 特定のスタッフが指定されている場合、そのスタッフの営業時間のみを取得
      const { data: staffBusinessHours, error: staffError } = await supabase
        .from("staff_member_business_hours")
        .select("*")
        .eq("staff_member_id", staffMemberId)
        .eq("is_active", true);

      if (staffError) {
        console.error("Error fetching staff business hours:", staffError);
        return createErrorResponse("Failed to fetch staff business hours");
      }

      if (!staffBusinessHours || staffBusinessHours.length === 0) {
        return createApiResponse([]);
      }

      // スタッフの営業時間でタイムスロットを生成（BusinessHour形式に変換）
      const businessHours = staffBusinessHours.map(sbh => ({
        id: sbh.id,
        tenant_id: tenant.id,
        day_of_week: sbh.day_of_week,
        start_time: sbh.start_time,
        end_time: sbh.end_time,
        is_active: sbh.is_active,
        created_at: sbh.created_at,
      })) as BusinessHour[];

      // その日の予約を取得（指定されたスタッフのみ）
      const { data: reservations, error: reservationsError } = await supabase
        .from("reservations")
        .select("id, datetime, duration_minutes, reservation_menu_id, staff_member_id")
        .eq("tenant_id", tenant.id)
        .eq("staff_member_id", staffMemberId)
        .gte("datetime", `${date}T00:00:00`)
        .lt("datetime", `${date}T23:59:59`);

      if (reservationsError) {
        console.error("Error fetching reservations:", reservationsError);
        return createErrorResponse("Failed to fetch reservations");
      }

      timeSlots = generateTimeSlots(targetDate, businessHours, reservationMenu);

      // 予約状況を反映
      timeSlots = updateSlotsWithReservations(
        timeSlots,
        reservations as Reservation[],
        reservationMenu,
      );

      // 利用可能なスロットのみを返す
      const availableSlots = timeSlots
        .filter((slot) => slot.isAvailable)
        .map((slot) => ({
          datetime: slot.datetime,
          is_booked: false,
        }));

      return createApiResponse(availableSlots);
    } else {
      // スタッフが指定されていない場合、テナントの営業時間とスタッフの空き状況を組み合わせる
      // まずテナント全体の営業時間を取得
      const { data: generalBusinessHours, error: generalError } = await supabase
        .from("business_hours")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true);

      if (generalError) {
        console.error("Error fetching general business hours:", generalError);
        return createErrorResponse("Failed to fetch business hours");
      }

      // 全スタッフの営業時間を取得
      const { data: allStaffBusinessHours, error: allStaffError } = await supabase
        .from("staff_member_business_hours")
        .select(`
          *,
          staff_members!inner (
            tenant_id
          )
        `)
        .eq("staff_members.tenant_id", tenant.id)
        .eq("is_active", true);

      if (allStaffError) {
        console.error("Error fetching all staff business hours:", allStaffError);
        return createErrorResponse("Failed to fetch staff business hours");
      }

      if (!generalBusinessHours || generalBusinessHours.length === 0) {
        return createApiResponse([]);
      }

      // 全ての予約を取得（スタッフフィルタリングなし）
      const { data: allReservations, error: allReservationsError } = await supabase
        .from("reservations")
        .select("id, datetime, duration_minutes, reservation_menu_id, staff_member_id")
        .eq("tenant_id", tenant.id)
        .gte("datetime", `${date}T00:00:00`)
        .lt("datetime", `${date}T23:59:59`);

      if (allReservationsError) {
        console.error("Error fetching all reservations:", allReservationsError);
        return createErrorResponse("Failed to fetch reservations");
      }

      // 新しい関数を使用してスタッフ未選択時の空き状況を計算
      timeSlots = calculateAvailabilityWithoutStaffSelection(
        targetDate,
        generalBusinessHours as BusinessHour[],
        allStaffBusinessHours as StaffMemberBusinessHour[],
        allReservations as Reservation[],
        reservationMenu,
      );

      // 利用可能なスロットのみを返す
      const availableSlots = timeSlots
        .filter((slot) => slot.isAvailable)
        .map((slot) => ({
          datetime: slot.datetime,
          is_booked: false,
        }));

      return createApiResponse(availableSlots);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return createErrorResponse("Internal server error");
  }
}
