export type PaymentMode = 'mock' | 'razorpay';

export type PaymentRecordStatus = 'created' | 'paid' | 'failed' | 'refunded';

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: PaymentMode;
  providerOrderId: string;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentRecordStatus;
  failureReason: string | null;
  attempts: number;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartPaymentResult extends PaymentRecord {
  keyId: string;
}

export interface PaymentCredentials {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface MockCompleteResult {
  payment: PaymentRecord;
  credentials?: PaymentCredentials;
}
