import type { CookieOptions, Response } from 'express';
import { env } from '../config/env';

const REFRESH_COOKIE = 'refreshToken';

const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/v1/auth',
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
