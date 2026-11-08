export type PaymentMode = 'mock' | 'razorpay';

export type PaymentRecordStatus = 'created' | 'paid' | 'failed' | 'refund_pending' | 'refunded';

export interface PaymentDTO {
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
  paidAt: Date | null;
  refundId: string | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StartPaymentDTO extends PaymentDTO {
  keyId: string;
}

export interface MockCredentials {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
