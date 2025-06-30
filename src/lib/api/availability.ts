import { MonthlyAvailability } from '@/app/api/availability/monthly/route';
import { buildApiUrl } from '../tenant-helpers';
import { ApiResponse } from './types';
import { fetchApi } from './base';

export const availabilityApi = {
  async getMonthlyAvailability(
    tenantId: string,
    year: number,
    month: number
  ): Promise<ApiResponse<MonthlyAvailability>> {
    const url = buildApiUrl(
      `/api/availability/monthly?year=${year}&month=${month + 1}`,
      tenantId
    );
    return fetchApi<MonthlyAvailability>(url);
  },
};
