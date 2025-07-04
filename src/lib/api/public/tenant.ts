import type { TenantApiResponse } from '@/app/api/public/tenants/[tenant_id]/route';
import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import { buildPublicApiUrl } from './base';

export const publicTenantApi = {
  async getTenant(
    tenantId: string
  ): Promise<ApiResponse<TenantApiResponse>> {
    const url = buildPublicApiUrl(`/api/public/tenants/${tenantId}`, tenantId);
    return fetchApi<TenantApiResponse>(url);
  },
};