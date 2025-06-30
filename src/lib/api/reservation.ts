import type { ApiResponse } from './types';
import { fetchApi, buildTenantApiUrl } from './base';

interface CreateReservationData {
  user_id: string;
  name: string;
  datetime: string;
  note?: string;
  member_type: 'regular' | 'guest';
  phone?: string;
  reservation_menu_id?: string;
  staff_member_id?: string;
}

interface ReservationResponse {
  id: string;
  user_id: string;
  name: string;
  datetime: string;
  note?: string;
  member_type: 'regular' | 'guest';
  phone?: string;
  reservation_menu_id?: string;
  staff_member_id?: string;
  created_at: string;
  updated_at: string;
}

export const reservationApi = {
  async createReservation(
    reservationData: CreateReservationData,
    tenantId: string
  ): Promise<ApiResponse<ReservationResponse>> {
    const url = buildTenantApiUrl('/api/reservations', tenantId);

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
