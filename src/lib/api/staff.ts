import type { StaffMember } from "@/lib/supabase";
import type { ApiResponse } from "./types";
import { fetchApi, buildTenantApiUrl } from "./base";

export const staffApi = {
  async getStaffMembers(tenantId: string): Promise<ApiResponse<StaffMember[]>> {
    const url = buildTenantApiUrl("/api/staff-members", tenantId);
    return fetchApi<StaffMember[]>(url);
  },
};