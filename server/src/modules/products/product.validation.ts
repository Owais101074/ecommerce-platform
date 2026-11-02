import { z } from 'zod';
import { objectIdSchema } from '../../utils/zod';

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(120, 'Name must be at most 120 characters');

const descriptionSchema = z
  .string()
  .trim()
  .min(20, 'Description must be at least 20 characters')
  .max(5000, 'Description must be at most 5000 characters');

const priceSchema = z
  .number()
  .int('Price must be an integer number of paise')
  .min(0, 'Price cannot be negative');

const imagesSchema = z.array(z.url()).max(5, 'At most 5 images are allowed');

const stockSchema = z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative');

export const createProductSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  price: priceSchema,
  categoryId: objectIdSchema,
  images: imagesSchema.default([]),
  stock: stockSchema.default(0),
});

export const updateProductSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema.optional(),
  price: priceSchema.optional(),
  categoryId: objectIdSchema.optional(),
  images: imagesSchema.optional(),
  stock: stockSchema.optional(),
});

export const updateStockSchema = z.object({
  stock: stockSchema,
});

const productSortSchema = z.enum(['price_asc', 'price_desc', 'newest', 'rating']);

export const productQuerySchema = z
  .object({
    q: z.string().trim().max(100, 'Search term is too long').optional(),
    category: z.string().trim().max(80).optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    inStock: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
    sort: productSortSchema.default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      query.minPrice <= query.maxPrice,
    { message: 'minPrice cannot be greater than maxPrice', path: ['minPrice'] },
  );

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ProductSort = z.infer<typeof productSortSchema>;
