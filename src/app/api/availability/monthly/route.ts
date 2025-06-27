import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, addDays, format } from "date-fns";
import {
  requireValidTenant,
  TenantValidationError,
} from "@/lib/tenant-validation";
import { calculateMonthlyAvailability } from "@/components/reservation/utils/availabilityCalculator";
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

interface DayAvailability {
  date: string;
  hasAvailability: boolean;
}

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
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!year || !month) {
      return createValidationErrorResponse({ params: "Year and month parameters are required" });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month) - 1; // JavaScript months are 0-indexed

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
      return createValidationErrorResponse({ params: "Invalid year or month" });
    }

    // 指定月の開始日と終了日を取得
    const monthStart = startOfMonth(new Date(yearNum, monthNum));
    const monthEnd = endOfMonth(new Date(yearNum, monthNum));

    // 営業時間を取得
    const { data: businessHours, error: businessError } = await supabase
      .from("business_hours")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true);

    if (businessError) {
      console.error("Error fetching business hours:", businessError);
      return createErrorResponse("Failed to fetch business hours");
    }

    // 予約メニューを取得
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

    // 月内のすべての予約を取得
    const monthStartISO = monthStart.toISOString();
    const monthEndISO = monthEnd.toISOString();

    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("id, datetime, duration_minutes, reservation_menu_id")
      .eq("tenant_id", tenant.id)
      .gte("datetime", monthStartISO)
      .lte("datetime", monthEndISO);

    if (reservationsError) {
      console.error("Error fetching reservations:", reservationsError);
      return createErrorResponse("Failed to fetch reservations");
    }

    // 新しいロジックで月間空き状況を計算
    const availabilityMap = calculateMonthlyAvailability(
      monthStart,
      monthEnd,
      businessHours as BusinessHour[],
      reservations as Reservation[],
      reservationMenu,
    );

    // 結果を配列形式に変換
    const dayAvailabilities: DayAvailability[] = [];
    let currentDay = monthStart;

    while (currentDay <= monthEnd) {
      const dateStr = format(currentDay, "yyyy-MM-dd");
      const dayInfo = availabilityMap.get(dateStr);

      dayAvailabilities.push({
        date: dateStr,
        hasAvailability: dayInfo ? dayInfo.availableSlots > 0 : false,
      });

      currentDay = addDays(currentDay, 1);
    }

    return createApiResponse(dayAvailabilities);
  } catch (error) {
    console.error("Unexpected error:", error);
    return createErrorResponse("Internal server error");
  }
}
