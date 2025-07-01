import type { Reservation, User } from '@/lib/supabase';
import { buildPublicApiUrl, fetchApi } from './base';
import type { ApiResponse } from './types';

export const userApi = {
  async getUser(userId: string, tenantId: string): Promise<ApiResponse<User>> {
    const url = buildPublicApiUrl(`/api/public/users/${userId}`, tenantId);
    return fetchApi<User>(url);
  },

  async getUserReservations(
    userId: string,
    tenantId: string
  ): Promise<ApiResponse<Reservation[]>> {
    const url = buildPublicApiUrl(
      `/api/public/reservations?user_id=${userId}`,
      tenantId
    );
    return fetchApi<Reservation[]>(url);
  },
};
