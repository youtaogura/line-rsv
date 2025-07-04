import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import { buildAdminApiUrl } from './base';

export interface AdminBusinessHour {
  id: string;
  tenant_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateBusinessHourData {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export const adminBusinessHoursApi = {
  async getBusinessHours(): Promise<ApiResponse<AdminBusinessHour[]>> {
    const url = buildAdminApiUrl('/api/admin/business-hours');
    return fetchApi<AdminBusinessHour[]>(url);
  },

  async createBusinessHour(data: CreateBusinessHourData): Promise<ApiResponse<AdminBusinessHour>> {
    const url = buildAdminApiUrl('/api/admin/business-hours');
    return fetchApi<AdminBusinessHour>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  async deleteBusinessHour(id: string): Promise<ApiResponse<{ message: string }>> {
    const url = buildAdminApiUrl(`/api/admin/business-hours?id=${id}`);
    return fetchApi<{ message: string }>(url, {
      method: 'DELETE',
    });
  },
};