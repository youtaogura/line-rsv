export const ROUTES = {
  // Public routes
  HOME: '/',
  RESERVE: '/reserve',
  ERROR: '/error',

  // Admin routes
  ADMIN: {
    ROOT: '/admin',
    LOGIN: '/admin/login',
    RESERVATIONS: '/admin/reservations',
    BUSINESS_HOURS: '/admin/business-hours',
    STAFF: '/admin/staff',
    USERS: '/admin/users',
  },

  // API routes
  API: {
    AUTH: '/api/auth',
    RESERVATIONS: '/api/public/reservations',
    BUSINESS_HOURS: '/api/public/business-hours',
    USERS: '/api/public/users',
    TENANTS: '/api/public/tenants',
    USER: '/api/public/user',
  },
} as const;

export const AUTH_CALLBACKS = {
  ADMIN_LOGIN: '/admin/login',
  LINE_CALLBACK: '/api/auth/line/callback',
} as const;
