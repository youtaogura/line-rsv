export const API_ENDPOINTS = {
  AUTH: {
    NEXTAUTH: '/api/auth/[...nextauth]',
    DEV: '/api/auth/dev',
    LINE: '/api/auth/line',
    LINE_CALLBACK: '/api/auth/line/callback',
  },
  RESERVATIONS: '/api/reservations',
  BUSINESS_HOURS: '/api/business-hours',
  USERS: '/api/users',
  USER: '/api/user',
  TENANTS: '/api/tenants',
  AVAILABILITY: {
    MONTHLY: '/api/availability/monthly',
  },
  RESERVATION_MENU: '/api/reservation-menu',
  NOTIFY: '/api/notify',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;
