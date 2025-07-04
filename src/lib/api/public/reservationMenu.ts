import type { ReservationMenuApiResponse } from '@/app/api/public/reservation-menu/route';
import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import { buildPublicApiUrl } from './base';

export const publicReservationMenuApi = {
  async getReservationMenu(
    tenantId: string
  ): Promise<ApiResponse<ReservationMenuApiResponse>> {
    const url = buildPublicApiUrl('/api/public/reservation-menu', tenantId);
    const result = await fetchApi<ReservationMenuApiResponse>(url);

    // 404 is expected for optional reservation menu
    if (!result.success && result.error?.includes('404')) {
      return {
        success: true,
        data: null,
      };
    }

    return result;
  },
};