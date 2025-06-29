import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireValidTenant,
  TenantValidationError,
} from "@/lib/tenant-validation";
import {
  createApiResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
} from "@/utils/api";
import { HTTP_STATUS } from "@/constants/api";

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
    const staffMemberId = searchParams.get("staff_member_id");

    if (!staffMemberId) {
      return createValidationErrorResponse({ staff_member_id: "Staff member ID is required" });
    }

    if (staffMemberId === 'all') {
      const { data, error } = await supabase
        .from("staff_member_business_hours")
        .select("*")
        .eq("is_active", true)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching all staff members business hours:", error);
        return createErrorResponse("Failed to fetch all staff members business hours");
      }

      return createApiResponse(data);
    }

    // スタッフメンバーがテナントに属するかチェック
    const { data: staffMember, error: staffError } = await supabase
      .from("staff_members")
      .select("id")
      .eq("id", staffMemberId)
      .eq("tenant_id", tenant.id)
      .single();

    if (staffError || !staffMember) {
      return createNotFoundResponse("Staff member");
    }

    const { data, error } = await supabase
      .from("staff_member_business_hours")
      .select("*")
      .eq("staff_member_id", staffMemberId)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching staff member business hours:", error);
      return createErrorResponse("Failed to fetch staff member business hours");
    }

    return createApiResponse(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return createErrorResponse("Internal server error");
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { staff_member_id, day_of_week, start_time, end_time } = body;

    if (!staff_member_id) {
      return createValidationErrorResponse({ staff_member_id: "Staff member ID is required" });
    }

    if (typeof day_of_week !== "number" || day_of_week < 0 || day_of_week > 6) {
      return createValidationErrorResponse({ day_of_week: "Invalid day_of_week. Must be 0-6." });
    }

    if (!start_time || !end_time) {
      return createValidationErrorResponse({ time: "start_time and end_time are required" });
    }

    // スタッフメンバーがテナントに属するかチェック
    const { data: staffMember, error: staffError } = await supabase
      .from("staff_members")
      .select("id")
      .eq("id", staff_member_id)
      .eq("tenant_id", tenant.id)
      .single();

    if (staffError || !staffMember) {
      return createNotFoundResponse("Staff member");
    }

    const startHour = parseInt(start_time.split(":")[0]);
    const startMinute = parseInt(start_time.split(":")[1]);
    const endHour = parseInt(end_time.split(":")[0]);
    const endMinute = parseInt(end_time.split(":")[1]);

    if (
      startHour < 9 ||
      endHour > 18 ||
      startHour >= endHour ||
      (startHour === endHour && startMinute >= endMinute)
    ) {
      return createValidationErrorResponse({
        time_range: "Invalid time range. Business hours must be between 09:00-18:00 and start time must be before end time"
      });
    }

    // Check for overlapping business hours on the same day for the same staff member
    const { data: existingHours, error: fetchError } = await supabase
      .from("staff_member_business_hours")
      .select("*")
      .eq("staff_member_id", staff_member_id)
      .eq("day_of_week", day_of_week)
      .eq("is_active", true);

    if (fetchError) {
      console.error("Error fetching existing staff member business hours:", fetchError);
      return createErrorResponse("Failed to check for conflicts");
    }

    // Check for time overlap
    const newStartMinutes = startHour * 60 + startMinute;
    const newEndMinutes = endHour * 60 + endMinute;

    for (const existingHour of existingHours) {
      const existingStartParts = existingHour.start_time.split(":");
      const existingEndParts = existingHour.end_time.split(":");
      const existingStartMinutes =
        parseInt(existingStartParts[0]) * 60 + parseInt(existingStartParts[1]);
      const existingEndMinutes =
        parseInt(existingEndParts[0]) * 60 + parseInt(existingEndParts[1]);

      // Check if there's any overlap
      if (
        newStartMinutes < existingEndMinutes &&
        newEndMinutes > existingStartMinutes
      ) {
        return createErrorResponse(
          `時間が重複しています。${existingHour.start_time}-${existingHour.end_time}の時間帯と重複します。`,
          409
        );
      }
    }

    const { data, error } = await supabase
      .from("staff_member_business_hours")
      .insert([
        {
          staff_member_id,
          day_of_week,
          start_time,
          end_time,
          is_active: true,
        },
      ])
      .select();

    if (error) {
      if (error.code === "23505") {
        return createErrorResponse("This time slot already exists", 409);
      }
      console.error("Error creating staff member business hour:", error);
      return createErrorResponse("Failed to create staff member business hour");
    }

    return createApiResponse(data[0], HTTP_STATUS.CREATED);
  } catch (error) {
    console.error("Unexpected error:", error);
    return createErrorResponse("Internal server error");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tenant = await requireValidTenant(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return createValidationErrorResponse({ id: "ID is required" });
    }

    // まず営業時間の存在をチェック
    const { data: businessHour, error: fetchError } = await supabase
      .from("staff_member_business_hours")
      .select("id, staff_member_id")
      .eq("id", id)
      .single();

    if (fetchError || !businessHour) {
      return createNotFoundResponse("Staff member business hour");
    }

    // スタッフメンバーがテナントに属するかチェック
    const { data: staffMember, error: staffError } = await supabase
      .from("staff_members")
      .select("id, tenant_id")
      .eq("id", businessHour.staff_member_id)
      .single();

    if (staffError || !staffMember || staffMember.tenant_id !== tenant.id) {
      return createNotFoundResponse("Staff member business hour");
    }

    const { error } = await supabase
      .from("staff_member_business_hours")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deactivating staff member business hour:", error);
      return createErrorResponse("Failed to delete staff member business hour");
    }

    return createApiResponse({ message: "Staff member business hour deleted successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return createErrorResponse("Internal server error");
  }
}