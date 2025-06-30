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

export function buildUrlWithTenantId(
  path: string,
  tenantId: string | null
): string {
  if (!tenantId) {
    return path;
  }

  const url = new URL(
    path,
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000'
  );
  url.searchParams.set('tenantId', tenantId);
  return url.toString();
}

export function buildApiUrl(path: string, tenantId: string | null): string {
  if (!tenantId) {
    return path;
  }

  const url = new URL(
    path,
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000'
  );
  url.searchParams.set('tenantId', tenantId);
  return url.toString();
}
