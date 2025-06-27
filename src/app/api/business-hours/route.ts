import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireValidTenant,
  TenantValidationError,
} from "@/lib/tenant-validation";

export async function GET(request: NextRequest) {
  try {
    // テナント検証
    let tenant;
    try {
      tenant = await requireValidTenant(request);
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    const { data, error } = await supabase
      .from("business_hours")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching business hours:", error);
      return NextResponse.json(
        { error: "Failed to fetch business hours" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
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
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    const body = await request.json();
    const { day_of_week, start_time, end_time } = body;

    if (typeof day_of_week !== "number" || day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json(
        { error: "Invalid day_of_week. Must be 0-6." },
        { status: 400 },
      );
    }

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: "start_time and end_time are required" },
        { status: 400 },
      );
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
      return NextResponse.json(
        {
          error:
            "Invalid time range. Business hours must be between 09:00-18:00 and start time must be before end time",
        },
        { status: 400 },
      );
    }

    // Check for overlapping business hours on the same day
    const { data: existingHours, error: fetchError } = await supabase
      .from("business_hours")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("day_of_week", day_of_week)
      .eq("is_active", true);

    if (fetchError) {
      console.error("Error fetching existing business hours:", fetchError);
      return NextResponse.json(
        { error: "Failed to check for conflicts" },
        { status: 500 },
      );
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
        return NextResponse.json(
          {
            error: `時間が重複しています。${existingHour.start_time}-${existingHour.end_time}の時間帯と重複します。`,
          },
          { status: 409 },
        );
      }
    }

    const { data, error } = await supabase
      .from("business_hours")
      .insert([
        {
          tenant_id: tenant.id,
          day_of_week,
          start_time,
          end_time,
          is_active: true,
        },
      ])
      .select();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This time slot already exists" },
          { status: 409 },
        );
      }
      console.error("Error creating business hour:", error);
      return NextResponse.json(
        { error: "Failed to create business hour" },
        { status: 500 },
      );
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tenant = await requireValidTenant(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("business_hours")
      .update({ is_active: false })
      .eq("id", id)
      .eq("tenant_id", tenant.id);

    if (error) {
      console.error("Error deactivating business hour:", error);
      return NextResponse.json(
        { error: "Failed to delete business hour" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Business hour deleted successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
