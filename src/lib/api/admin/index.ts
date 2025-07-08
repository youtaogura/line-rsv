// Export admin API modules
export { adminAuthApi } from './auth';
export { adminBusinessHoursApi } from './businessHours';
export { adminNotificationsApi } from './notifications';
export { adminReservationApi } from './reservation';
export { adminReservationsApi } from './reservations';
export { adminStaffMembersApi } from './staffMembers';
export { adminTenantsApi } from './tenants';
export { adminUsersApi } from './users';

// Export admin utilities
export { buildAdminApiUrl } from './base';

// Export admin types
export type {
  AdminBusinessHour,
  CreateBusinessHourData,
} from './businessHours';
export type { Notification } from './notifications';
export type { AdminReservation, ReservationsQueryParams } from './reservations';
export type {
  AdminStaffMember,
  AdminStaffMemberBusinessHour,
  CreateStaffBusinessHourData,
  CreateStaffMemberData,
  CreateAllStaffBusinessHoursData,
} from './staffMembers';
export type { AdminTenant } from './tenants';
export type { ChangePasswordData, CreateAdminReservationData } from './types';
export type {
  AdminUser,
  MergeUserData,
  MergeUserResult,
  UpdateUserData,
} from './users';

// Import for consolidation
import { adminAuthApi } from './auth';
import { adminAvailabilityApi } from './availability';
import { adminBusinessHoursApi } from './businessHours';
import { adminNotificationsApi } from './notifications';
import { adminReservationApi } from './reservation';
import { adminReservationsApi } from './reservations';
import { adminStaffMembersApi } from './staffMembers';
import { adminTenantsApi } from './tenants';
import { adminUsersApi } from './users';

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
  ...adminAvailabilityApi,
};
