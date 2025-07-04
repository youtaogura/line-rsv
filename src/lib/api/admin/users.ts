import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import { buildAdminApiUrl } from './base';

export interface AdminUser {
  user_id: string;
  tenant_id: string;
  name: string;
  phone?: string;
  member_type: 'regular' | 'guest';
  created_at: string;
}

export interface UpdateUserData {
  name: string;
  phone: string;
  member_type: 'regular' | 'guest';
}

export interface MergeUserData {
  target_user_id: string;
}

export interface MergeUserResult {
  updated_user: AdminUser;
  merged_reservations_count: number;
}

export const adminUsersApi = {
  async getUsers(): Promise<ApiResponse<AdminUser[]>> {
    const url = buildAdminApiUrl('/api/admin/users');
    return fetchApi<AdminUser[]>(url);
  },

  async updateUser(userId: string, data: UpdateUserData): Promise<ApiResponse<AdminUser>> {
    const url = buildAdminApiUrl(`/api/admin/users/${userId}`);
    return fetchApi<AdminUser>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  async mergeUser(sourceUserId: string, data: MergeUserData): Promise<ApiResponse<MergeUserResult>> {
    const url = buildAdminApiUrl(`/api/admin/users/${sourceUserId}/merge`);
    return fetchApi<MergeUserResult>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },
};