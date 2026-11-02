import type { ApiSuccess } from '@/types/api';
import type { AuthSession, LoginPayload, RegisterPayload, User } from '@/types/auth';
import { http } from './http';

export async function loginRequest(payload: LoginPayload): Promise<AuthSession> {
  const { data } = await http.post<ApiSuccess<AuthSession>>('/auth/login', payload);
  return data.data;
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthSession> {
  const { data } = await http.post<ApiSuccess<AuthSession>>('/auth/register', payload);
  return data.data;
}

export async function refreshRequest(): Promise<AuthSession> {
  const { data } = await http.post<ApiSuccess<AuthSession>>('/auth/refresh');
  return data.data;
}

export async function logoutRequest(): Promise<void> {
  await http.post('/auth/logout');
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await http.get<ApiSuccess<{ user: User }>>('/auth/me');
  return data.data.user;
}
