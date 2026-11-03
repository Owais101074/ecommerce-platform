import type { ApiSuccess } from '@/types/api';
import type { ChangePasswordPayload, UpdateProfilePayload, User } from '@/types/auth';
import { http } from './http';

export async function updateProfileRequest(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await http.patch<ApiSuccess<{ user: User }>>('/users/me', payload);
  return data.data.user;
}

export async function changePasswordRequest(payload: ChangePasswordPayload): Promise<string> {
  const { data } = await http.patch<ApiSuccess<unknown>>('/users/me/password', payload);
  return data.message;
}
