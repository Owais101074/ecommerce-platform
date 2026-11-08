import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { Coupon } from '../src/modules/coupons/coupon.model';
import { Product } from '../src/modules/products/product.model';
import { bearer, registerCustomer } from './helpers/auth';
import { clearTestDb, connectTestDb, disconnectTestDb } from './helpers/db';
import { createAddress, createCategory, createCoupon, createProduct } from './helpers/factories';

interface CartBody {
  data: {
    cart: {
      itemCount: number;
      subtotal: number;
      items: Array<{ quantity: number }>;
    };
  };
}

interface QuoteBody {
  data: {
    quote: {
      subtotal: number;
      tax: number;
      shipping: number;
      discount: number;
      total: number;
      itemCount: number;
      couponCode: string | null;
    };
  };
}

interface PlaceBody {
  data: {
    order: {
      id: string;
      status: string;
      paymentStatus: string;
      subtotal: number;
      tax: number;
      shipping: number;
      discount: number;
      total: number;
      couponCode: string | null;
    };
  };
}

async function createShopper(options: { price?: number; stock?: number; quantity?: number } = {}) {
  const session = await registerCustomer(app);
  const category = await createCategory();
  const product = await createProduct(category._id, {
    price: options.price ?? 50_000,
    stock: options.stock ?? 10,
  });
  const address = await createAddress(session.user.id);
  const quantity = options.quantity ?? 2;

  await request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', bearer(session.accessToken))
    .send({ productId: product.id, quantity })
    .expect(200);

  return { session, product, address, quantity };
}

beforeAll(connectTestDb);
beforeEach(clearTestDb);
afterAll(disconnectTestDb);

describe('POST /api/v1/orders/quote', () => {
  it('prices two units with free shipping and included GST', async () => {
    const { session } = await createShopper();

    const response = await request(app)
      .post('/api/v1/orders/quote')
      .set('Authorization', bearer(session.accessToken))
      .send({})
      .expect(200);

    expect((response.body as QuoteBody).data.quote).toMatchObject({
      subtotal: 100_000,
      tax: 15_254,
      shipping: 0,
      discount: 0,
      total: 100_000,
      itemCount: 2,
      couponCode: null,
    });
  });

  it('applies a capped coupon and re-adds shipping below the threshold', async () => {
    const { session } = await createShopper();
    const coupon = await createCoupon({ type: 'percentage', value: 10, maxDiscount: 5_000 });

    const response = await request(app)
      .post('/api/v1/orders/quote')
      .set('Authorization', bearer(session.accessToken))
      .send({ couponCode: coupon.code })
      .expect(200);

    expect((response.body as QuoteBody).data.quote).toMatchObject({
      subtotal: 100_000,
      tax: 14_492,
      shipping: 4_900,
      discount: 5_000,
      total: 99_900,
      couponCode: coupon.code,
    });
  });
});

describe('POST /api/v1/orders', () => {
  it('decrements stock, clears the cart and records the coupon use', async () => {
    const { session, product, address } = await createShopper();
    const coupon = await createCoupon({ type: 'percentage', value: 10, maxDiscount: 5_000 });

    const response = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', bearer(session.accessToken))
      .send({ addressId: address.id, couponCode: coupon.code })
      .expect(201);

    expect((response.body as PlaceBody).data.order).toMatchObject({
      status: 'placed',
      paymentStatus: 'pending',
      discount: 5_000,
      total: 99_900,
      couponCode: coupon.code,
    });

    const storedProduct = await Product.findById(product._id);
    expect(storedProduct?.stock).toBe(8);

    const storedCoupon = await Coupon.findById(coupon._id);
    expect(storedCoupon?.usedCount).toBe(1);

    const cartResponse = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', bearer(session.accessToken))
      .expect(200);

    expect((cartResponse.body as CartBody).data.cart.items).toHaveLength(0);
  });

  it('rolls back stock and coupon use when stock runs out', async () => {
    const { session, product, address } = await createShopper({ stock: 2, quantity: 2 });
    const coupon = await createCoupon({ maxUses: null });

    await Product.updateOne({ _id: product._id }, { stock: 1 }).exec();

    await request(app)
      .post('/api/v1/orders')
      .set('Authorization', bearer(session.accessToken))
      .send({ addressId: address.id, couponCode: coupon.code })
      .expect(409);

    expect((await Product.findById(product._id))?.stock).toBe(1);
    expect((await Coupon.findById(coupon._id))?.usedCount).toBe(0);

    const cartResponse = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', bearer(session.accessToken))
      .expect(200);

    expect((cartResponse.body as CartBody).data.cart.items).toHaveLength(1);
  });
});

describe('PATCH /api/v1/orders/:id/cancel', () => {
  it('restores stock and releases the coupon claim', async () => {
    const { session, product, address } = await createShopper();
    const coupon = await createCoupon({ maxUses: 5 });

    const placed = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', bearer(session.accessToken))
      .send({ addressId: address.id, couponCode: coupon.code })
      .expect(201);

    const orderId = (placed.body as PlaceBody).data.order.id;

    const cancelled = await request(app)
      .patch(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', bearer(session.accessToken))
      .expect(200);

    expect((cancelled.body as PlaceBody).data.order.status).toBe('cancelled');
    expect((await Product.findById(product._id))?.stock).toBe(10);
    expect((await Coupon.findById(coupon._id))?.usedCount).toBe(0);
  });
});
