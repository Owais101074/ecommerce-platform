import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import type { Response } from 'supertest';
import { User } from '../../src/modules/auth/auth.model';
import { signAccessToken } from '../../src/utils/jwt';

export interface TestUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface TestSession {
  accessToken: string;
  refreshCookie: string;
  csrfToken: string;
  user: TestUser;
}

export function parseCookies(response: Response): Record<string, string> {
  const header = response.headers['set-cookie'];
  const entries = Array.isArray(header) ? header : header ? [String(header)] : [];
  const cookies: Record<string, string> = {};

  for (const entry of entries) {
    const pair = entry.split(';')[0];

    if (!pair) {
      continue;
    }

    const separator = pair.indexOf('=');

    if (separator === -1) {
      continue;
    }

    cookies[pair.slice(0, separator)] = decodeURIComponent(pair.slice(separator + 1));
  }

  return cookies;
}

export function cookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join('; ');
}

export function bearer(token: string): string {
  return `Bearer ${token}`;
}

export interface RegisterOverrides {
  name?: string;
  email?: string;
  password?: string;
}

export async function registerCustomer(
  app: Express,
  overrides: RegisterOverrides = {},
): Promise<TestSession> {
  const payload = {
    name: 'Test Customer',
    email: `customer-${randomUUID()}@example.com`,
    password: 'Password123!',
    ...overrides,
  };

  const response = await request(app).post('/api/v1/auth/register').send(payload).expect(201);
  const cookies = parseCookies(response);

  return {
    accessToken: response.body.data.accessToken as string,
    refreshCookie: cookies['refreshToken'] ?? '',
    csrfToken: cookies['csrfToken'] ?? '',
    user: response.body.data.user as TestUser,
  };
}

export async function promoteToAdmin(session: TestSession): Promise<TestSession> {
  await User.updateOne({ _id: session.user.id }, { role: 'admin' });
  const user = await User.findById(session.user.id);

  return {
    ...session,
    accessToken: signAccessToken(session.user.id, 'admin', user?.tokenVersion ?? 0),
    user: { ...session.user, role: 'admin' },
  };
}
