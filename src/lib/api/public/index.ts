// Export public API modules
export { publicAvailabilityApi } from './availability';
export { publicBusinessHoursApi } from './businessHours';
export { publicReservationApi } from './reservation';
export { publicReservationMenuApi } from './reservationMenu';
export { publicStaffApi } from './staff';
export { publicTenantApi } from './tenant';
export { publicTimeSlotsApi } from './timeSlots';
export { publicUserApi } from './user';

// Export public utilities
export { buildPublicApiUrl } from './base';

// Export public types
export type { CreateReservationData } from './types';

// Import for consolidation
import { publicAvailabilityApi } from './availability';
import { publicBusinessHoursApi } from './businessHours';
import { publicReservationApi } from './reservation';
import { publicReservationMenuApi } from './reservationMenu';
import { publicStaffApi } from './staff';
import { publicTenantApi } from './tenant';
import { publicTimeSlotsApi } from './timeSlots';
import { publicUserApi } from './user';

// Consolidated public API objects for backward compatibility
export const availabilityApi = publicAvailabilityApi;
export const businessHoursApi = publicBusinessHoursApi;
export const reservationApi = publicReservationApi;
export const reservationMenuApi = publicReservationMenuApi;
export const staffApi = publicStaffApi;
export const tenantApi = publicTenantApi;
export const timeSlotsApi = publicTimeSlotsApi;
export const userApi = publicUserApi;