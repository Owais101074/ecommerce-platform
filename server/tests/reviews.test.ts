import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { bearer, registerCustomer } from './helpers/auth';
import { clearTestDb, connectTestDb, disconnectTestDb } from './helpers/db';
import { createCategory, createProduct } from './helpers/factories';

interface ReviewListBody {
  data: {
    reviews: Array<{ id: string; rating: number; comment: string }>;
    summary: { average: number; count: number };
  };
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface ReviewBody {
  data: {
    review: {
      id: string;
      rating: number;
      comment: string;
      author: { id: string; name: string };
    };
  };
}

async function createReviewProduct() {
  const category = await createCategory();
  return createProduct(category._id, { price: 20_000 });
}

async function postReview(
  productId: string,
  accessToken: string,
  rating: number,
  comment = 'A solid purchase.',
) {
  return request(app)
    .post(`/api/v1/products/${productId}/reviews`)
    .set('Authorization', bearer(accessToken))
    .send({ rating, comment })
    .expect(201);
}

beforeAll(connectTestDb);
beforeEach(clearTestDb);
afterAll(disconnectTestDb);

describe('GET /api/v1/products/:slug/reviews', () => {
  it('returns an empty public list for a product without reviews', async () => {
    const product = await createReviewProduct();

    const response = await request(app).get(`/api/v1/products/${product.slug}/reviews`).expect(200);
    const body = response.body as ReviewListBody;

    expect(body.data.reviews).toEqual([]);
    expect(body.data.summary).toEqual({ average: 0, count: 0 });
    expect(body.meta.total).toBe(0);
  });
});

describe('POST /api/v1/products/:id/reviews', () => {
  it('creates a review and refreshes the product rating', async () => {
    const session = await registerCustomer(app);
    const product = await createReviewProduct();

    const created = await postReview(product.id, session.accessToken, 5, 'Excellent quality.');
    const review = (created.body as ReviewBody).data.review;

    expect(review).toMatchObject({ rating: 5, comment: 'Excellent quality.' });
    expect(review.author.name).toBe(session.user.name);

    const list = await request(app).get(`/api/v1/products/${product.slug}/reviews`).expect(200);
    expect((list.body as ReviewListBody).data.summary).toEqual({ average: 5, count: 1 });
  });

  it('rejects a second review from the same customer', async () => {
    const session = await registerCustomer(app);
    const product = await createReviewProduct();

    await postReview(product.id, session.accessToken, 5);

    await request(app)
      .post(`/api/v1/products/${product.id}/reviews`)
      .set('Authorization', bearer(session.accessToken))
      .send({ rating: 4 })
      .expect(409);
  });
});

describe('PATCH /api/v1/reviews/:id', () => {
  it('allows only the author to edit and recomputes the average', async () => {
    const author = await registerCustomer(app);
    const other = await registerCustomer(app);
    const product = await createReviewProduct();

    const created = await postReview(product.id, author.accessToken, 5);
    const reviewId = (created.body as ReviewBody).data.review.id;

    await postReview(product.id, other.accessToken, 3);

    await request(app)
      .patch(`/api/v1/reviews/${reviewId}`)
      .set('Authorization', bearer(other.accessToken))
      .send({ rating: 4 })
      .expect(403);

    await request(app)
      .patch(`/api/v1/reviews/${reviewId}`)
      .set('Authorization', bearer(author.accessToken))
      .send({ rating: 1, comment: 'Changed my mind.' })
      .expect(200);

    const list = await request(app).get(`/api/v1/products/${product.slug}/reviews`).expect(200);
    expect((list.body as ReviewListBody).data.summary).toEqual({ average: 2, count: 2 });
  });
});

describe('review pagination', () => {
  it('paginates the public list and keeps the full summary', async () => {
    const product = await createReviewProduct();
    const ratings = [5, 4, 4];

    for (const rating of ratings) {
      const session = await registerCustomer(app);
      await postReview(product.id, session.accessToken, rating);
    }

    const firstPage = await request(app)
      .get(`/api/v1/products/${product.slug}/reviews?page=1&limit=2`)
      .expect(200);
    const firstBody = firstPage.body as ReviewListBody;

    expect(firstBody.data.reviews).toHaveLength(2);
    expect(firstBody.data.summary).toEqual({ average: 4.3, count: 3 });
    expect(firstBody.meta).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });

    const secondPage = await request(app)
      .get(`/api/v1/products/${product.slug}/reviews?page=2&limit=2`)
      .expect(200);

    expect((secondPage.body as ReviewListBody).data.reviews).toHaveLength(1);
  });
});
