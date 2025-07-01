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
import { HTTP_STATUS } from '@/constants/api';

export async function GET(_request: NextRequest) {
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

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return createValidationErrorResponse({
        name: 'Name is required and must be a non-empty string',
      });
    }

    // 同一テナント内での名前重複チェック
    const { data: existingStaff, error: fetchError } = await supabase
      .from('staff_members')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('name', name.trim())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error checking for existing staff member:', fetchError);
      return createErrorResponse('Failed to check for conflicts');
    }

    if (existingStaff) {
      return createErrorResponse(
        'A staff member with this name already exists',
        409
      );
    }

    const { data, error } = await supabase
      .from('staff_members')
      .insert([
        {
          tenant_id: tenant.id,
          name: name.trim(),
        },
      ])
      .select();

    if (error) {
      console.error('Error creating staff member:', error);
      return createErrorResponse('Failed to create staff member');
    }

    return createApiResponse(data[0], HTTP_STATUS.CREATED);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tenant = await requireValidTenantFromSession();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return createValidationErrorResponse({ id: 'ID is required' });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return createValidationErrorResponse({
        name: 'Name is required and must be a non-empty string',
      });
    }

    // スタッフメンバーが存在するかチェック
    const { data: existingStaff, error: fetchError } = await supabase
      .from('staff_members')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single();

    if (fetchError || !existingStaff) {
      return createNotFoundResponse('Staff member');
    }

    // 同一テナント内での名前重複チェック（自分以外）
    const { data: duplicateStaff, error: duplicateError } = await supabase
      .from('staff_members')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('name', name.trim())
      .neq('id', id)
      .single();

    if (duplicateError && duplicateError.code !== 'PGRST116') {
      console.error(
        'Error checking for duplicate staff member:',
        duplicateError
      );
      return createErrorResponse('Failed to check for conflicts');
    }

    if (duplicateStaff) {
      return createErrorResponse(
        'A staff member with this name already exists',
        409
      );
    }

    const { data, error } = await supabase
      .from('staff_members')
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .select();

    if (error) {
      console.error('Error updating staff member:', error);
      return createErrorResponse('Failed to update staff member');
    }

    return createApiResponse(data[0]);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tenant = await requireValidTenantFromSession();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return createValidationErrorResponse({ id: 'ID is required' });
    }

    // スタッフメンバーが存在するかチェック
    const { data: existingStaff, error: fetchError } = await supabase
      .from('staff_members')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single();

    if (fetchError || !existingStaff) {
      return createNotFoundResponse('Staff member');
    }

    // 関連する予約があるかチェック
    const { data: relatedReservations, error: reservationError } =
      await supabase
        .from('reservations')
        .select('id')
        .eq('staff_member_id', id)
        .limit(1);

    if (reservationError) {
      console.error('Error checking related reservations:', reservationError);
      return createErrorResponse('Failed to check related data');
    }

    if (relatedReservations && relatedReservations.length > 0) {
      return createErrorResponse(
        'Cannot delete staff member with existing reservations',
        409
      );
    }

    const { error } = await supabase
      .from('staff_members')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant.id);

    if (error) {
      console.error('Error deleting staff member:', error);
      return createErrorResponse('Failed to delete staff member');
    }

    return createApiResponse({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}
