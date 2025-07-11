import { NextRequest } from 'next/server';
import { supabase, ReservationMenu } from '@/lib/supabase';
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

// API response type definition
export type ReservationMenuApiResponse = Pick<ReservationMenu, 'id' | 'name' | 'duration_minutes' | 'start_minutes_options'> | null;

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

    // そのテナントの予約メニューを取得（1テナント1メニューの想定）
    const { data: reservationMenu, error } = await supabase
      .from('reservation_menu')
      .select('id, name, duration_minutes, start_minutes_options')
      .eq('tenant_id', tenant.id)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // データが見つからない場合
        return createNotFoundResponse('Reservation menu');
      }
      console.error('Error fetching reservation menu:', error);
      return createErrorResponse('Failed to fetch reservation menu');
    }

    return createApiResponse(reservationMenu);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}