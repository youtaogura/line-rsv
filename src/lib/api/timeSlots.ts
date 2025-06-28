import type { TimeSlot } from "@/components/reservation/types";
import type { ApiResponse } from "./types";
import { fetchApi, buildTenantApiUrl } from "./base";

export const timeSlotsApi = {
  async getAvailableSlots(
    date: Date, 
    tenantId: string, 
    staffId?: string
  ): Promise<ApiResponse<TimeSlot[]>> {
    const dateStr = date.toISOString().split('T')[0];
    let url = buildTenantApiUrl(`/api/available-slots?date=${dateStr}`, tenantId);
    
    if (staffId) {
      url += `&staff_member_id=${staffId}`;
    }
    
    return fetchApi<TimeSlot[]>(url);
  },
};