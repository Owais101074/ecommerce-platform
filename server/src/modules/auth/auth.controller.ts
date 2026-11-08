import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import {
  clearCsrfCookie,
  clearRefreshCookie,
  setCsrfCookie,
  setRefreshCookie,
} from '../../utils/cookies';
import * as authService from './auth.service';
import type { LoginInput, RegisterInput } from './auth.validation';

function getRefreshToken(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const token = cookies?.['refreshToken'];
  return typeof token === 'string' ? token : undefined;
}

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.registerUser(req.body as RegisterInput);
  setRefreshCookie(res, result.refreshToken);
  setCsrfCookie(res);
  sendSuccess(res, 201, 'Account created successfully', {
    user: result.user,
    accessToken: result.accessToken,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.loginUser(req.body as LoginInput);
  setRefreshCookie(res, result.refreshToken);
  setCsrfCookie(res);
  sendSuccess(res, 200, 'Logged in successfully', {
    user: result.user,
    accessToken: result.accessToken,
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const result = await authService.refreshSession(getRefreshToken(req));
    setRefreshCookie(res, result.refreshToken);
    setCsrfCookie(res);
    sendSuccess(res, 200, 'Session refreshed', {
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    clearRefreshCookie(res);
    clearCsrfCookie(res);
    throw error;
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logoutUser(getRefreshToken(req));
  clearRefreshCookie(res);
  clearCsrfCookie(res);
  sendSuccess(res, 200, 'Logged out successfully');
}

export function me(req: Request, res: Response): void {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  sendSuccess(res, 200, 'Current user', { user: req.user });
}
