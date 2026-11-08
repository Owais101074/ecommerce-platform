import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/api/errors';
import { createReviewRequest, fetchProductReviews, updateReviewRequest } from '@/api/review.api';
import { useToast } from '@/components/ui/toast-context';

export const reviewQueryKey = (slug: string) => ['reviews', slug] as const;

export function useProductReviews(slug: string, page: number) {
  return useQuery({
    queryKey: [...reviewQueryKey(slug), page],
    queryFn: () => fetchProductReviews(slug, page),
    enabled: Boolean(slug),
  });
}

export function useCreateReview(slug: string, productId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: { rating: number; comment: string }) =>
      createReviewRequest(productId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewQueryKey(slug) });
      void queryClient.invalidateQueries({ queryKey: ['product', slug] });
      showToast('Review published');
    },
    onError: (error) => showToast(getErrorMessage(error), 'error'),
  });
}

export function useUpdateReview(slug: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      reviewId,
      ...payload
    }: {
      reviewId: string;
      rating?: number;
      comment?: string;
    }) => updateReviewRequest(reviewId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewQueryKey(slug) });
      void queryClient.invalidateQueries({ queryKey: ['product', slug] });
      showToast('Review updated');
    },
    onError: (error) => showToast(getErrorMessage(error), 'error'),
  });
}
