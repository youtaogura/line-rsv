import { HTTP_STATUS } from '@/constants/api';
import { supabase } from '@/lib/supabase';
import {
  requireValidTenantFromSession,
  TenantValidationError,
} from '@/lib/tenant-validation';
import {
  createApiResponse,
  createErrorResponse,
  createNotFoundResponse,
  createValidationErrorResponse,
} from '@/utils/api';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // テナント検証
    let tenant;
    try {
      tenant = await requireValidTenantFromSession();
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return createValidationErrorResponse({ tenant: error.message });
      }
      throw error;
    }

    const body = await request.json();
    const { staff_member_id, day_of_week } = body;

    if (!staff_member_id) {
      return createValidationErrorResponse({
        staff_member_id: 'Staff member ID is required',
      });
    }

    if (typeof day_of_week !== 'number' || day_of_week < 0 || day_of_week > 6) {
      return createValidationErrorResponse({
        day_of_week: 'Invalid day_of_week. Must be 0-6.',
      });
    }

    // スタッフメンバーがテナントに属するかチェック
    const { data: staffMember, error: staffError } = await supabase
      .from('staff_members')
      .select('id')
      .eq('id', staff_member_id)
      .eq('tenant_id', tenant.id)
      .single();

    if (staffError || !staffMember) {
      return createNotFoundResponse('Staff member');
    }

    // テナントの営業時間を取得
    const { data: tenantBusinessHours, error: tenantHoursError } =
      await supabase
        .from('business_hours')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('day_of_week', day_of_week)
        .eq('is_active', true);

    if (tenantHoursError) {
      console.error('Error fetching tenant business hours:', tenantHoursError);
      return createErrorResponse('Failed to check tenant business hours');
    }

    if (!tenantBusinessHours || tenantBusinessHours.length === 0) {
      return createValidationErrorResponse({
        time_range: 'この曜日はテナントの営業日ではありません',
      });
    }

    // 一括操作のため、エラーが発生した場合はすべての操作を取り消す
    try {
      // 既存のスタッフ営業時間を削除（is_active = false）
      const { error: deleteError } = await supabase
        .from('staff_member_business_hours')
        .update({ is_active: false })
        .eq('staff_member_id', staff_member_id)
        .eq('day_of_week', day_of_week)
        .eq('is_active', true);

      if (deleteError) {
        console.error('Error deleting existing business hours:', deleteError);
        return createErrorResponse('Failed to delete existing business hours');
      }

      // 新しいスタッフ営業時間を作成
      const newBusinessHours = tenantBusinessHours.map((tenantHour) => ({
        staff_member_id,
        day_of_week,
        start_time: tenantHour.start_time,
        end_time: tenantHour.end_time,
        is_active: true,
      }));

      const { data, error: insertError } = await supabase
        .from('staff_member_business_hours')
        .insert(newBusinessHours)
        .select();

      if (insertError) {
        console.error('Error creating new business hours:', insertError);

        // 作成に失敗した場合、削除された営業時間を元に戻す
        const { error: rollbackError } = await supabase
          .from('staff_member_business_hours')
          .update({ is_active: true })
          .eq('staff_member_id', staff_member_id)
          .eq('day_of_week', day_of_week)
          .eq('is_active', false);

        if (rollbackError) {
          console.error(
            'Error rolling back deleted business hours:',
            rollbackError
          );
        }

        return createErrorResponse('Failed to create new business hours');
      }

      return createApiResponse(data, HTTP_STATUS.CREATED);
    } catch (error) {
      console.error('Unexpected error during bulk create:', error);

      // エラーが発生した場合、削除された営業時間を元に戻す
      const { error: rollbackError } = await supabase
        .from('staff_member_business_hours')
        .update({ is_active: true })
        .eq('staff_member_id', staff_member_id)
        .eq('day_of_week', day_of_week)
        .eq('is_active', false);

      if (rollbackError) {
        console.error(
          'Error rolling back deleted business hours:',
          rollbackError
        );
      }

      throw error;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}
