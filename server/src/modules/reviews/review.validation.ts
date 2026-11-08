import { z } from 'zod';

const ratingSchema = z
  .number()
  .int('Rating must be a whole number')
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating cannot exceed 5');

const commentSchema = z.string().trim().max(1000, 'Comment is too long');

export const createReviewSchema = z.object({
  rating: ratingSchema,
  comment: commentSchema.default(''),
});

export const updateReviewSchema = z
  .object({
    rating: ratingSchema.optional(),
    comment: commentSchema.optional(),
  })
  .refine((value) => value.rating !== undefined || value.comment !== undefined, {
    message: 'Provide a rating or a comment',
  });

export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;
