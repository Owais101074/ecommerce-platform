import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { Order } from '../orders/order.model';
import type { OrderDocument } from '../orders/order.model';
import { toPaymentDTO } from './payment.mapper';
import { Payment } from './payment.model';
import type { PaymentDocument } from './payment.model';
import * as provider from './payment.provider';
import type { MockCredentials, PaymentDTO, StartPaymentDTO } from './payment.types';
import type { MockCompleteInput, VerifyPaymentInput } from './payment.validation';

const CURRENCY = 'INR';

interface MockCompleteResult {
  payment: PaymentDTO;
  credentials?: MockCredentials;
}

interface WebhookPaymentEntity {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  error_description?: string;
  error_code?: string;
}

interface WebhookPayload {
  event?: string;
  payload?: {
    payment?: {
      entity?: WebhookPaymentEntity;
    };
  };
}

async function findOrder(userId: string, orderId: string): Promise<OrderDocument> {
  const order = await Order.findOne({ _id: orderId, userId });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  return order;
}

async function findPayment(filter: Record<string, unknown>): Promise<PaymentDocument> {
  const payment = await Payment.findOne(filter);

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  return payment;
}

function buildReceipt(order: OrderDocument): string {
  return `${order.orderNumber}-${Date.now().toString(36)}`.slice(0, 40);
}

function toStartDTO(payment: PaymentDocument): StartPaymentDTO {
  return {
    ...toPaymentDTO(payment),
    keyId: payment.provider === 'mock' ? 'mock' : env.RAZORPAY_KEY_ID,
  };
}

async function confirmPayment(
  payment: PaymentDocument,
  providerPaymentId: string,
  rawPayload: unknown,
): Promise<void> {
  await Payment.updateOne(
    { _id: payment._id, status: { $ne: 'paid' } },
    {
      $set: {
        status: 'paid',
        providerPaymentId,
        failureReason: null,
        paidAt: new Date(),
        rawPayload,
      },
    },
  );

  await Order.updateOne(
    { _id: payment.orderId, paymentStatus: { $ne: 'paid' } },
    { $set: { paymentStatus: 'paid' } },
  );
  await Order.updateOne(
    { _id: payment.orderId, status: 'placed' },
    { $set: { status: 'confirmed' } },
  );
}

async function markFailed(
  payment: PaymentDocument,
  reason: string,
  rawPayload: unknown,
): Promise<void> {
  await Payment.updateOne(
    { _id: payment._id, status: { $ne: 'paid' } },
    { $set: { status: 'failed', failureReason: reason, rawPayload } },
  );
  await Order.updateOne(
    { _id: payment.orderId, paymentStatus: { $ne: 'paid' } },
    { $set: { paymentStatus: 'failed' } },
  );
}

export async function startPayment(userId: string, orderId: string): Promise<StartPaymentDTO> {
  const order = await findOrder(userId, orderId);

  if (order.paymentStatus === 'paid') {
    throw new ApiError(409, 'This order is already paid');
  }

  if (order.status === 'cancelled') {
    throw new ApiError(409, 'Cancelled orders cannot be paid');
  }

  const existing = await Payment.findOne({ orderId: order._id });

  if (
    existing &&
    existing.status === 'created' &&
    existing.provider === env.PAYMENT_MODE &&
    existing.amount === order.total
  ) {
    return toStartDTO(existing);
  }

  const providerOrderId = await provider.createProviderOrder({
    receipt: buildReceipt(order),
    amount: order.total,
    currency: CURRENCY,
    notes: { orderNumber: order.orderNumber },
  });

  const payment = existing
    ? await Payment.findOneAndUpdate(
        { _id: existing._id },
        {
          $set: {
            provider: env.PAYMENT_MODE,
            providerOrderId,
            providerPaymentId: null,
            amount: order.total,
            currency: CURRENCY,
            status: 'created',
            failureReason: null,
            rawPayload: null,
            paidAt: null,
          },
          $inc: { attempts: 1 },
        },
        { new: true, runValidators: true },
      )
    : await Payment.create({
        orderId: order._id,
        userId: order.userId,
        provider: env.PAYMENT_MODE,
        providerOrderId,
        amount: order.total,
        currency: CURRENCY,
      });

  if (!payment) {
    throw new ApiError(500, 'Payment could not be started');
  }

  await Order.updateOne(
    { _id: order._id, paymentStatus: 'failed' },
    { $set: { paymentStatus: 'pending' } },
  );

  return toStartDTO(payment);
}

export async function verifyPayment(
  userId: string,
  input: VerifyPaymentInput,
): Promise<PaymentDTO> {
  const payment = await findPayment({
    providerOrderId: input.razorpay_order_id,
    userId,
  });

  if (
    !provider.isValidPaymentSignature(
      input.razorpay_order_id,
      input.razorpay_payment_id,
      input.razorpay_signature,
    )
  ) {
    throw new ApiError(400, 'Payment signature verification failed');
  }

  if (payment.status === 'paid') {
    if (payment.providerPaymentId === input.razorpay_payment_id) {
      return toPaymentDTO(payment);
    }

    throw new ApiError(409, 'This payment is already completed');
  }

  await confirmPayment(payment, input.razorpay_payment_id, { source: 'verify', ...input });

  return toPaymentDTO(await findPayment({ _id: payment._id }));
}

export async function abandonPayment(userId: string, orderId: string): Promise<PaymentDTO> {
  const payment = await findPayment({ orderId, userId });

  if (payment.status === 'paid' || payment.status === 'failed') {
    return toPaymentDTO(payment);
  }

  await markFailed(payment, 'abandoned', { source: 'abandon' });

  return toPaymentDTO(await findPayment({ _id: payment._id }));
}

export async function mockCompletePayment(
  userId: string,
  input: MockCompleteInput,
): Promise<MockCompleteResult> {
  if (!provider.isMockMode()) {
    throw new ApiError(404, 'Not found');
  }

  const payment = await findPayment({ orderId: input.orderId, userId });

  if (payment.status === 'paid') {
    throw new ApiError(409, 'Payment is already completed');
  }

  if (payment.status !== 'created') {
    throw new ApiError(409, 'Start a new payment attempt first');
  }

  if (input.outcome === 'failure') {
    await markFailed(payment, 'simulated_failure', { source: 'mock', outcome: input.outcome });
    return { payment: toPaymentDTO(await findPayment({ _id: payment._id })) };
  }

  const providerPaymentId = provider.generateMockPaymentId();

  return {
    credentials: {
      razorpay_order_id: payment.providerOrderId,
      razorpay_payment_id: providerPaymentId,
      razorpay_signature: provider.expectedPaymentSignature(
        payment.providerOrderId,
        providerPaymentId,
      ),
    },
    payment: toPaymentDTO(payment),
  };
}

export async function handleWebhookEvent(
  rawBody: Buffer,
  signature: string,
): Promise<{ handled: boolean }> {
  if (!provider.isValidWebhookSignature(rawBody, signature)) {
    throw new ApiError(400, 'Invalid webhook signature');
  }

  let payload: WebhookPayload;

  try {
    payload = JSON.parse(rawBody.toString('utf8')) as WebhookPayload;
  } catch {
    throw new ApiError(400, 'Invalid webhook payload');
  }

  const event = payload.event ?? '';
  const entity = payload.payload?.payment?.entity;

  if (!entity?.order_id || !entity.id) {
    return { handled: false };
  }

  const payment = await Payment.findOne({ providerOrderId: entity.order_id });

  if (!payment) {
    return { handled: false };
  }

  if (
    entity.amount !== payment.amount ||
    (entity.currency && entity.currency !== payment.currency)
  ) {
    console.error(`[payments] Webhook amount mismatch for provider order ${entity.order_id}`);
    return { handled: false };
  }

  if (event === 'payment.captured' || event === 'order.paid') {
    await confirmPayment(payment, entity.id, payload);
    return { handled: true };
  }

  if (event === 'payment.failed') {
    await markFailed(
      payment,
      entity.error_description ?? entity.error_code ?? 'payment_failed',
      payload,
    );
    return { handled: true };
  }

  return { handled: false };
}
