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

const orderStatusSchema = z.enum(['placed', 'confirmed', 'shipped', 'delivered', 'cancelled']);

export const adminOrderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: orderStatusSchema.optional(),
  userId: objectIdSchema.optional(),
});

export const adminUpdateOrderStatusSchema = z
  .object({
    status: z.enum(['confirmed', 'shipped', 'delivered', 'cancelled']),
    note: z.string().trim().max(300, 'Note is too long').optional(),
    carrier: z.string().trim().min(2, 'Carrier name is too short').max(80).optional(),
    trackingNumber: z.string().trim().min(4, 'Tracking number is too short').max(60).optional(),
  })
  .refine((value) => Boolean(value.carrier) === Boolean(value.trackingNumber), {
    message: 'Carrier and tracking number must be provided together',
    path: ['trackingNumber'],
  })
  .refine((value) => value.status !== 'shipped' || Boolean(value.carrier && value.trackingNumber), {
    message: 'Shipping requires a carrier and tracking number',
    path: ['carrier'],
  });

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;
export type AdminUpdateOrderStatusInput = z.infer<typeof adminUpdateOrderStatusSchema>;
