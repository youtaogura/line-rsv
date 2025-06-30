import { supabase } from './supabase';
import type { Tenant } from './supabase';

export async function validateTenant(tenantId: string): Promise<Tenant | null> {
  if (!tenantId || typeof tenantId !== 'string') {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error validating tenant:', error);
    return null;
  }
}

// Import and re-export from utils for backward compatibility
import { getTenantIdFromUrl, getTenantIdFromRequest } from '@/lib/utils/tenant';
export { getTenantIdFromUrl, getTenantIdFromRequest };

export class TenantValidationError extends Error {
  constructor(
    message: string,
    public code: 'MISSING_TENANT_ID' | 'INVALID_TENANT_ID'
  ) {
    super(message);
    this.name = 'TenantValidationError';
  }
}

export async function requireValidTenant(
  request: Request | { url: string }
): Promise<Tenant> {
  const tenantId = getTenantIdFromRequest(request);

  if (!tenantId) {
    throw new TenantValidationError(
      'Tenant ID is required',
      'MISSING_TENANT_ID'
    );
  }

  const tenant = await validateTenant(tenantId);

  if (!tenant) {
    throw new TenantValidationError(
      'Invalid or inactive tenant',
      'INVALID_TENANT_ID'
    );
  }

  return tenant;
}
