import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { AccessTokenPayload, RefreshTokenPayload, UserRole } from '../modules/auth/auth.types';

const ROLES: UserRole[] = ['customer', 'admin'];

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(userId: string, role: UserRole): string {
  const payload: AccessTokenPayload = { sub: userId, role, type: 'access' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL_SECONDS });
}

export function signRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = {
    sub: userId,
    jti: crypto.randomUUID(),
    type: 'refresh',
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL_SECONDS });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

  if (
    typeof decoded === 'string' ||
    decoded.type !== 'access' ||
    typeof decoded.sub !== 'string' ||
    !ROLES.includes(decoded.role as UserRole)
  ) {
    throw new jwt.JsonWebTokenError('Invalid access token payload');
  }

  return { sub: decoded.sub, role: decoded.role as UserRole, type: 'access' };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);

  if (
    typeof decoded === 'string' ||
    decoded.type !== 'refresh' ||
    typeof decoded.sub !== 'string' ||
    typeof decoded.jti !== 'string'
  ) {
    throw new jwt.JsonWebTokenError('Invalid refresh token payload');
  }

  return { sub: decoded.sub, jti: decoded.jti, type: 'refresh' };
}

export function getTokenExpiryDate(token: string): Date {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded === 'string' || typeof decoded.exp !== 'number') {
    throw new jwt.JsonWebTokenError('Token has no expiry');
  }

  return new Date(decoded.exp * 1000);
}
