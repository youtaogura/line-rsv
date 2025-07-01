import { HTTP_STATUS } from '@/constants/api';
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

export async function GET(_request: NextRequest) {
  try {
    let tenant;
    try {
      tenant = await requireValidTenantFromSession();
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return createValidationErrorResponse({ tenant: error.message });
      }
      throw error;
    }

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id, read_at, title, message, created_at, updated_at')
      .eq('tenant_id', tenant.id)
      .gte('created_at', threeDaysAgo.toISOString())
      .order('read_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Notifications fetch error:', error);
      return createErrorResponse('Failed to fetch notifications');
    }

    return createApiResponse(notifications || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { title, message } = body;

    if (!title || !message) {
      return createValidationErrorResponse({
        fields: 'Missing required fields: title, message',
      });
    }

    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        tenant_id: tenant.id,
        title,
        message,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Notification creation error:', insertError);
      return createErrorResponse('Failed to create notification');
    }

    return createApiResponse(notification, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}

export async function PUT(request: NextRequest) {
  try {
    let tenant;
    try {
      tenant = await requireValidTenantFromSession();
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return createValidationErrorResponse({ tenant: error.message });
      }
      throw error;
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return createValidationErrorResponse({
        id: 'Notification ID is required',
      });
    }

    const { data: existingNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('id, tenant_id')
      .eq('id', notificationId)
      .eq('tenant_id', tenant.id)
      .single();

    if (fetchError || !existingNotification) {
      return createErrorResponse('Notification not found', 404);
    }

    const { data: notification, error: updateError } = await supabase
      .from('notifications')
      .update({ 
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('tenant_id', tenant.id)
      .select()
      .single();

    if (updateError) {
      console.error('Notification update error:', updateError);
      return createErrorResponse('Failed to update notification');
    }

    return createApiResponse(notification);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}