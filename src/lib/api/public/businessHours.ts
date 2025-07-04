import type { BusinessHoursApiResponse } from '@/app/api/public/business-hours/route';
import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import { buildPublicApiUrl } from './base';

export const publicBusinessHoursApi = {
  async getBusinessHours(
    tenantId: string
  ): Promise<ApiResponse<BusinessHoursApiResponse>> {
    const url = buildPublicApiUrl('/api/public/business-hours', tenantId);
    return fetchApi<BusinessHoursApiResponse>(url);
  },
};