import type { UserApiResponse } from '@/app/api/public/users/[user_id]/route';
import type { ReservationsApiResponse } from '@/app/api/public/reservations/route';
import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import { buildPublicApiUrl } from './base';

export const publicUserApi = {
  async getUser(userId: string, tenantId: string): Promise<ApiResponse<UserApiResponse>> {
    const url = buildPublicApiUrl(`/api/public/users/${userId}`, tenantId);
    return fetchApi<UserApiResponse>(url);
  },

  async getUserReservations(
    userId: string,
    tenantId: string
  ): Promise<ApiResponse<ReservationsApiResponse>> {
    const url = buildPublicApiUrl(
      `/api/public/reservations?user_id=${userId}`,
      tenantId
    );
    return fetchApi<ReservationsApiResponse>(url);
  },
};