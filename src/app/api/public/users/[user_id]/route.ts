import { NextRequest } from 'next/server';
import { supabase, User } from '@/lib/supabase';
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
export type UserApiResponse = Pick<User, 'user_id' | 'name' | 'phone' | 'member_type'> | null;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    // テナント検証
    let tenant;
    try {
      tenant = await requireValidTenant(request);
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return createValidationErrorResponse({ tenant: error.message });
      }
      throw error;
    }

    const { user_id } = await params;

    if (!user_id) {
      return createValidationErrorResponse({ user_id: 'User ID is required' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('user_id, name, phone, member_type')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user_id)
      .single();

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    // テナント検証
    let tenant;
    try {
      tenant = await requireValidTenant(request);
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return createValidationErrorResponse({ tenant: error.message });
      }
      throw error;
    }

    const { user_id } = await params;
    const body = await request.json();
    const { name, phone } = body;

    if (!user_id) {
      return createValidationErrorResponse({ user_id: 'User ID is required' });
    }

    if (!name) {
      return createValidationErrorResponse({ name: 'Name is required' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id, name, phone, member_type')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user_id)
      .single();

    if (existingUser) {
      return createApiResponse(existingUser);
    }

    // Create new guest user
    const { data, error } = await supabase
      .from('users')
      .insert({
        tenant_id: tenant.id,
        user_id,
        name,
        phone: phone || null,
        member_type: 'guest',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return createErrorResponse('Failed to create user');
    }

    return createApiResponse(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    // テナント検証
    let tenant;
    try {
      tenant = await requireValidTenant(request);
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return createValidationErrorResponse({ tenant: error.message });
      }
      throw error;
    }

    const { user_id } = await params;
    const body = await request.json();
    const { name, phone, member_type } = body;

    if (!user_id) {
      return createValidationErrorResponse({ user_id: 'User ID is required' });
    }

    if (member_type && !['regular', 'guest'].includes(member_type)) {
      return createValidationErrorResponse({
        member_type: 'Invalid member_type. Must be "regular" or "guest"',
      });
    }

    // Check if user exists
    const { error: fetchError } = await supabase
      .from('users')
      .select('user_id')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user_id)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      return createNotFoundResponse('User');
    } else if (fetchError) {
      console.error('Error fetching user:', fetchError);
      return createErrorResponse('Failed to fetch user');
    }

    // Update user
    const updateData: {
      name?: string;
      phone?: string;
      member_type?: 'regular' | 'guest';
    } = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (member_type !== undefined) updateData.member_type = member_type;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('tenant_id', tenant.id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return createErrorResponse('Failed to update user');
    }

    return createApiResponse(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}
