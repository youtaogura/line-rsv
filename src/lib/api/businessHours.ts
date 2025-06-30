import type { BusinessHour } from '@/lib/supabase';
import type { ApiResponse } from './types';
import { fetchApi, buildTenantApiUrl } from './base';

export const businessHoursApi = {
  async getBusinessHours(
    tenantId: string
  ): Promise<ApiResponse<BusinessHour[]>> {
    const url = buildTenantApiUrl('/api/business-hours', tenantId);
    return fetchApi<BusinessHour[]>(url);
  },
};
