import type { RequestHandler } from 'express';
import { User } from '../modules/auth/auth.model';
import { toAuthUser } from '../modules/auth/auth.mapper';
import type { UserRole } from '../modules/auth/auth.types';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }

    const token = header.slice(7).trim();

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new ApiError(401, 'Account is not available');
    }

    req.user = toAuthUser(user);
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    next(new ApiError(401, 'Invalid or expired access token'));
  }
};

export function authorize(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, 'Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, 'You do not have permission to perform this action'));
      return;
    }

    next();
  };
}
