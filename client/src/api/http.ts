import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/lib/env';
import type { ApiSuccess } from '@/types/api';
import type { AuthSession } from '@/types/auth';
import { toApiError } from './errors';
import { clearAccessToken, getAccessToken, notifySessionExpired, setAccessToken } from './session';

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/** These endpoints must never trigger another refresh attempt. */
const NO_REFRESH_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<ApiSuccess<AuthSession>>(
      `${API_BASE_URL}/auth/refresh`,
      undefined,
      { withCredentials: true, timeout: 15_000 },
    );

    const token = data.data.accessToken;
    setAccessToken(token);
    return token;
  } catch {
    clearAccessToken();
    return null;
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    const url = config?.url ?? '';
    const shouldRefresh =
      error.response?.status === 401 &&
      config !== undefined &&
      config._retried !== true &&
      !NO_REFRESH_ROUTES.some((route) => url.includes(route));

    if (!shouldRefresh) {
      throw toApiError(error);
    }

    config._retried = true;

    // Every 401 that happens while a refresh is in flight waits on the same promise.
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const token = await refreshPromise;

    if (!token) {
      notifySessionExpired();
      throw toApiError(error);
    }

    config.headers.Authorization = `Bearer ${token}`;
    return http(config);
  },
);
