import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { env } from '../src/config/env';
import { connectTestDb, disconnectTestDb } from './helpers/db';

const allowedOrigin = env.CORS_ORIGIN.split(',')[0]?.trim() ?? 'http://localhost:5173';

interface ErrorBody {
  success: boolean;
  message: string;
}

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

describe('security headers', () => {
  it('sets helmet headers and hides the Express fingerprint', async () => {
    const response = await request(app).get('/api/v1/health').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toEqual(expect.any(String));
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('returns JSON for unknown routes instead of the HTML error page', async () => {
    const response = await request(app).get('/api/v1/definitely-not-a-route').expect(404);

    expect((response.body as ErrorBody).success).toBe(false);
  });

  it('rejects JSON bodies larger than 10kb', async () => {
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: `${'a'.repeat(20_000)}@example.com`, password: 'Password123!' })
      .expect(413);
  });
});

describe('CORS policy', () => {
  it('allows the configured client origin', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .set('Origin', allowedOrigin)
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rejects an unknown origin', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://evil.example.com')
      .expect(403);

    expect((response.body as ErrorBody).success).toBe(false);
  });
});

describe('rate limiting', () => {
  it('attaches rate-limit headers to API responses', async () => {
    const response = await request(app).get('/api/v1/health').expect(200);
    const rateLimitHeaders = Object.keys(response.headers).filter((name) =>
      name.toLowerCase().includes('ratelimit'),
    );

    expect(rateLimitHeaders.length).toBeGreaterThan(0);
  });
});
