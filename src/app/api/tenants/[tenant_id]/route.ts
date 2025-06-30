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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenant_id: string }> }
) {
  try {
    const { tenant_id } = await params;
    const body = await request.json();
    const { name, is_active } = body;

    if (!tenant_id) {
      return createValidationErrorResponse({
        tenant_id: 'Tenant ID is required',
      });
    }

    const updateData: {
      name?: string;
      is_active?: boolean;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return createValidationErrorResponse({ name: 'Invalid name' });
      }
      updateData.name = name.trim();
    }

    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean') {
        return createValidationErrorResponse({
          is_active: 'Invalid is_active value',
        });
      }
      updateData.is_active = is_active;
    }

    const { data, error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', tenant_id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createNotFoundResponse('Tenant');
      }
      console.error('Error updating tenant:', error);
      return createErrorResponse('Failed to update tenant');
    }

    return createApiResponse(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}

export async function DELETE(
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

    // ソフトデリート（is_activeをfalseに設定）
    const { data, error } = await supabase
      .from('tenants')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenant_id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createNotFoundResponse('Tenant');
      }
      console.error('Error deleting tenant:', error);
      return createErrorResponse('Failed to delete tenant');
    }

    return createApiResponse({ message: 'Tenant deleted successfully', data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}
