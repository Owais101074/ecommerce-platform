import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { invalidateProductCache } from '../src/infra/cache';
import { Product } from '../src/modules/products/product.model';
import { bearer, promoteToAdmin, registerCustomer } from './helpers/auth';
import { clearTestDb, connectTestDb, disconnectTestDb } from './helpers/db';
import { createCategory, createProduct } from './helpers/factories';

interface ProductDetailBody {
  data: { product: { price: number } };
}

beforeAll(connectTestDb);
beforeEach(clearTestDb);
afterAll(disconnectTestDb);

describe('request correlation', () => {
  it('reuses a safe incoming X-Request-Id', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .set('X-Request-Id', 'test-request-1234')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('test-request-1234');
  });

  it('replaces an unsafe incoming X-Request-Id', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .set('X-Request-Id', 'not a safe id!')
      .expect(200);

    expect(response.headers['x-request-id']).not.toBe('not a safe id!');
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/);
  });

  it('reports the configured infrastructure drivers', async () => {
    const response = await request(app).get('/api/v1/health').expect(200);

    expect(response.body.data.infrastructure).toEqual({
      cache: 'memory',
      queue: 'memory',
      mail: 'log',
    });
  });
});

describe('catalogue cache', () => {
  it('serves a cached product until the catalogue cache is invalidated', async () => {
    const category = await createCategory();
    const product = await createProduct(category._id, { price: 50_000 });

    const first = await request(app).get(`/api/v1/products/${product.slug}`).expect(200);
    expect((first.body as ProductDetailBody).data.product.price).toBe(50_000);

    // Bypass the service on purpose: only a cache hit can still return the old price.
    await Product.updateOne({ _id: product._id }, { $set: { price: 60_000 } });

    const cached = await request(app).get(`/api/v1/products/${product.slug}`).expect(200);
    expect((cached.body as ProductDetailBody).data.product.price).toBe(50_000);

    await invalidateProductCache();

    const refreshed = await request(app).get(`/api/v1/products/${product.slug}`).expect(200);
    expect((refreshed.body as ProductDetailBody).data.product.price).toBe(60_000);
  });

  it('invalidates the cache when an admin updates a product', async () => {
    const category = await createCategory();
    const product = await createProduct(category._id, { price: 50_000 });
    const admin = await promoteToAdmin(await registerCustomer(app));

    await request(app).get(`/api/v1/products/${product.slug}`).expect(200);

    await request(app)
      .patch(`/api/v1/products/${product.id}`)
      .set('Authorization', bearer(admin.accessToken))
      .send({ price: 75_000 })
      .expect(200);

    const refreshed = await request(app).get(`/api/v1/products/${product.slug}`).expect(200);
    expect((refreshed.body as ProductDetailBody).data.product.price).toBe(75_000);
  });
});
