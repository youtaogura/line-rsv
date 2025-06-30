import { supabase } from '@/lib/supabase';

interface MergeUserParams {
  sourceUserId: string;
  targetUserId: string;
  tenantId: string;
}

interface MergeUserResult {
  success: boolean;
  error?: string;
  mergedReservationsCount?: number;
  updatedUser?: Record<string, unknown>;
}

/**
 * ユーザー統合処理
 * ゲストユーザーを正会員ユーザーに統合する
 *
 * @param params 統合パラメータ
 * @returns 統合結果
 */
export async function mergeUsers({
  sourceUserId,
  targetUserId,
  tenantId,
}: MergeUserParams): Promise<MergeUserResult> {
  try {
    // ソースユーザー（統合元・ゲスト）の存在確認
    const { data: sourceUser, error: sourceUserError } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', sourceUserId)
      .single();

    if (sourceUserError || !sourceUser) {
      return { success: false, error: 'Source user not found' };
    }

    if (sourceUser.member_type !== 'guest') {
      return { success: false, error: 'Only guest users can be merged' };
    }

    // ターゲットユーザー（統合先・正会員）の存在確認
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', targetUserId)
      .single();

    if (targetUserError || !targetUser) {
      return { success: false, error: 'Target user not found' };
    }

    // ソースユーザーの予約データを取得
    const { data: sourceReservations, error: reservationsError } =
      await supabase
        .from('reservations')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', sourceUserId);

    if (reservationsError) {
      console.error('Error fetching source reservations:', reservationsError);
      return {
        success: false,
        error: 'Failed to fetch source user reservations',
      };
    }

    // 予約時刻の重複チェック
    if (sourceReservations && sourceReservations.length > 0) {
      const { data: targetReservations, error: targetReservationsError } =
        await supabase
          .from('reservations')
          .select('datetime')
          .eq('tenant_id', tenantId)
          .eq('user_id', targetUserId);

      if (targetReservationsError) {
        console.error(
          'Error fetching target reservations:',
          targetReservationsError
        );
        return {
          success: false,
          error: 'Failed to fetch target user reservations',
        };
      }

      const targetDatetimes = new Set(
        targetReservations?.map((r) => r.datetime) || []
      );
      const conflictingReservations = sourceReservations.filter((r) =>
        targetDatetimes.has(r.datetime)
      );

      if (conflictingReservations.length > 0) {
        return {
          success: false,
          error: `Reservation time conflicts detected for the following times: ${conflictingReservations
            .map((r) => new Date(r.datetime).toLocaleString())
            .join(', ')}`,
        };
      }
    }

    // 統合処理を実行
    let mergedReservationsCount = 0;

    // 1. 予約データのuser_id更新
    if (sourceReservations && sourceReservations.length > 0) {
      const { error: updateReservationsError } = await supabase
        .from('reservations')
        .update({ user_id: targetUserId })
        .eq('tenant_id', tenantId)
        .eq('user_id', sourceUserId);

      if (updateReservationsError) {
        console.error('Error updating reservations:', updateReservationsError);
        return { success: false, error: 'Failed to transfer reservations' };
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
        .from('users')
        .update(updatedUserData)
        .eq('tenant_id', tenantId)
        .eq('user_id', targetUserId);

      if (updateTargetError) {
        console.error('Error updating target user:', updateTargetError);
        console.warn(
          'Reservations transferred but target user info update failed'
        );
      }
    }

    // 3. ソースユーザーの削除
    const { error: deleteSourceError } = await supabase
      .from('users')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', sourceUserId);

    if (deleteSourceError) {
      console.error('Error deleting source user:', deleteSourceError);
      return {
        success: false,
        error: 'Reservations transferred but failed to delete source user',
      };
    }

    // 4. 更新されたターゲットユーザー情報を取得
    const { data: updatedUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', targetUserId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated user:', fetchError);
      return {
        success: false,
        error: 'Merge completed but failed to fetch updated user info',
      };
    }

    return {
      success: true,
      mergedReservationsCount,
      updatedUser,
    };
  } catch (error) {
    console.error('Error during merge process:', error);
    return { success: false, error: 'Failed to complete merge process' };
  }
}

/**
 * 電話番号による統合可能なユーザーを検索
 *
 * @param phone 電話番号
 * @param tenantId テナントID
 * @returns 統合可能なユーザー情報
 */
export async function findMergeableUserByPhone(
  phone: string,
  tenantId: string
): Promise<{
  user_id: string;
  name: string;
  phone?: string;
  member_type: string;
} | null> {
  const { data: phoneUser } = await supabase
    .from('users')
    .select('user_id, name, phone, member_type')
    .eq('tenant_id', tenantId)
    .eq('phone', phone.trim())
    .single();

  return phoneUser || null;
}
