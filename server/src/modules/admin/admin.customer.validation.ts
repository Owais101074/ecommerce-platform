import { z } from 'zod';

export const adminCustomerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(80).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const adminCustomerStatusSchema = z.object({
  isActive: z.boolean(),
});

export type AdminCustomerListQuery = z.infer<typeof adminCustomerListQuerySchema>;
export type AdminCustomerStatusInput = z.infer<typeof adminCustomerStatusSchema>;
