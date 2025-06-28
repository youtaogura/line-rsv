import { buildApiUrl } from "@/lib/tenant-helpers";
import type { 
  User, 
  Reservation, 
  StaffMember, 
  ReservationMenu, 
  BusinessHour 
} from "@/lib/supabase";
import type { TimeSlot } from "@/components/reservation/types";

interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Base fetch function with error handling
async function fetchApi<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`,
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// User-related API functions
export const userApi = {
  async getUser(userId: string, tenantId: string): Promise<ApiResponse<User>> {
    const url = buildApiUrl(`/api/users/${userId}`, tenantId);
    return fetchApi<User>(url);
  },
  
  async getUserReservations(userId: string, tenantId: string): Promise<ApiResponse<Reservation[]>> {
    const url = buildApiUrl(`/api/reservations?user_id=${userId}`, tenantId);
    return fetchApi<Reservation[]>(url);
  },
};

// Tenant-related API functions
export const tenantApi = {
  async getTenant(tenantId: string): Promise<ApiResponse<{tenant_id: string; name: string}>> {
    const url = buildApiUrl(`/api/tenants/${tenantId}`, tenantId);
    return fetchApi(url);
  },
};

// Staff-related API functions
export const staffApi = {
  async getStaffMembers(tenantId: string): Promise<ApiResponse<StaffMember[]>> {
    const url = buildApiUrl("/api/staff-members", tenantId);
    return fetchApi<StaffMember[]>(url);
  },
};

// Reservation menu API functions
export const reservationMenuApi = {
  async getReservationMenu(tenantId: string): Promise<ApiResponse<ReservationMenu | null>> {
    const url = buildApiUrl("/api/reservation-menu", tenantId);
    const result = await fetchApi<ReservationMenu>(url);
    
    // 404 is expected for optional reservation menu
    if (!result.success && result.error?.includes("404")) {
      return {
        success: true,
        data: null,
      };
    }
    
    return result;
  },
};

// Business hours API functions
export const businessHoursApi = {
  async getBusinessHours(tenantId: string): Promise<ApiResponse<BusinessHour[]>> {
    const url = buildApiUrl("/api/business-hours", tenantId);
    return fetchApi<BusinessHour[]>(url);
  },
};

// Time slots API functions
export const timeSlotsApi = {
  async getAvailableSlots(
    date: Date, 
    tenantId: string, 
    staffId?: string
  ): Promise<ApiResponse<TimeSlot[]>> {
    const dateStr = date.toISOString().split('T')[0];
    let url = buildApiUrl(`/api/available-slots?date=${dateStr}`, tenantId);
    
    if (staffId) {
      url += `&staff_member_id=${staffId}`;
    }
    
    return fetchApi<TimeSlot[]>(url);
  },
};

// Reservation API functions
export const reservationApi = {
  async createReservation(
    reservationData: {
      user_id: string;
      name: string;
      datetime: string;
      note?: string;
      member_type: "regular" | "guest";
      phone?: string;
      reservation_menu_id?: string;
      staff_member_id?: string;
    },
    tenantId: string
  ): Promise<ApiResponse<any>> {
    const url = buildApiUrl("/api/reservations", tenantId);
    
    return fetchApi(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...reservationData,
        admin_note: null,
        is_admin_mode: false,
      }),
    });
  },
};