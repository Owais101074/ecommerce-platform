import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import { clearRefreshCookie } from '../../utils/cookies';
import * as userService from './user.service';
import type { ChangePasswordInput, UpdateProfileInput } from './user.validation';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  return req.user.id;
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await userService.getProfile(requireUserId(req));
  sendSuccess(res, 200, 'Profile fetched', { user });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const user = await userService.updateProfile(requireUserId(req), req.body as UpdateProfileInput);
  sendSuccess(res, 200, 'Profile updated', { user });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  await userService.changePassword(requireUserId(req), req.body as ChangePasswordInput);
  clearRefreshCookie(res);
  sendSuccess(res, 200, 'Password changed. Please sign in again.');
}
