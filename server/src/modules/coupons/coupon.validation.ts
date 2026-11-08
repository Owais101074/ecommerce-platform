import { z } from 'zod';

const couponCodeSchema = z
  .string()
  .trim()
  .min(2, 'Coupon code is too short')
  .max(30, 'Coupon code is too long')
  .regex(/^[A-Za-z0-9_-]+$/, 'Coupon code can only contain letters, numbers, - and _')
  .transform((value) => value.toUpperCase());

const couponTypeSchema = z.enum(['percentage', 'fixed']);

export const validateCouponSchema = z.object({
  code: couponCodeSchema,
});

export const createCouponSchema = z
  .object({
    code: couponCodeSchema,
    description: z.string().trim().max(200, 'Description is too long').nullable().optional(),
    type: couponTypeSchema,
    value: z.number().int('Value must be a whole number').positive('Value must be positive'),
    minOrder: z.number().int().min(0).default(0),
    maxDiscount: z.number().int().positive().nullable().optional(),
    startsAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    maxUses: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => value.type !== 'percentage' || value.value <= 100, {
    message: 'Percentage coupons cannot exceed 100',
    path: ['value'],
  })
  .refine((value) => value.type !== 'fixed' || value.value >= 100, {
    message: 'Fixed discount must be at least ₹1',
    path: ['value'],
  })
  .refine((value) => !value.startsAt || !value.expiresAt || value.expiresAt > value.startsAt, {
    message: 'Expiry must be after the start date',
    path: ['expiresAt'],
  });

export const updateCouponSchema = z.object({
  code: couponCodeSchema.optional(),
  description: z.string().trim().max(200, 'Description is too long').nullable().optional(),
  type: couponTypeSchema.optional(),
  value: z
    .number()
    .int('Value must be a whole number')
    .positive('Value must be positive')
    .optional(),
  minOrder: z.number().int().min(0).optional(),
  maxDiscount: z.number().int().positive().nullable().optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const adminCouponListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(30).optional(),
  active: z.enum(['true', 'false']).optional(),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type AdminCouponListQuery = z.infer<typeof adminCouponListQuerySchema>;
