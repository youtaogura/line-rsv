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

    if (!date) {
      return createValidationErrorResponse({ date: "Date parameter is required" });
    }

    const targetDate = parseISO(date);

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

    // その日の予約を取得
    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("id, datetime, duration_minutes, reservation_menu_id")
      .eq("tenant_id", tenant.id)
      .gte("datetime", `${date}T00:00:00`)
      .lt("datetime", `${date}T23:59:59`);

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
