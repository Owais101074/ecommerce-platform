import { z } from 'zod';
import { objectIdSchema } from '../../utils/zod';

const couponCodeSchema = z
  .string()
  .trim()
  .min(2, 'Coupon code is too short')
  .max(30, 'Coupon code is too long');

export const placeOrderSchema = z.object({
  addressId: objectIdSchema,
  couponCode: couponCodeSchema.optional(),
});

export const quoteSchema = z.object({
  couponCode: couponCodeSchema.optional(),
});

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
