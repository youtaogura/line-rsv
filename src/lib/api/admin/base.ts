export function buildAdminApiUrl(endpoint: string): string {
  return new URL(endpoint, window.location.origin).toString();
}