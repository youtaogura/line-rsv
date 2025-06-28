import type { StaffMember, StaffMemberBusinessHour } from "@/lib/supabase";
import type { ApiResponse } from "./types";
import { fetchApi, buildTenantApiUrl } from "./base";

export const staffApi = {
  async getStaffMembers(tenantId: string): Promise<ApiResponse<StaffMember[]>> {
    const url = buildTenantApiUrl("/api/staff-members", tenantId);
    return fetchApi<StaffMember[]>(url);
  },
  
  async getStaffMemberBusinessHours(tenantId: string): Promise<ApiResponse<StaffMemberBusinessHour[]>> {
    const url = buildTenantApiUrl("/api/staff-member-business-hours", tenantId);
    return fetchApi<StaffMemberBusinessHour[]>(url);
  },
};