import { z } from 'zod';
import { objectIdSchema } from '../../utils/zod';

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters'),
  description: z.string().trim().max(500, 'Description must be at most 500 characters').optional(),
  parentId: objectIdSchema.nullable().optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters')
    .optional(),
  description: z.string().trim().max(500, 'Description must be at most 500 characters').optional(),
  parentId: objectIdSchema.nullable().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
