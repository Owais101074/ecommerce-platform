import type { PaymentDocument } from './payment.model';
import type { PaymentDTO } from './payment.types';

export function toPaymentDTO(payment: PaymentDocument): PaymentDTO {
  return {
    id: payment._id.toString(),
    orderId: payment.orderId.toString(),
    provider: payment.provider,
    providerOrderId: payment.providerOrderId,
    providerPaymentId: payment.providerPaymentId ?? null,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    failureReason: payment.failureReason ?? null,
    attempts: payment.attempts,
    paidAt: payment.paidAt ?? null,
    refundId: payment.refundId ?? null,
    refundedAt: payment.refundedAt ?? null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}
