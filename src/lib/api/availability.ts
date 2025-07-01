import { MonthlyAvailability } from '@/app/api/public/availability/monthly/route';
import { buildPublicApiUrl, fetchApi } from './base';
import { ApiResponse } from './types';

export const availabilityApi = {
  async getMonthlyAvailability(
    tenantId: string,
    year: number,
    month: number
  ): Promise<ApiResponse<MonthlyAvailability>> {
    const url = buildPublicApiUrl(
      `/api/public/availability/monthly?year=${year}&month=${month + 1}`,
      tenantId
    );
    return fetchApi<MonthlyAvailability>(url);
  },
};
