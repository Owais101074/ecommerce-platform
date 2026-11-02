import { ApiError } from '../../utils/ApiError';
import {
  getTokenExpiryDate,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { hashPassword, verifyPassword } from '../../utils/password';
import { toAuthUser } from './auth.mapper';
import { User } from './auth.model';
import type { UserDocument } from './auth.model';
import type { AuthResult, TokenPair } from './auth.types';
import type { LoginInput, RegisterInput } from './auth.validation';

async function issueTokens(user: UserDocument): Promise<TokenPair> {
  const userId = user._id.toString();
  const accessToken = signAccessToken(userId, user.role);
  const refreshToken = signRefreshToken(userId);

  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = getTokenExpiryDate(refreshToken);
  await user.save();

  return { accessToken, refreshToken };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const exists = await User.exists({ email: input.email });

  if (exists) {
    throw new ApiError(409, 'Email is already registered');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: 'customer',
  });

  const tokens = await issueTokens(user);

  return { ...tokens, user: toAuthUser(user) };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is disabled');
  }

  const tokens = await issueTokens(user);

  return { ...tokens, user: toAuthUser(user) };
}

export async function refreshSession(refreshToken: string | undefined): Promise<AuthResult> {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  let userId: string;

  try {
    userId = verifyRefreshToken(refreshToken).sub;
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(userId).select('+refreshTokenHash +refreshTokenExpiresAt');

  if (!user) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is disabled');
  }

  if (!user.refreshTokenHash || !user.refreshTokenExpiresAt) {
    throw new ApiError(401, 'Session expired');
  }

  if (user.refreshTokenHash !== hashToken(refreshToken)) {
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await user.save();
    throw new ApiError(401, 'Session expired');
  }

  if (user.refreshTokenExpiresAt.getTime() <= Date.now()) {
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await user.save();
    throw new ApiError(401, 'Session expired');
  }

  const tokens = await issueTokens(user);

  return { ...tokens, user: toAuthUser(user) };
}

export async function logoutUser(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) {
    return;
  }

  let userId: string;

  try {
    userId = verifyRefreshToken(refreshToken).sub;
  } catch {
    return;
  }

  const user = await User.findById(userId).select('+refreshTokenHash');

  if (!user || !user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
    return;
  }

  user.refreshTokenHash = null;
  user.refreshTokenExpiresAt = null;
  await user.save();
}
