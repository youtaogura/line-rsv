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
} from "@/components/reservation/utils/availabilityCalculator";
import type {
  BusinessHour,
  Reservation,
  ReservationMenu,
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

    // 営業時間を取得（スタッフ指定の場合はスタッフの営業時間も含む）
    let businessHours = [];
    
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

      businessHours = staffBusinessHours || [];
    } else {
      // スタッフが指定されていない場合、全スタッフの営業時間の和集合を取得
      // まず一般的な営業時間を取得
      const { data: generalBusinessHours, error: generalError } = await supabase
        .from("business_hours")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true);

      if (generalError) {
        console.error("Error fetching general business hours:", generalError);
        return createErrorResponse("Failed to fetch business hours");
      }

      // 全スタッフの営業時間も取得
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

      // 一般営業時間とスタッフ営業時間を統合
      businessHours = [
        ...(generalBusinessHours || []),
        ...(allStaffBusinessHours || []),
      ];
    }

    if (!businessHours || businessHours.length === 0) {
      return createApiResponse([]);
    }

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

    // その日の予約を取得（スタッフフィルタリング含む）
    let reservationsQuery = supabase
      .from("reservations")
      .select("id, datetime, duration_minutes, reservation_menu_id, staff_member_id")
      .eq("tenant_id", tenant.id)
      .gte("datetime", `${date}T00:00:00`)
      .lt("datetime", `${date}T23:59:59`);

    if (staffMemberId) {
      reservationsQuery = reservationsQuery.eq("staff_member_id", staffMemberId);
    }

    const { data: reservations, error: reservationsError } = await reservationsQuery;

    if (reservationsError) {
      console.error("Error fetching reservations:", reservationsError);
      return createErrorResponse("Failed to fetch reservations");
    }

    // 新しいロジックでタイムスロットを生成
    let timeSlots = generateTimeSlots(
      targetDate,
      businessHours as BusinessHour[],
      reservationMenu,
    );

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
  } catch (error) {
    console.error("Unexpected error:", error);
    return createErrorResponse("Internal server error");
  }
}
