import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';
import { CSRF_COOKIE_NAME } from '../utils/cookies';

function tokensMatch(cookieToken: string, headerToken: string): boolean {
  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  return cookieBuffer.length === headerBuffer.length && timingSafeEqual(cookieBuffer, headerBuffer);
}

/**
 * Double-submit CSRF check for endpoints authenticated by the refresh cookie.
 * Access-token routes are already protected because a cross-site page cannot
 * set the Authorization header.
 */
export const requireCsrf: RequestHandler = (req, _res, next) => {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const cookieToken = cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers['x-csrf-token'];

  if (
    typeof cookieToken !== 'string' ||
    typeof headerToken !== 'string' ||
    !tokensMatch(cookieToken, headerToken)
  ) {
    next(new ApiError(403, 'Invalid or missing CSRF token'));
    return;
  }

  next();
};
