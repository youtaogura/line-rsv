import type { TimeSlot } from '@/components/reservation/types';
import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import { buildPublicApiUrl } from './base';

// This API uses the TimeSlot type from components as it matches the expected response
export type AvailableSlotsApiResponse = TimeSlot[];

export const publicTimeSlotsApi = {
  async getAvailableSlots(
    date: Date,
    tenantId: string,
    staffId?: string
  ): Promise<ApiResponse<AvailableSlotsApiResponse>> {
    const dateStr = date.toISOString().split('T')[0];
    let url = buildPublicApiUrl(
      `/api/public/available-slots?date=${dateStr}`,
      tenantId
    );

    if (staffId) {
      url += `&staff_member_id=${staffId}`;
    }

    return fetchApi<AvailableSlotsApiResponse>(url);
  },
};