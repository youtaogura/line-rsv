import type { StaffMember, StaffMemberBusinessHour } from '@/lib/supabase';
import { buildPublicApiUrl, fetchApi } from './base';
import type { ApiResponse } from './types';

export const staffApi = {
  async getStaffMembers(tenantId: string): Promise<ApiResponse<StaffMember[]>> {
    const url = buildPublicApiUrl('/api/public/staff-members', tenantId);
    return fetchApi<StaffMember[]>(url);
  },

  async getStaffMemberBusinessHours(
    tenantId: string,
    staffMemberId: string | 'all'
  ): Promise<ApiResponse<StaffMemberBusinessHour[]>> {
    const url = buildPublicApiUrl(
      `/api/public/staff-member-business-hours?staff_member_id=${staffMemberId}`,
      tenantId
    );
    return fetchApi<StaffMemberBusinessHour[]>(url);
  },
};
