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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> },
) {
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

    const { user_id: sourceUserId } = await params;
    const body = await request.json();
    const { target_user_id: targetUserId } = body;

    // バリデーション
    if (!sourceUserId) {
      return createValidationErrorResponse({ source_user_id: "Source user ID is required" });
    }

    if (!targetUserId) {
      return createValidationErrorResponse({ target_user_id: "Target user ID is required" });
    }

    if (sourceUserId === targetUserId) {
      return createValidationErrorResponse({ target_user_id: "Source and target users cannot be the same" });
    }

    // ソースユーザー（統合元・ゲスト）の存在確認
    const { data: sourceUser, error: sourceUserError } = await supabase
      .from("users")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("user_id", sourceUserId)
      .single();

    if (sourceUserError || !sourceUser) {
      return createNotFoundResponse("Source user");
    }

    if (sourceUser.member_type !== "guest") {
      return createValidationErrorResponse({ member_type: "Only guest users can be merged" });
    }

    // ターゲットユーザー（統合先・正会員）の存在確認
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("user_id", targetUserId)
      .single();

    if (targetUserError || !targetUser) {
      return createNotFoundResponse("Target user");
    }

    if (targetUser.member_type !== "regular") {
      return createValidationErrorResponse({ member_type: "Target user must be a regular member" });
    }

    // ソースユーザーの予約データを取得
    const { data: sourceReservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("user_id", sourceUserId);

    if (reservationsError) {
      console.error("Error fetching source reservations:", reservationsError);
      return createErrorResponse("Failed to fetch source user reservations");
    }

    // 予約時刻の重複チェック
    if (sourceReservations && sourceReservations.length > 0) {
      const { data: targetReservations, error: targetReservationsError } = await supabase
        .from("reservations")
        .select("datetime")
        .eq("tenant_id", tenant.id)
        .eq("user_id", targetUserId);

      if (targetReservationsError) {
        console.error("Error fetching target reservations:", targetReservationsError);
        return createErrorResponse("Failed to fetch target user reservations");
      }

      const targetDatetimes = new Set(targetReservations?.map(r => r.datetime) || []);
      const conflictingReservations = sourceReservations.filter(r => 
        targetDatetimes.has(r.datetime)
      );

      if (conflictingReservations.length > 0) {
        return createErrorResponse(
          `Reservation time conflicts detected for the following times: ${
            conflictingReservations.map(r => new Date(r.datetime).toLocaleString()).join(', ')
          }`
        );
      }
    }

    // 統合処理を実行
    try {
      // 1. 予約データのuser_id更新
      let mergedReservationsCount = 0;
      if (sourceReservations && sourceReservations.length > 0) {
        const { error: updateReservationsError } = await supabase
          .from("reservations")
          .update({ user_id: targetUserId })
          .eq("tenant_id", tenant.id)
          .eq("user_id", sourceUserId);

        if (updateReservationsError) {
          console.error("Error updating reservations:", updateReservationsError);
          return createErrorResponse("Failed to transfer reservations");
        }
        mergedReservationsCount = sourceReservations.length;
      }

      // 2. ターゲットユーザー情報の更新（電話番号の統合）
      const updatedUserData: {
        phone?: string;
      } = {};

      if (!targetUser.phone && sourceUser.phone) {
        updatedUserData.phone = sourceUser.phone;
      }

      if (Object.keys(updatedUserData).length > 0) {
        const { error: updateTargetError } = await supabase
          .from("users")
          .update(updatedUserData)
          .eq("tenant_id", tenant.id)
          .eq("user_id", targetUserId);

        if (updateTargetError) {
          console.error("Error updating target user:", updateTargetError);
          // 予約は移行済みなので、ユーザー情報更新エラーは警告として扱う
          console.warn("Reservations transferred but target user info update failed");
        }
      }

      // 3. ソースユーザーの削除
      const { error: deleteSourceError } = await supabase
        .from("users")
        .delete()
        .eq("tenant_id", tenant.id)
        .eq("user_id", sourceUserId);

      if (deleteSourceError) {
        console.error("Error deleting source user:", deleteSourceError);
        return createErrorResponse("Reservations transferred but failed to delete source user");
      }

      // 4. 更新されたターゲットユーザー情報を取得
      const { data: updatedUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("user_id", targetUserId)
        .single();

      if (fetchError) {
        console.error("Error fetching updated user:", fetchError);
        return createErrorResponse("Merge completed but failed to fetch updated user info");
      }

      return createApiResponse({
        message: "User merge completed successfully",
        merged_reservations_count: mergedReservationsCount,
        updated_user: updatedUser
      });

    } catch (error) {
      console.error("Error during merge process:", error);
      return createErrorResponse("Failed to complete merge process");
    }

  } catch (error) {
    console.error("Unexpected error during user merge:", error);
    return createErrorResponse("Internal server error during merge");
  }
}