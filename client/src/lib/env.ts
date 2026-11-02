const fallbackApiUrl = 'http://localhost:5000/api/v1';

export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? fallbackApiUrl).replace(/\/+$/, '');
