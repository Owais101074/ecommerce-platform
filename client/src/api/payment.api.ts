import type { ApiSuccess } from '@/types/api';
import type {
  MockCompleteResult,
  PaymentCredentials,
  PaymentRecord,
  StartPaymentResult,
} from '@/types/payment';
import { http } from './http';

export async function startPaymentRequest(orderId: string): Promise<StartPaymentResult> {
  const { data } = await http.post<ApiSuccess<{ payment: StartPaymentResult }>>('/payments/start', {
    orderId,
  });
  return data.data.payment;
}

export async function verifyPaymentRequest(
  credentials: PaymentCredentials,
): Promise<PaymentRecord> {
  const { data } = await http.post<ApiSuccess<{ payment: PaymentRecord }>>(
    '/payments/verify',
    credentials,
  );
  return data.data.payment;
}

export async function abandonPaymentRequest(orderId: string): Promise<PaymentRecord> {
  const { data } = await http.post<ApiSuccess<{ payment: PaymentRecord }>>('/payments/abandon', {
    orderId,
  });
  return data.data.payment;
}

export async function mockCompletePaymentRequest(
  orderId: string,
  outcome: 'success' | 'failure',
): Promise<MockCompleteResult> {
  const { data } = await http.post<ApiSuccess<MockCompleteResult>>('/payments/mock/complete', {
    orderId,
    outcome,
  });
  return data.data;
}
