import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';

const RAZORPAY_ORDERS_URL = 'https://api.razorpay.com/v1/orders';

interface RazorpayOrderResponse {
  id?: string;
  amount?: number;
  currency?: string;
}

export interface ProviderOrderInput {
  receipt: string;
  amount: number;
  currency: string;
  notes: Record<string, string>;
}

export function isMockMode(): boolean {
  return env.PAYMENT_MODE === 'mock';
}

export function generateMockOrderId(): string {
  return `order_mock_${randomBytes(8).toString('hex')}`;
}

export function generateMockPaymentId(): string {
  return `pay_mock_${randomBytes(8).toString('hex')}`;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/** Constant-time comparison that also rejects different lengths before timingSafeEqual. */
export function safeCompare(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function expectedPaymentSignature(
  providerOrderId: string,
  providerPaymentId: string,
): string {
  return sign(`${providerOrderId}|${providerPaymentId}`, env.RAZORPAY_KEY_SECRET);
}

export function isValidPaymentSignature(
  providerOrderId: string,
  providerPaymentId: string,
  signature: string,
): boolean {
  return safeCompare(
    expectedPaymentSignature(providerOrderId, providerPaymentId),
    signature.toLowerCase(),
  );
}

export function isValidWebhookSignature(rawBody: Buffer, signature: string): boolean {
  if (!signature) {
    return false;
  }

  const expected = sign(rawBody.toString('utf8'), env.RAZORPAY_WEBHOOK_SECRET);
  return safeCompare(expected, signature.toLowerCase());
}

export async function createProviderOrder(input: ProviderOrderInput): Promise<string> {
  if (isMockMode()) {
    return generateMockOrderId();
  }

  let response: Response;

  try {
    response = await fetch(RAZORPAY_ORDERS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`,
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        receipt: input.receipt,
        notes: input.notes,
        payment_capture: 1,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error('[payments] Razorpay order request failed', error);
    throw new ApiError(502, 'Payment gateway is unavailable');
  }

  if (!response.ok) {
    console.error(`[payments] Razorpay order rejected with status ${response.status}`);
    throw new ApiError(502, 'Payment gateway rejected the order');
  }

  const body = (await response.json()) as RazorpayOrderResponse;

  if (!body.id || body.amount !== input.amount || body.currency !== input.currency) {
    console.error('[payments] Razorpay order response did not match the request');
    throw new ApiError(502, 'Payment gateway returned an unexpected order');
  }

  return body.id;
}
