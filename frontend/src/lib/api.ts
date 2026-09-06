/**
 * Centralized API Client & Base URL Configuration
 *
 * Automatically resolves the backend API URL for:
 * 1. Cloud Production (Vercel): Reads NEXT_PUBLIC_API_URL (e.g., Render backend URL)
 * 2. Local Development: Defaults to http://localhost:5000
 */

export const getApiBaseUrl = (): string => {
  // 1. Explicit External URL: Reads NEXT_PUBLIC_API_URL if configured (e.g. Render/Railway)
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // 2. Client-side browser: Use same-origin relative paths (e.g. /api/members) for unified Vercel deployment
  if (typeof window !== 'undefined') {
    return '';
  }

  // 3. Server-side default fallback
  return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
};

export const API_BASE = getApiBaseUrl();

/**
 * Helper to build fully qualified API endpoint URLs
 * @param endpoint Relative API endpoint (e.g., "/api/health" or "api/members")
 */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = getApiBaseUrl();
  return `${base}${cleanEndpoint}`;
};

export default API_BASE;
