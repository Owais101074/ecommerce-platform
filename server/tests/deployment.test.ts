import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { env } from '../src/config/env';
import { connectTestDb, disconnectTestDb } from './helpers/db';

const allowedOrigin = env.CORS_ORIGIN.split(',')[0]?.trim() ?? 'http://localhost:5173';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

describe('liveness and readiness', () => {
  it('reports liveness without depending on the database', async () => {
    const response = await request(app).get('/api/v1/health/live').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({ status: 'ok' });
    expect(response.body.data.uptime).toEqual(expect.any(Number));
    expect(response.body.data.database).toBeUndefined();
  });

  it('keeps readiness tied to the database connection', async () => {
    const response = await request(app).get('/api/v1/health').expect(200);

    expect(response.body.data).toMatchObject({ status: 'ok', database: 'connected' });
  });
});

describe('CORS preflight', () => {
  it('advertises the CSRF header so cross-site refresh is possible', async () => {
    const response = await request(app)
      .options('/api/v1/auth/refresh')
      .set('Origin', allowedOrigin)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'x-csrf-token')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(response.headers['access-control-allow-headers']).toContain('X-CSRF-Token');
  });
});

describe('cookie flags', () => {
  it('marks the refresh cookie HttpOnly and leaves CSRF readable', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Cookie Tester',
        email: `cookies-${randomUUID()}@example.com`,
        password: 'Password123!',
      })
      .expect(201);

    const header = response.headers['set-cookie'] as unknown as string[];
    const refresh = header.find((entry) => entry.startsWith('refreshToken='));
    const csrf = header.find((entry) => entry.startsWith('csrfToken='));

    expect(refresh).toBeDefined();
    expect(refresh).toMatch(/HttpOnly/i);
    expect(refresh).toMatch(/Path=\/api\/v1\/auth/i);
    expect(refresh).toMatch(/SameSite=Lax/i);
    // Tests run as NODE_ENV=test, so cookies must not be Secure-only.
    expect(refresh).not.toMatch(/;\s*Secure/i);

    expect(csrf).toBeDefined();
    expect(csrf).not.toMatch(/HttpOnly/i);
    expect(csrf).toMatch(/SameSite=Lax/i);
  });
});
