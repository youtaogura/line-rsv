// Authentication
export { useAdminSession } from './useAdminSession';

// Reservations
export {
  useAdminReservations,
  useAdminRecentReservations,
  useAdminUnassignedReservations,
} from './useAdminReservations';

// Business Hours
export { useAdminBusinessHours } from './useAdminBusinessHours';

// Users
export { useAdminUsers } from './useAdminUsers';

// Staff Members
export {
  useAdminStaffMembers,
  useAdminStaffMemberBusinessHours,
} from './useAdminStaffMembers';

// Tenant
export { useAdminTenant } from './useAdminTenant';

// Legacy aliases for backward compatibility
export { useAdminReservations as useReservations } from './useAdminReservations';
export { useAdminBusinessHours as useBusinessHours } from './useAdminBusinessHours';
export { useAdminUsers as useUsers } from './useAdminUsers';
export { useAdminStaffMembers as useStaffMembers } from './useAdminStaffMembers';
export { useAdminStaffMemberBusinessHours as useStaffMemberBusinessHours } from './useAdminStaffMembers';
export { useAdminTenant as useTenant } from './useAdminTenant';
export { useAdminRecentReservations as useRecentReservations } from './useAdminReservations';
export { useAdminUnassignedReservations as useUnassignedReservations } from './useAdminReservations';