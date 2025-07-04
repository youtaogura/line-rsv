import { MonthlyAvailability } from '@/app/api/admin/availability/monthly/route';
import type { ApiResponse } from '../shared/types';
import { fetchApi } from '../shared/utils';
import { buildAdminApiUrl } from './base';

export const adminAvailabilityApi = {
  async getMonthlyAvailability(
    year: number,
    month: number
  ): Promise<ApiResponse<MonthlyAvailability>> {
    const url = buildAdminApiUrl(
      `/api/admin/availability/monthly?year=${year}&month=${month + 1}`
    );
    return fetchApi<MonthlyAvailability>(url);
  },
};
