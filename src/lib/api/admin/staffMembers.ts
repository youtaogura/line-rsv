import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import { buildAdminApiUrl } from './base';

export interface AdminStaffMember {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AdminStaffMemberBusinessHour {
  id: string;
  staff_member_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffMemberData {
  name: string;
}

export interface CreateStaffBusinessHourData {
  staff_member_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface CreateAllStaffBusinessHoursData {
  staff_member_id: string;
  day_of_week: number;
}

export const adminStaffMembersApi = {
  async getStaffMembers(): Promise<ApiResponse<AdminStaffMember[]>> {
    const url = buildAdminApiUrl('/api/admin/staff-members');
    return fetchApi<AdminStaffMember[]>(url);
  },

  async createStaffMember(data: CreateStaffMemberData): Promise<ApiResponse<AdminStaffMember>> {
    const url = buildAdminApiUrl('/api/admin/staff-members');
    return fetchApi<AdminStaffMember>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  async updateStaffMember(id: string, data: CreateStaffMemberData): Promise<ApiResponse<AdminStaffMember>> {
    const url = buildAdminApiUrl(`/api/admin/staff-members?id=${id}`);
    return fetchApi<AdminStaffMember>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  async deleteStaffMember(id: string): Promise<ApiResponse<{ message: string }>> {
    const url = buildAdminApiUrl(`/api/admin/staff-members?id=${id}`);
    return fetchApi<{ message: string }>(url, {
      method: 'DELETE',
    });
  },

  async getStaffMemberBusinessHours(staffMemberId: string): Promise<ApiResponse<AdminStaffMemberBusinessHour[]>> {
    const url = buildAdminApiUrl(`/api/admin/staff-member-business-hours?staff_member_id=${staffMemberId}`);
    return fetchApi<AdminStaffMemberBusinessHour[]>(url);
  },

  async createStaffMemberBusinessHour(data: CreateStaffBusinessHourData): Promise<ApiResponse<AdminStaffMemberBusinessHour>> {
    const url = buildAdminApiUrl('/api/admin/staff-member-business-hours');
    return fetchApi<AdminStaffMemberBusinessHour>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  async deleteStaffMemberBusinessHour(id: string): Promise<ApiResponse<{ message: string }>> {
    const url = buildAdminApiUrl(`/api/admin/staff-member-business-hours?id=${id}`);
    return fetchApi<{ message: string }>(url, {
      method: 'DELETE',
    });
  },

  async createAllStaffMemberBusinessHours(data: CreateAllStaffBusinessHoursData): Promise<ApiResponse<AdminStaffMemberBusinessHour[]>> {
    const url = buildAdminApiUrl('/api/admin/staff-member-business-hours/bulk-create');
    return fetchApi<AdminStaffMemberBusinessHour[]>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },
};