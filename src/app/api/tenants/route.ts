import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  createApiResponse,
  createErrorResponse,
  createValidationErrorResponse,
} from "@/utils/api";
import { HTTP_STATUS } from "@/constants/api";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tenants:", error);
      return createErrorResponse("Failed to fetch tenants");
    }

    return createApiResponse(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return createErrorResponse("Internal server error");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return createValidationErrorResponse({ name: "Name is required" });
    }

    const { data, error } = await supabase
      .from("tenants")
      .insert([
        {
          name: name.trim(),
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating tenant:", error);
      return createErrorResponse("Failed to create tenant");
    }

    return createApiResponse(data, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error("Unexpected error:", error);
    return createErrorResponse("Internal server error");
  }
}
