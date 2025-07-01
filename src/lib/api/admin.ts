import { buildAdminApiUrl, fetchApi } from './base';
import type { ApiResponse } from './types';

interface CreateAdminReservationData {
  user_id: string;
  name: string;
  datetime: string;
  note?: string | null;
  member_type: string;
  phone?: string | null;
  reservation_menu_id?: string | null;
  staff_member_id?: string | null;
  admin_note?: string | null;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const adminApi = {
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

  async changePassword(
    passwordData: ChangePasswordData
  ): Promise<ApiResponse<unknown>> {
    return fetchApi('/api/admin/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordData),
    });
  },
};
