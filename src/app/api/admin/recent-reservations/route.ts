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
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20); // 最大20件に制限

    // 現在時刻を取得
    const now = new Date().toISOString();

    // 現在時刻より前の予約（過去の予約）を取得
    const { data: pastReservations, error: pastError } = await supabase
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
      .lt('datetime', now)
      .order('datetime', { ascending: false })
      .limit(Math.ceil(limit / 2));

    if (pastError) {
      console.error('Past reservations fetch error:', pastError);
      return createErrorResponse('Failed to fetch past reservations');
    }

    // 現在時刻より後の予約（未来の予約）を取得
    const { data: futureReservations, error: futureError } = await supabase
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
      .gte('datetime', now)
      .order('datetime', { ascending: true })
      .limit(Math.ceil(limit / 2));

    if (futureError) {
      console.error('Future reservations fetch error:', futureError);
      return createErrorResponse('Failed to fetch future reservations');
    }

    // 過去と未来の予約を結合
    const allReservations = [
      ...(pastReservations || []),
      ...(futureReservations || []),
    ];

    // 現在時刻からの距離でソートして指定された件数に制限
    const nowTime = new Date(now).getTime();
    const sortedReservations = allReservations
      .sort((a, b) => {
        const timeA = Math.abs(new Date(a.datetime).getTime() - nowTime);
        const timeB = Math.abs(new Date(b.datetime).getTime() - nowTime);
        return timeA - timeB;
      })
      .slice(0, limit);

    return createApiResponse(sortedReservations);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}
