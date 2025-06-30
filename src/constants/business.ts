export const BUSINESS_HOURS = {
  OPEN_TIME: 9,
  CLOSE_TIME: 18,
  DEFAULT_DURATION: 30, // minutes
  TIME_SLOT_INTERVAL: 30, // minutes
} as const;

export const MEMBER_TYPES = {
  REGULAR: 'regular',
  GUEST: 'guest',
} as const;

export const RESERVATION_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
} as const;

export type MemberType = (typeof MEMBER_TYPES)[keyof typeof MEMBER_TYPES];
export type ReservationStatus =
  (typeof RESERVATION_STATUS)[keyof typeof RESERVATION_STATUS];
