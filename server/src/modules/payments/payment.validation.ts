import { z } from 'zod';
import { objectIdSchema } from '../../utils/zod';

export const startPaymentSchema = z.object({
  orderId: objectIdSchema,
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().trim().min(1, 'Payment order id is required').max(120),
  razorpay_payment_id: z.string().trim().min(1, 'Payment id is required').max(120),
  razorpay_signature: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{64}$/, 'Payment signature must be a 64-character hex string'),
});

export const abandonPaymentSchema = z.object({
  orderId: objectIdSchema,
});

export const mockCompleteSchema = z.object({
  orderId: objectIdSchema,
  outcome: z.enum(['success', 'failure']),
});

export type StartPaymentInput = z.infer<typeof startPaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type AbandonPaymentInput = z.infer<typeof abandonPaymentSchema>;
export type MockCompleteInput = z.infer<typeof mockCompleteSchema>;
