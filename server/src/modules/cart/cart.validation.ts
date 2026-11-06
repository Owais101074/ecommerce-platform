import { z } from 'zod';
import { objectIdSchema } from '../../utils/zod';

export const MAX_CART_QUANTITY = 10;

const quantitySchema = z
  .number()
  .int('Quantity must be an integer')
  .min(1, 'Quantity must be at least 1')
  .max(MAX_CART_QUANTITY, `Quantity cannot exceed ${MAX_CART_QUANTITY}`);

export const addCartItemSchema = z.object({
  productId: objectIdSchema,
  quantity: quantitySchema.default(1),
});

export const updateCartItemSchema = z.object({
  quantity: quantitySchema,
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
