import { ApiError } from '../../utils/ApiError';
import { hashPassword, verifyPassword } from '../../utils/password';
import { toAuthUser } from '../auth/auth.mapper';
import { User } from '../auth/auth.model';
import type { AuthUser } from '../auth/auth.types';
import type { ChangePasswordInput, UpdateProfileInput } from './user.validation';

async function findActiveUser(userId: string) {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new ApiError(404, 'User not found');
  }

  return user;
}

export async function getProfile(userId: string): Promise<AuthUser> {
  return toAuthUser(await findActiveUser(userId));
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<AuthUser> {
  const user = await findActiveUser(userId);

  user.name = input.name;
  await user.save();

  return toAuthUser(user);
}

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const user = await User.findById(userId).select(
    '+passwordHash +refreshTokenHash +refreshTokenExpiresAt',
  );

  if (!user || !user.isActive) {
    throw new ApiError(404, 'User not found');
  }

  const currentPasswordMatches = await verifyPassword(input.currentPassword, user.passwordHash);

  if (!currentPasswordMatches) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  const reusingOldPassword = await verifyPassword(input.newPassword, user.passwordHash);

  if (reusingOldPassword) {
    throw new ApiError(400, 'New password must be different from the current password');
  }

  user.passwordHash = await hashPassword(input.newPassword);
  // Every refresh session is revoked; the current access token expires naturally.
  user.refreshTokenHash = null;
  user.refreshTokenExpiresAt = null;
  await user.save();
}
