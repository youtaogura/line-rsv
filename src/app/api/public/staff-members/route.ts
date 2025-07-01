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
      .from('staff_members')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching staff members:', error);
      return createErrorResponse('Failed to fetch staff members');
    }

    return createApiResponse(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}