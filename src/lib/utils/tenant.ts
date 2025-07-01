import { NextRequest } from 'next/server';

export function getTenantIdFromUrl(url?: string): string | null {
  const targetUrl =
    url || (typeof window !== 'undefined' ? window.location.href : '');

  if (!targetUrl) {
    return null;
  }

  try {
    const urlObj = new URL(targetUrl);
    return urlObj.searchParams.get('tenantId');
  } catch {
    return null;
  }
}

export function getTenantIdFromRequest(
  request: NextRequest | Request | { url: string }
): string | null {
  return getTenantIdFromUrl(request.url);
}
