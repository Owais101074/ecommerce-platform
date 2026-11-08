import type { ReviewDocument } from './review.model';
import type { ReviewAuthor, ReviewDTO } from './review.types';

export function toReviewDTO(review: ReviewDocument, author: ReviewAuthor): ReviewDTO {
  return {
    id: review._id.toString(),
    rating: review.rating,
    comment: review.comment,
    author,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}
