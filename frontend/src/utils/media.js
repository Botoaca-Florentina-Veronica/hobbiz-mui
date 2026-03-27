/**
 * Normalize media URLs received from backend.
 * Handles absolute URLs, /uploads paths, uploads/ paths, and plain filenames.
 */
export function resolveMediaUrl(src) {
  if (!src || typeof src !== 'string') return '';

  const value = src.trim();
  if (!value) return '';

  // Absolute URL or protocol-relative URL
  if (/^https?:\/\//i.test(value) || value.startsWith('//')) {
    return value;
  }

  // Root-relative static/media paths
  if (value.startsWith('/uploads/') || value.startsWith('/images/') || value.startsWith('/static/')) {
    return value;
  }

  // uploads/foo.jpg -> /uploads/foo.jpg
  if (value.startsWith('uploads/')) {
    return `/${value}`;
  }

  // Other root-relative paths
  if (value.startsWith('/')) {
    return value;
  }

  // Fallback: treat as filename/path and map under uploads.
  const fileName = value.replace(/^.*[\\/]/, '');
  return `/uploads/${fileName}`;
}
