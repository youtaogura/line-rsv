import type { ApiResponse } from './types';
import { fetchApi, buildTenantApiUrl } from './base';

export const tenantApi = {
  async getTenant(
    tenantId: string
  ): Promise<ApiResponse<{ tenant_id: string; name: string }>> {
    const url = buildTenantApiUrl(`/api/tenants/${tenantId}`, tenantId);
    return fetchApi(url);
  },
};
