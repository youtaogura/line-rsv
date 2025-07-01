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

export async function GET(_request: NextRequest) {
  try {
    // セッション認証
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
      .from('tenants')
      .select('*')
      .eq('id', tenant.id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createNotFoundResponse('Tenant');
      }
      console.error('Error fetching tenant:', error);
      return createErrorResponse('Failed to fetch tenant');
    }

    return createApiResponse(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}
