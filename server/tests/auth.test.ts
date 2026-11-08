import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/modules/auth/auth.model';
import {
  bearer,
  cookieHeader,
  parseCookies,
  promoteToAdmin,
  registerCustomer,
} from './helpers/auth';
import { clearTestDb, connectTestDb, disconnectTestDb } from './helpers/db';

interface AuthBody {
  success: boolean;
  data: {
    user: { id: string; name: string; email: string; role: string };
    accessToken: string;
  };
}

interface ErrorBody {
  success: boolean;
  message: string;
}

beforeAll(connectTestDb);
beforeEach(clearTestDb);
afterAll(disconnectTestDb);

describe('POST /api/v1/auth/register', () => {
  it('creates a customer and sets HttpOnly refresh plus readable CSRF cookies', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Asha Rao', email: 'asha@example.com', password: 'Password123!' })
      .expect(201);

    const body = response.body as AuthBody;
    expect(body.success).toBe(true);
    expect(body.data.user).toMatchObject({ email: 'asha@example.com', role: 'customer' });
    expect(body.data.accessToken).toEqual(expect.any(String));

    const setCookie = response.headers['set-cookie'] as unknown as string[];
    expect(
      setCookie.some((entry) => entry.startsWith('refreshToken=') && /HttpOnly/i.test(entry)),
    ).toBe(true);
    expect(
      setCookie.some((entry) => entry.startsWith('csrfToken=') && !/HttpOnly/i.test(entry)),
    ).toBe(true);
  });

  it('rejects a duplicate email', async () => {
    await registerCustomer(app, { email: 'duplicate@example.com' });

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Second User', email: 'duplicate@example.com', password: 'Password123!' })
      .expect(409);

    expect((response.body as ErrorBody).success).toBe(false);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('rejects a wrong password', async () => {
    const session = await registerCustomer(app);

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: session.user.email, password: 'WrongPassword123!' })
      .expect(401);
  });
});

describe('authenticated access', () => {
  it('returns the current user for a valid access token', async () => {
    const session = await registerCustomer(app);

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', bearer(session.accessToken))
      .expect(200);

    const body = response.body as AuthBody;
    expect(body.data.user.id).toBe(session.user.id);
  });

  it('rejects a deactivated user', async () => {
    const session = await registerCustomer(app);
    await User.updateOne({ _id: session.user.id }, { isActive: false }).exec();

    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', bearer(session.accessToken))
      .expect(401);
  });

  it('forbids customers from admin routes and allows promoted admins', async () => {
    const customer = await registerCustomer(app);

    await request(app)
      .post('/api/v1/products')
      .set('Authorization', bearer(customer.accessToken))
      .send({})
      .expect(403);

    const admin = await promoteToAdmin(customer);

    await request(app)
      .get('/api/v1/admin/ping')
      .set('Authorization', bearer(admin.accessToken))
      .expect(200);
  });
});

describe('refresh and logout with CSRF protection', () => {
  it('rejects refresh without the CSRF header', async () => {
    const session = await registerCustomer(app);

    await request(app)
      .post('/api/v1/auth/refresh')
      .set(
        'Cookie',
        cookieHeader({ refreshToken: session.refreshCookie, csrfToken: session.csrfToken }),
      )
      .expect(403);
  });

  it('rotates the refresh token and rejects reuse of the old one', async () => {
    const session = await registerCustomer(app);

    const refreshed = await request(app)
      .post('/api/v1/auth/refresh')
      .set(
        'Cookie',
        cookieHeader({ refreshToken: session.refreshCookie, csrfToken: session.csrfToken }),
      )
      .set('X-CSRF-Token', session.csrfToken)
      .expect(200);

    const rotated = parseCookies(refreshed);
    expect(rotated.refreshToken).toBeTruthy();
    expect(rotated.refreshToken).not.toBe(session.refreshCookie);
    expect((refreshed.body as AuthBody).data.accessToken).toEqual(expect.any(String));

    await request(app)
      .post('/api/v1/auth/refresh')
      .set(
        'Cookie',
        cookieHeader({ refreshToken: session.refreshCookie, csrfToken: session.csrfToken }),
      )
      .set('X-CSRF-Token', session.csrfToken)
      .expect(401);
  });

  it('invalidates the session on logout', async () => {
    const session = await registerCustomer(app);
    const cookies = { refreshToken: session.refreshCookie, csrfToken: session.csrfToken };

    await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookieHeader(cookies))
      .set('X-CSRF-Token', session.csrfToken)
      .expect(200);

    await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieHeader(cookies))
      .set('X-CSRF-Token', session.csrfToken)
      .expect(401);
  });
});

describe('PATCH /api/v1/users/me/password', () => {
  it('invalidates existing access tokens after a password change', async () => {
    const session = await registerCustomer(app);

    await request(app)
      .patch('/api/v1/users/me/password')
      .set('Authorization', bearer(session.accessToken))
      .send({ currentPassword: 'Password123!', newPassword: 'NewPassword123!' })
      .expect(200);

    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', bearer(session.accessToken))
      .expect(401);

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: session.user.email, password: 'NewPassword123!' })
      .expect(200);
  });
});
