// Export all admin APIs
export * from './admin';

// Export all public APIs
export * from './public';

// Export shared utilities and types
export { fetchApi } from './shared/utils';
export type { ApiResponse } from './shared/types';

// Explicit exports for better compatibility
export { buildAdminApiUrl } from './admin/base';
export { buildPublicApiUrl } from './public/base';