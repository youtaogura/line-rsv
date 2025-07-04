import type { StaffMembersApiResponse } from '@/app/api/public/staff-members/route';
import type { StaffMemberBusinessHoursApiResponse } from '@/app/api/public/staff-member-business-hours/route';
import { fetchApi } from '../shared/utils';
import type { ApiResponse } from '../shared/types';
import { buildPublicApiUrl } from './base';

export const publicStaffApi = {
  async getStaffMembers(tenantId: string): Promise<ApiResponse<StaffMembersApiResponse>> {
    const url = buildPublicApiUrl('/api/public/staff-members', tenantId);
    return fetchApi<StaffMembersApiResponse>(url);
  },

  async getStaffMemberBusinessHours(
    tenantId: string,
    staffMemberId: string | 'all'
  ): Promise<ApiResponse<StaffMemberBusinessHoursApiResponse>> {
    const url = buildPublicApiUrl(
      `/api/public/staff-member-business-hours?staff_member_id=${staffMemberId}`,
      tenantId
    );
    return fetchApi<StaffMemberBusinessHoursApiResponse>(url);
  },
};