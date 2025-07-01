import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
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
    const { tenant_id } = await params;

    if (!tenant_id) {
      return createValidationErrorResponse({
        tenant_id: 'Tenant ID is required',
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