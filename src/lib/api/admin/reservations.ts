import type { ApiResponse } from '../shared/types';
import { fetchApi } from '../shared/utils';
import { buildAdminApiUrl } from './base';
import { AdminStaffMember } from './staffMembers';
import { AdminUser } from './users';

// Note: These types mirror supabase types but are defined separately for admin API
export interface AdminReservation {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  datetime: string;
  note?: string;
  admin_note?: string;
  member_type: 'regular' | 'guest';
  reservation_menu_id?: string;
  duration_minutes?: number;
  staff_member_id?: string;
  is_created_by_user: boolean;
  created_at: string;
  staff_members?: AdminStaffMember;
  users: AdminUser;
}

export interface ReservationsQueryParams {
  staff_member_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export const adminReservationsApi = {
  async getReservations(
    params?: ReservationsQueryParams
  ): Promise<ApiResponse<AdminReservation[]>> {
    const queryParams = new URLSearchParams();
    if (params?.staff_member_id && params.staff_member_id !== 'all') {
      queryParams.set('staff_member_id', params.staff_member_id);
    }
    if (params?.start_date) {
      queryParams.set('start_date', params.start_date);
    }
    if (params?.end_date) {
      queryParams.set('end_date', params.end_date);
    }
    if (params?.limit) {
      queryParams.set('limit', params.limit.toString());
    }

    const url = buildAdminApiUrl(
      `/api/admin/reservations?${queryParams.toString()}`
    );
    return fetchApi<AdminReservation[]>(url);
  },

  async deleteReservation(
    reservationId: string
  ): Promise<ApiResponse<{ message: string }>> {
    const url = buildAdminApiUrl(`/api/admin/reservations?id=${reservationId}`);
    return fetchApi<{ message: string }>(url, {
      method: 'DELETE',
    });
  },

  async getRecentReservations(
    limit: number = 5
  ): Promise<ApiResponse<AdminReservation[]>> {
    const url = buildAdminApiUrl(
      `/api/admin/recent-reservations?limit=${limit}`
    );
    return fetchApi<AdminReservation[]>(url);
  },

  async getUnassignedReservations(): Promise<ApiResponse<AdminReservation[]>> {
    const url = buildAdminApiUrl(
      '/api/admin/reservations?staff_member_id=unassigned'
    );
    return fetchApi<AdminReservation[]>(url);
  },
};
