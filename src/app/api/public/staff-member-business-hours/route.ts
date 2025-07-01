import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  requireValidTenant,
  TenantValidationError,
} from '@/lib/tenant-validation';
import {
  createApiResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
} from '@/utils/api';

export async function GET(request: NextRequest) {
  try {
    // テナント検証（クエリパラメータから）
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
    const staffMemberId = searchParams.get('staff_member_id');

    if (!staffMemberId) {
      return createValidationErrorResponse({
        staff_member_id: 'Staff member ID is required',
      });
    }

    if (staffMemberId === 'all') {
      // テナントに属するスタッフの営業時間のみを取得
      const { data, error } = await supabase
        .from('staff_member_business_hours')
        .select(`
          *,
          staff_members!inner (
            id,
            tenant_id
          )
        `)
        .eq('is_active', true)
        .eq('staff_members.tenant_id', tenant.id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching all staff business hours:', error);
        return createErrorResponse('Failed to fetch staff business hours');
      }

      return createApiResponse(data);
    } else {
      // 特定のスタッフの営業時間を取得
      const { data, error } = await supabase
        .from('staff_member_business_hours')
        .select(`
          *,
          staff_members!inner (
            id,
            tenant_id
          )
        `)
        .eq('staff_member_id', staffMemberId)
        .eq('is_active', true)
        .eq('staff_members.tenant_id', tenant.id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching staff business hours:', error);
        return createErrorResponse('Failed to fetch staff business hours');
      }

      if (!data || data.length === 0) {
        return createNotFoundResponse('Staff business hours');
      }

      return createApiResponse(data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}