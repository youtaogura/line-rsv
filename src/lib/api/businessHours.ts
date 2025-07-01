import type { BusinessHour } from '@/lib/supabase';
import { buildPublicApiUrl, fetchApi } from './base';
import type { ApiResponse } from './types';

export const businessHoursApi = {
  async getBusinessHours(
    tenantId: string
  ): Promise<ApiResponse<BusinessHour[]>> {
    const url = buildPublicApiUrl('/api/public/business-hours', tenantId);
    return fetchApi<BusinessHour[]>(url);
  },
};
