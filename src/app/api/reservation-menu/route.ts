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

    // そのテナントの予約メニューを取得（1テナント1メニューの想定）
    const { data: reservationMenu, error } = await supabase
      .from("reservation_menu")
      .select("*")
      .eq("tenant_id", tenant.id)
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // データが見つからない場合
        return NextResponse.json(
          { error: "Reservation menu not found" },
          { status: 404 },
        );
      }
      console.error("Error fetching reservation menu:", error);
      return NextResponse.json(
        { error: "Failed to fetch reservation menu" },
        { status: 500 },
      );
    }

    return NextResponse.json(reservationMenu);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
