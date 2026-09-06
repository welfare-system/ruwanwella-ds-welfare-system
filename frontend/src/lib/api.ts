/**
 * Centralized API Client & Base URL Configuration
 *
 * Automatically resolves the backend API URL for:
 * 1. Cloud Production (Vercel): Reads NEXT_PUBLIC_API_URL (e.g., Render backend URL)
 * 2. Local Development: Defaults to http://localhost:5000
 */

export const getApiBaseUrl = (): string => {
  // Check build-time or runtime public environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }

  // Client-side hostname detection fallback
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }
  }

  // Server-side / default fallback
  return "http://localhost:5000";
};

export const API_BASE = getApiBaseUrl();

/**
 * Helper to build fully qualified API endpoint URLs
 * @param endpoint Relative API endpoint (e.g., "/api/health" or "api/members")
 */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
};

export default API_BASE;
