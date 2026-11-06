import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addWishlistItemRequest, fetchWishlist, removeWishlistItemRequest } from '@/api/cart.api';
import { getErrorMessage } from '@/api/errors';
import { useToast } from '@/components/ui/toast-context';
import { useAuth } from '@/features/auth/useAuth';
import type { Product } from '@/types/catalog';

export const wishlistQueryKey = ['wishlist'] as const;

export function useWishlist() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: wishlistQueryKey,
    queryFn: fetchWishlist,
    enabled: isAuthenticated,
  });
}

export function useWishlistCount(): number {
  return useWishlist().data?.length ?? 0;
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ product, saved }: { product: Product; saved: boolean }) =>
      saved ? removeWishlistItemRequest(product.id) : addWishlistItemRequest(product.id),
    onMutate: async ({ product, saved }) => {
      await queryClient.cancelQueries({ queryKey: wishlistQueryKey });
      const previous = queryClient.getQueryData<Product[]>(wishlistQueryKey);

      queryClient.setQueryData<Product[]>(wishlistQueryKey, (current = []) => {
        if (saved) {
          return current.filter((item) => item.id !== product.id);
        }

        return current.some((item) => item.id === product.id) ? current : [...current, product];
      });

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(wishlistQueryKey, context.previous);
      }

      showToast(getErrorMessage(error), 'error');
    },
    onSuccess: (products, variables) => {
      queryClient.setQueryData(wishlistQueryKey, products);
      showToast(variables.saved ? 'Removed from wishlist' : 'Saved to wishlist');
    },
  });
}
