// Export all API modules
export { adminApi } from './admin';
export { availabilityApi } from './availability';
export { businessHoursApi } from './businessHours';
export { reservationApi } from './reservation';
export { reservationMenuApi } from './reservationMenu';
export { staffApi } from './staff';
export { tenantApi } from './tenant';
export { timeSlotsApi } from './timeSlots';
export { userApi } from './user';

// Export types and base utilities
export { buildAdminApiUrl, fetchApi } from './base';
export type { ApiResponse } from './types';
