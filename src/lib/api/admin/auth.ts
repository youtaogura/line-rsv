import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import type { ChangePasswordData } from './types';

export const adminAuthApi = {
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