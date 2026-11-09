const fallbackApiUrl = 'http://localhost:5000/api/v1';
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

// Vite inlines VITE_* at build time, so a production build without it would
// silently ship a client pointing at localhost.
if (import.meta.env.PROD && !configuredApiUrl) {
  console.warn('[env] VITE_API_URL is unset; this production build will call localhost.');
}

export const API_BASE_URL = (configuredApiUrl || fallbackApiUrl).replace(/\/+$/, '');
