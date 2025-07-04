export function buildPublicApiUrl(
  endpoint: string,
  tenantId: string | null
): string {
  if (!tenantId) {
    throw new Error('Tenant ID is required for API calls');
  }

  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set('tenantId', tenantId);
  return url.toString();
}