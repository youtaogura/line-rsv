import type { MonthlyAvailability } from '@/app/api/public/availability/monthly/route';
import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import { buildPublicApiUrl } from './base';

export const publicAvailabilityApi = {
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