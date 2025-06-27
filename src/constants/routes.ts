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
    USERS: '/admin/users',
  },
  
  // API routes
  API: {
    AUTH: '/api/auth',
    RESERVATIONS: '/api/reservations',
    BUSINESS_HOURS: '/api/business-hours',
    USERS: '/api/users',
    TENANTS: '/api/tenants',
    USER: '/api/user',
  },
} as const;

export const AUTH_CALLBACKS = {
  ADMIN_LOGIN: '/admin/login',
  LINE_CALLBACK: '/api/auth/line/callback',
} as const;