/**
 * Base URL API cho frontend
 */

export function getApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();

  // Development
  if (import.meta.env.DEV) {
    return fromEnv || '/api';
  }

  // Production
  if (fromEnv) {
    const v = fromEnv.trim().replace(/\/+$/, '');
    return v.endsWith('/api') ? v : `${v}/api`;
  }

  // Default
  return 'https://api.sportwear.io.vn/api';
}

/**
 * Origin thuần (không path)
 */
export function getApiOrigin() {
  const base = getApiBaseUrl();
  
  if (!/^https?:\/\//i.test(base)) {
    return window.location.origin;
  }
  
  try {
    const url = new URL(base);
    return url.origin;
  } catch {
    return base.replace(/\/api.*$/, '');
  }
}