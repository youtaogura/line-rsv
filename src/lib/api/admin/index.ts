// Export admin API modules
export { adminReservationApi } from './reservation';
export { adminAuthApi } from './auth';
export { adminNotificationsApi } from './notifications';
export { adminReservationsApi } from './reservations';
export { adminBusinessHoursApi } from './businessHours';
export { adminUsersApi } from './users';
export { adminStaffMembersApi } from './staffMembers';
export { adminTenantsApi } from './tenants';

// Export admin utilities
export { buildAdminApiUrl } from './base';

// Export admin types
export type { CreateAdminReservationData, ChangePasswordData } from './types';
export type { Notification } from './notifications';
export type { AdminReservation, ReservationsQueryParams } from './reservations';
export type { AdminBusinessHour, CreateBusinessHourData } from './businessHours';
export type { AdminUser, UpdateUserData, MergeUserData, MergeUserResult } from './users';
export type { AdminStaffMember, AdminStaffMemberBusinessHour, CreateStaffMemberData, CreateStaffBusinessHourData } from './staffMembers';
export type { AdminTenant } from './tenants';

// Import for consolidation
import { adminReservationApi } from './reservation';
import { adminAuthApi } from './auth';
import { adminNotificationsApi } from './notifications';
import { adminReservationsApi } from './reservations';
import { adminBusinessHoursApi } from './businessHours';
import { adminUsersApi } from './users';
import { adminStaffMembersApi } from './staffMembers';
import { adminTenantsApi } from './tenants';

// Consolidated admin API object for backward compatibility
export const adminApi = {
  ...adminReservationApi,
  ...adminAuthApi,
  ...adminNotificationsApi,
  ...adminReservationsApi,
  ...adminBusinessHoursApi,
  ...adminUsersApi,
  ...adminStaffMembersApi,
  ...adminTenantsApi,
};