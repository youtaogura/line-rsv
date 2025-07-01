import { supabase } from '@/lib/supabase';
import {
  requireValidTenantFromSession,
  TenantValidationError,
} from '@/lib/tenant-validation';
import {
  createApiResponse,
  createErrorResponse,
  createValidationErrorResponse,
} from '@/utils/api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
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

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return createApiResponse(null);
      }
      console.error('Error fetching user:', error);
      return createErrorResponse('Failed to fetch user');
    }

    return createApiResponse(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}
