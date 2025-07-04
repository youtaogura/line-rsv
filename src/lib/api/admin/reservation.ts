import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import { buildAdminApiUrl } from './base';
import type { CreateAdminReservationData } from './types';

export const adminReservationApi = {
  async updateReservationAdminNote(
    reservationId: string,
    adminNote: string
  ): Promise<ApiResponse<unknown>> {
    const url = buildAdminApiUrl(`/api/admin/reservations?id=${reservationId}`);

    return fetchApi(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ admin_note: adminNote }),
    });
  },

  async assignStaffToReservation(
    reservationId: string,
    staffMemberId: string | null
  ): Promise<ApiResponse<unknown>> {
    const url = buildAdminApiUrl(`/api/admin/reservations?id=${reservationId}`);

    return fetchApi(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ staff_member_id: staffMemberId }),
    });
  },

  async createAdminReservation(
    reservationData: CreateAdminReservationData
  ): Promise<ApiResponse<unknown>> {
    const url = buildAdminApiUrl('/api/admin/reservations');

    return fetchApi(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...reservationData,
        is_admin_mode: true,
      }),
    });
  },

  async getAdminReservationMenu(): Promise<ApiResponse<unknown>> {
    const url = buildAdminApiUrl('/api/admin/reservation-menu');
    return fetchApi(url);
  },
};