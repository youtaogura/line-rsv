import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import { buildAdminApiUrl } from './base';

export interface AdminTenant {
  id: string;
  name: string;
}

export const adminTenantsApi = {
  async getTenant(): Promise<ApiResponse<AdminTenant>> {
    const url = buildAdminApiUrl('/api/admin/tenants/');
    return fetchApi<AdminTenant>(url);
  },
};