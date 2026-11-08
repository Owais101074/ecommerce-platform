import { randomBytes } from 'node:crypto';
import type { CookieOptions, Response } from 'express';
import { env } from '../config/env';

const REFRESH_COOKIE = 'refreshToken';

export const CSRF_COOKIE_NAME = 'csrfToken';

const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/v1/auth',
};

const csrfOptions: CookieOptions = {
  httpOnly: false,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    ...baseOptions,
    maxAge: env.JWT_REFRESH_TTL_SECONDS * 1000,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, baseOptions);
}

/**
 * The CSRF cookie is readable by the browser on purpose: the client copies it
 * into a header, and the server only accepts cookie-authenticated writes when
 * both values match. A cross-site page can send the cookie but cannot read it.
 */
export function setCsrfCookie(res: Response): string {
  const token = randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, token, {
    ...csrfOptions,
    maxAge: env.JWT_REFRESH_TTL_SECONDS * 1000,
  });
  return token;
}

export function clearCsrfCookie(res: Response): void {
  res.clearCookie(CSRF_COOKIE_NAME, csrfOptions);
}
