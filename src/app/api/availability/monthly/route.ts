import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, addDays } from "date-fns";
import {
  requireValidTenant,
  TenantValidationError,
} from "@/lib/tenant-validation";
import { generateTimeSlots, updateSlotsWithReservations } from "@/components/reservation/utils/availabilityCalculator";
import type {
  BusinessHour,
  Reservation,
  ReservationMenu,
  StaffMember,
} from "@/lib/supabase";
import {
  createApiResponse,
  createErrorResponse,
  createValidationErrorResponse,
} from "@/utils/api";

interface TimeSlot {
  time: string;
  datetime: string;
  isAvailable: boolean;
}

interface StaffTimeSlots {
  id: string;
  timeSlots: TimeSlot[];
}

export interface MonthlyAvailability {
  tenant: {
    timeSlots: TimeSlot[];
  };
  staffMembers: StaffTimeSlots[];
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

    // テナントの営業時間を取得
    const { data: businessHours, error: businessError } = await supabase
      .from("business_hours")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true);

    if (businessError) {
      console.error("Error fetching business hours:", businessError);
      return createErrorResponse("Failed to fetch business hours");
    }

    // サービスメニューを取得
    const { data: reservationMenus, error: menuError } = await supabase
      .from("reservation_menu")
      .select("*")
      .eq("tenant_id", tenant.id)
      .limit(1);

    if (menuError) {
      console.error("Error fetching reservation menu:", menuError);
      return createErrorResponse("Failed to fetch reservation menu");
    }

    const reservationMenu = reservationMenus?.[0] as ReservationMenu | undefined;

    // スタッフメンバーを取得
    const { data: staffMembers, error: staffError } = await supabase
      .from("staff_members")
      .select("*")
      .eq("tenant_id", tenant.id);

    if (staffError) {
      console.error("Error fetching staff members:", staffError);
      return createErrorResponse("Failed to fetch staff members");
    }

    // スタッフの対応時間を取得
    const { data: staffBusinessHours, error: staffBusinessError } = await supabase
      .from("staff_member_business_hours")
      .select("*")
      .in("staff_member_id", (staffMembers as StaffMember[]).map(s => s.id));

    if (staffBusinessError) {
      console.error("Error fetching staff business hours:", staffBusinessError);
      return createErrorResponse("Failed to fetch staff business hours");
    }

    // 期間内のすべての予約を取得
    const monthStartISO = monthStart.toISOString();
    const monthEndISO = monthEnd.toISOString();

    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("id, datetime, duration_minutes, reservation_menu_id, staff_member_id")
      .eq("tenant_id", tenant.id)
      .gte("datetime", monthStartISO)
      .lte("datetime", monthEndISO);

    if (reservationsError) {
      console.error("Error fetching reservations:", reservationsError);
      return createErrorResponse("Failed to fetch reservations");
    }

    // テナント営業時間のベースタイムスロットを生成
    const tenantTimeSlots: TimeSlot[] = [];
    let currentDay = monthStart;

    while (currentDay <= monthEnd) {
      const daySlots = generateTimeSlots(
        currentDay,
        businessHours as BusinessHour[],
        reservationMenu
      );
      
      tenantTimeSlots.push(...daySlots.map(slot => ({
        time: slot.time,
        datetime: slot.datetime,
        isAvailable: true // 初期値はtrue、後でスタッフの空き状況から計算
      })));
      
      currentDay = addDays(currentDay, 1);
    }

    // スタッフごとのタイムスロットを生成
    const staffTimeSlotsMap = new Map<string, TimeSlot[]>();
    
    for (const staff of staffMembers as StaffMember[]) {
      const staffHours = staffBusinessHours?.filter(h => h.staff_member_id === staff.id) || [];
      if (staffHours.length < 1) {
        continue;
      }
      const staffReservations = (reservations as Reservation[])?.filter(r => r.staff_member_id === staff.id) || [];
      
      const staffSlots: TimeSlot[] = [];
      let currentDay = monthStart;

      while (currentDay <= monthEnd) {
        const daySlots = generateTimeSlots(
          currentDay,
          staffHours,
          reservationMenu
        );
        
        // 予約状況を反映
        const updatedSlots = updateSlotsWithReservations(
          daySlots,
          staffReservations,
          reservationMenu
        );
        
        staffSlots.push(...updatedSlots);
        
        currentDay = addDays(currentDay, 1);
      }
      
      staffTimeSlotsMap.set(staff.id, staffSlots);
    }

    // テナントの空き状況を計算（一人でもスタッフが空いていればtrue）
    const updatedTenantTimeSlots = tenantTimeSlots.map(tenantSlot => {
      const hasAvailableStaff = staffTimeSlotsMap.values().some(
        staffSlots => staffSlots.find(s => s.datetime === tenantSlot.datetime)?.isAvailable
      );
      
      return {
        ...tenantSlot,
        isAvailable: hasAvailableStaff
      };
    });

    // レスポンス形式に変換
    const response: MonthlyAvailability = {
      tenant: {
        timeSlots: updatedTenantTimeSlots
      },
      staffMembers: Array.from(staffTimeSlotsMap.entries()).map(([staffId, timeSlots]) => ({
        id: staffId,
        timeSlots
      }))
    };

    return createApiResponse(response);
  } catch (error) {
    console.error("Unexpected error:", error);
    return createErrorResponse("Internal server error");
  }
}