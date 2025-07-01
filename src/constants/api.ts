export const API_ENDPOINTS = {
  AUTH: {
    NEXTAUTH: '/api/auth/[...nextauth]',
    DEV: '/api/auth/dev',
    LINE: '/api/auth/line',
    LINE_CALLBACK: '/api/auth/line/callback',
  },
  RESERVATIONS: '/api/public/reservations',
  BUSINESS_HOURS: '/api/public/business-hours',
  USERS: '/api/public/users',
  USER: '/api/public/user',
  TENANTS: '/api/public/tenants',
  AVAILABILITY: {
    MONTHLY: '/api/public/availability/monthly',
  },
  RESERVATION_MENU: '/api/public/reservation-menu',
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
