import { NextRequest } from 'next/server';
import { supabase, BusinessHour } from '@/lib/supabase';
import {
  requireValidTenant,
  TenantValidationError,
} from '@/lib/tenant-validation';
import {
  createApiResponse,
  createErrorResponse,
  createValidationErrorResponse,
} from '@/utils/api';

// API response type definition
export type BusinessHoursApiResponse = Pick<BusinessHour, 'id' | 'day_of_week' | 'start_time' | 'end_time'>[];

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

    const { data, error } = await supabase
      .from('business_hours')
      .select('id, day_of_week, start_time, end_time')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching business hours:', error);
      return createErrorResponse('Failed to fetch business hours');
    }

    return createApiResponse(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}