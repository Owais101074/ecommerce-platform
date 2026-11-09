import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { waitForQueueIdle } from '../src/infra/queue';
import { getMailOutbox } from '../src/modules/notifications/mailer';
import { bearer, promoteToAdmin, registerCustomer } from './helpers/auth';
import type { TestSession } from './helpers/auth';
import { clearTestDb, connectTestDb, disconnectTestDb } from './helpers/db';
import { createAddress, createCategory, createProduct } from './helpers/factories';

const SUBJECT_BY_KIND = {
  placed: 'We received your order',
  confirmed: 'Your payment is confirmed',
  shipped: 'Your order is on the way',
  delivered: 'Your order was delivered',
  cancelled: 'Your order was cancelled',
} as const;

type MailKind = keyof typeof SUBJECT_BY_KIND;

interface OrderBody {
  data: { order: { id: string; orderNumber: string } };
}

interface MockCompleteBody {
  data: {
    credentials: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };
  };
}

function emails(kind: MailKind) {
  return getMailOutbox().filter((mail) => mail.subject.startsWith(SUBJECT_BY_KIND[kind]));
}

async function createOrder(session: TestSession): Promise<{ orderId: string }> {
  const category = await createCategory();
  const product = await createProduct(category._id, { stock: 10 });
  const address = await createAddress(session.user.id);

  await request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', bearer(session.accessToken))
    .send({ productId: product.id, quantity: 1 })
    .expect(200);

  const response = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', bearer(session.accessToken))
    .send({ addressId: address.id })
    .expect(201);

  const order = (response.body as OrderBody).data.order;

  return { orderId: order.id };
}

async function payOrder(session: TestSession, orderId: string) {
  await request(app)
    .post('/api/v1/payments/start')
    .set('Authorization', bearer(session.accessToken))
    .send({ orderId })
    .expect(200);

  const mock = await request(app)
    .post('/api/v1/payments/mock/complete')
    .set('Authorization', bearer(session.accessToken))
    .send({ orderId, outcome: 'success' })
    .expect(200);

  const credentials = (mock.body as MockCompleteBody).data.credentials;

  await request(app)
    .post('/api/v1/payments/verify')
    .set('Authorization', bearer(session.accessToken))
    .send(credentials)
    .expect(200);

  return credentials;
}

beforeAll(connectTestDb);
beforeEach(clearTestDb);
afterAll(disconnectTestDb);

describe('order email notifications', () => {
  it('sends placed and confirmed emails once, even when verify is repeated', async () => {
    const session = await registerCustomer(app);
    const { orderId } = await createOrder(session);

    await waitForQueueIdle();
    expect(emails('placed')).toHaveLength(1);
    expect(emails('placed')[0]?.to).toBe(session.user.email);

    const credentials = await payOrder(session, orderId);
    await waitForQueueIdle();
    expect(emails('confirmed')).toHaveLength(1);

    // The payment is already paid: this is an idempotent replay, not a new confirmation.
    await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', bearer(session.accessToken))
      .send(credentials)
      .expect(200);

    await waitForQueueIdle();
    expect(emails('confirmed')).toHaveLength(1);
  });

  it('sends shipped and delivered emails after admin transitions', async () => {
    const session = await registerCustomer(app);
    const { orderId } = await createOrder(session);
    await payOrder(session, orderId);
    await waitForQueueIdle();

    const admin = await promoteToAdmin(session);

    await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .set('Authorization', bearer(admin.accessToken))
      .send({ status: 'shipped', carrier: 'BlueDart', trackingNumber: 'BD123456789' })
      .expect(200);

    await waitForQueueIdle();
    expect(emails('shipped')).toHaveLength(1);
    expect(emails('shipped')[0]?.text).toContain('BD123456789');

    await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .set('Authorization', bearer(admin.accessToken))
      .send({ status: 'delivered' })
      .expect(200);

    await waitForQueueIdle();
    expect(emails('delivered')).toHaveLength(1);
  });

  it('sends a cancellation email only when the order actually changes', async () => {
    const session = await registerCustomer(app);
    const { orderId } = await createOrder(session);

    await request(app)
      .patch(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', bearer(session.accessToken))
      .expect(200);

    await waitForQueueIdle();
    expect(emails('cancelled')).toHaveLength(1);

    // Cancelling again is idempotent and must not send a second email.
    await request(app)
      .patch(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', bearer(session.accessToken))
      .expect(200);

    await waitForQueueIdle();
    expect(emails('cancelled')).toHaveLength(1);
  });
});
