import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import { buildAdminApiUrl } from './base';

export interface Notification {
  id: string;
  read_at: string | null;
  title: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export const adminNotificationsApi = {
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    const url = buildAdminApiUrl('/api/admin/notifications');
    return fetchApi<Notification[]>(url);
  },

  async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    const url = buildAdminApiUrl(`/api/admin/notifications?id=${notificationId}`);
    return fetchApi<Notification>(url, {
      method: 'PUT',
    });
  },
};