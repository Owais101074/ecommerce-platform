import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/ApiResponse';
import { toReviewDTO } from './review.mapper';
import * as reviewService from './review.service';
import type { CreateReviewInput, ReviewListQuery, UpdateReviewInput } from './review.validation';

export async function listForProduct(req: Request, res: Response): Promise<void> {
  const result = await reviewService.listProductReviews(
    req.params.slug as string,
    req.validatedQuery as ReviewListQuery,
  );
  sendSuccess(
    res,
    200,
    'Reviews fetched',
    { reviews: result.reviews, summary: result.summary },
    result.meta,
  );
}

export async function create(req: Request, res: Response): Promise<void> {
  const review = await reviewService.createReview(
    req.user!.id,
    req.params.id as string,
    req.body as CreateReviewInput,
  );
  const author = await reviewService.getReviewAuthor(review);
  sendSuccess(res, 201, 'Review added', { review: toReviewDTO(review, author) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const review = await reviewService.updateReview(
    req.user!.id,
    req.params.id as string,
    req.body as UpdateReviewInput,
  );
  const author = await reviewService.getReviewAuthor(review);
  sendSuccess(res, 200, 'Review updated', { review: toReviewDTO(review, author) });
}
