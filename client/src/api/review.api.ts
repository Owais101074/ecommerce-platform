import type { ApiMeta, ApiSuccess } from '@/types/api';
import type { ProductReviewsData, Review } from '@/types/review';
import { http } from './http';

export interface ReviewPage extends ProductReviewsData {
  meta?: ApiMeta;
}

export async function fetchProductReviews(
  slug: string,
  page: number,
  limit = 5,
): Promise<ReviewPage> {
  const { data } = await http.get<ApiSuccess<ProductReviewsData>>(`/products/${slug}/reviews`, {
    params: { page, limit },
  });

  return { ...data.data, meta: data.meta };
}

export async function createReviewRequest(
  productId: string,
  payload: { rating: number; comment: string },
): Promise<Review> {
  const { data } = await http.post<ApiSuccess<{ review: Review }>>(
    `/products/${productId}/reviews`,
    payload,
  );
  return data.data.review;
}

export async function updateReviewRequest(
  reviewId: string,
  payload: { rating?: number; comment?: string },
): Promise<Review> {
  const { data } = await http.patch<ApiSuccess<{ review: Review }>>(
    `/reviews/${reviewId}`,
    payload,
  );
  return data.data.review;
}
