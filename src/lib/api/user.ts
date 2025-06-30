import type { User, Reservation } from '@/lib/supabase';
import type { ApiResponse } from './types';
import { fetchApi, buildTenantApiUrl } from './base';

export const userApi = {
  async getUser(userId: string, tenantId: string): Promise<ApiResponse<User>> {
    const url = buildTenantApiUrl(`/api/users/${userId}`, tenantId);
    return fetchApi<User>(url);
  },

  async getUserReservations(
    userId: string,
    tenantId: string
  ): Promise<ApiResponse<Reservation[]>> {
    const url = buildTenantApiUrl(
      `/api/reservations?user_id=${userId}`,
      tenantId
    );
    return fetchApi<Reservation[]>(url);
  },
};
