import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant_id: string }> },
) {
  try {
    const { tenant_id } = await params;

    if (!tenant_id) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenant_id)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Tenant not found" },
          { status: 404 },
        );
      }
      console.error("Error fetching tenant:", error);
      return NextResponse.json(
        { error: "Failed to fetch tenant" },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenant_id: string }> },
) {
  try {
    const { tenant_id } = await params;
    const body = await request.json();
    const { name, is_active } = body;

    if (!tenant_id) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    const updateData: {
      name?: string;
      is_active?: boolean;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (is_active !== undefined) {
      if (typeof is_active !== "boolean") {
        return NextResponse.json(
          { error: "Invalid is_active value" },
          { status: 400 },
        );
      }
      updateData.is_active = is_active;
    }

    const { data, error } = await supabase
      .from("tenants")
      .update(updateData)
      .eq("id", tenant_id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Tenant not found" },
          { status: 404 },
        );
      }
      console.error("Error updating tenant:", error);
      return NextResponse.json(
        { error: "Failed to update tenant" },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenant_id: string }> },
) {
  try {
    const { tenant_id } = await params;

    if (!tenant_id) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    // ソフトデリート（is_activeをfalseに設定）
    const { data, error } = await supabase
      .from("tenants")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenant_id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Tenant not found" },
          { status: 404 },
        );
      }
      console.error("Error deleting tenant:", error);
      return NextResponse.json(
        { error: "Failed to delete tenant" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Tenant deleted successfully", data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
