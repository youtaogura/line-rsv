export const AUTH_CONFIG = {
  JWT_MAX_AGE_HOURS: 8,
  SIGN_IN_PATH: '/admin/login',
  ADMIN_CALLBACK_URL: '/admin/login',
} as const;

export interface JwtCallbackParams {
  token: {
    sub?: string;
    [key: string]: unknown;
  };
  user?: {
    id?: string;
    name?: string | null;
    username?: string;
    tenant_id?: string;
    [key: string]: unknown;
  };
}

export interface SessionCallbackParams {
  session: {
    user?: {
      id?: string;
      name?: string | null;
      username?: string;
      tenant_id?: string;
    };
    [key: string]: unknown;
  };
  token: {
    sub?: string;
    name?: string | null;
    username?: string;
    tenant_id?: string;
    [key: string]: unknown;
  };
}