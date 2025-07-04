import type { CreateReservationApiResponse } from '@/app/api/public/reservations/route';
import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import { buildPublicApiUrl } from './base';
import type { CreateReservationData } from './types';

export const publicReservationApi = {
  async createReservation(
    reservationData: CreateReservationData,
    tenantId: string
  ): Promise<ApiResponse<CreateReservationApiResponse>> {
    const url = buildPublicApiUrl('/api/public/reservations', tenantId);

    return fetchApi(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...reservationData,
        admin_note: null,
        is_admin_mode: false,
      }),
    });
  },
};