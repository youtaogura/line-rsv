import { buildPublicApiUrl, fetchApi } from './base';
import type { ApiResponse } from './types';

export const tenantApi = {
  async getTenant(
    tenantId: string
  ): Promise<ApiResponse<{ tenant_id: string; name: string }>> {
    const url = buildPublicApiUrl(`/api/public/tenants/${tenantId}`, tenantId);
    return fetchApi(url);
  },
};
