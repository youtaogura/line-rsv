import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  requireValidTenantFromSession,
  TenantValidationError,
} from '@/lib/tenant-validation';
import {
  createApiResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
} from '@/utils/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant_id: string }> }
) {
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

    const { tenant_id } = await params;

    // セッションのテナントIDと一致するかチェック
    if (tenant.id !== tenant_id) {
      return createValidationErrorResponse({
        tenant_id: 'Access denied to this tenant',
      });
    }

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant_id)
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