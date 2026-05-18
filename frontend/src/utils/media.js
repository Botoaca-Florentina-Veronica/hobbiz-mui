/**
 * Normalize media URLs received from backend.
 * Handles absolute URLs, /uploads paths, uploads/ paths, and plain filenames.
 *
 * In production the frontend is served from a different origin than the
 * backend (e.g. Netlify vs Render), so root-relative paths like
 * "/uploads/foo.jpg" would otherwise resolve to the frontend domain and 404.
 * This util prefixes them with the API base URL so they always reach the
 * backend that actually serves the uploaded media.
 */

// Resolve the API base URL the same way `api/api.js` does, but without
// importing the axios instance (avoids any chance of a circular-import issue
// for a module that ends up being touched very early in the render tree).
function getApiBase() {
  let base = import.meta.env.VITE_API_URL;
  if (!base) {
    const isDev = import.meta.env.MODE === 'development';
    if (isDev) {
      // In dev Vite proxies /uploads to the backend, so a relative URL works.
      base = '';
    } else if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (/\.netlify\.app$/.test(host)) {
        base = 'https://hobbiz-mui.onrender.com';
      } else {
        base = window.location.origin;
      }
    } else {
      base = '';
    }
  }
  return String(base || '').replace(/\/$/, '');
}

export function resolveMediaUrl(src) {
  if (!src || typeof src !== 'string') return '';

  const value = src.trim();
  if (!value) return '';

  // Absolute URL, protocol-relative URL or data URL — return as-is
  if (/^https?:\/\//i.test(value) || value.startsWith('//') || value.startsWith('data:')) {
    return value;
  }

  const apiBase = getApiBase();

  // Root-relative static/media paths — must be served by the backend
  if (value.startsWith('/uploads/') || value.startsWith('/images/') || value.startsWith('/static/')) {
    return `${apiBase}${value}`;
  }

  // uploads/foo.jpg -> {apiBase}/uploads/foo.jpg
  if (value.startsWith('uploads/')) {
    return `${apiBase}/${value}`;
  }

  // Other root-relative paths
  if (value.startsWith('/')) {
    return `${apiBase}${value}`;
  }

  // Fallback: treat as filename/path and map under uploads on the backend.
  const fileName = value.replace(/^.*[\\/]/, '');
  return `${apiBase}/uploads/${fileName}`;
}
