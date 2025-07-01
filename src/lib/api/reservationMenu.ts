import type { ReservationMenu } from '@/lib/supabase';
import { buildPublicApiUrl, fetchApi } from './base';
import type { ApiResponse } from './types';

export const reservationMenuApi = {
  async getReservationMenu(
    tenantId: string
  ): Promise<ApiResponse<ReservationMenu | null>> {
    const url = buildPublicApiUrl('/api/public/reservation-menu', tenantId);
    const result = await fetchApi<ReservationMenu>(url);

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
