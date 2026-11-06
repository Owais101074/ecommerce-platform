import { z } from 'zod';

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

const pincodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter a valid 6-digit pincode');

const addressFields = {
  label: z.string().trim().min(1, 'Label is required').max(30, 'Label is too long'),
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(80, 'Full name is too long'),
  phone: phoneSchema,
  line1: z
    .string()
    .trim()
    .min(5, 'Address line 1 must be at least 5 characters')
    .max(120, 'Address line 1 is too long'),
  line2: z.string().trim().max(120, 'Address line 2 is too long').optional(),
  city: z.string().trim().min(2, 'City is required').max(60, 'City is too long'),
  state: z.string().trim().min(2, 'State is required').max(60, 'State is too long'),
  pincode: pincodeSchema,
  isDefault: z.boolean().optional(),
} as const;

export const createAddressSchema = z.object(addressFields);

export const updateAddressSchema = z
  .object(addressFields)
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'Provide at least one field to update',
  });

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
