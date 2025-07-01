import type { StaffMember, StaffMemberBusinessHour } from '@/lib/supabase';
import type { ApiResponse } from './types';
import { fetchApi, buildTenantApiUrl } from './base';

export const staffApi = {
  async getStaffMembers(tenantId: string): Promise<ApiResponse<StaffMember[]>> {
    const url = buildTenantApiUrl('/api/public/staff-members', tenantId);
    return fetchApi<StaffMember[]>(url);
  },

  async getStaffMemberBusinessHours(
    tenantId: string,
    staffMemberId: string | 'all'
  ): Promise<ApiResponse<StaffMemberBusinessHour[]>> {
    const url = buildTenantApiUrl(
      `/api/public/staff-member-business-hours?staff_member_id=${staffMemberId}`,
      tenantId
    );
    return fetchApi<StaffMemberBusinessHour[]>(url);
  },
};
