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
} from '@/utils/api';

export async function GET(request: NextRequest) {
  try {
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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('reservations')
      .select(
        `
        id,
        user_id,
        name,
        datetime,
        note,
        admin_note,
        member_type,
        reservation_menu_id,
        duration_minutes,
        staff_member_id,
        created_at,
        staff_members (
          id,
          name
        ),
        users (
          user_id,
          name
        )
      `
      )
      .eq('tenant_id', tenant.id)
      .order('datetime', { ascending: true });

    // スタッフフィルタ
    if (staffMemberId && staffMemberId !== 'all') {
      if (staffMemberId === 'unassigned') {
        query = query.is('staff_member_id', null);
      } else {
        query = query.eq('staff_member_id', staffMemberId);
      }
    }

    // 日付範囲フィルタ
    if (startDate) {
      query = query.gte('datetime', startDate);
    }
    if (endDate) {
      query = query.lte('datetime', endDate);
    }

    const { data: reservations, error } = await query;

    if (error) {
      console.error('Admin reservation fetch error:', error);
      return createErrorResponse('Failed to fetch reservations');
    }

    return createApiResponse(reservations);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}
