import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addCartItemRequest,
  clearCartRequest,
  fetchCart,
  removeCartItemRequest,
  updateCartItemRequest,
} from '@/api/cart.api';
import { getErrorMessage } from '@/api/errors';
import { useToast } from '@/components/ui/toast-context';
import { useAuth } from '@/features/auth/useAuth';
import type { Cart } from '@/types/cart';

export const cartQueryKey = ['cart'] as const;

export function useCart() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: cartQueryKey,
    queryFn: fetchCart,
    enabled: isAuthenticated,
  });
}

export function useCartCount(): number {
  return useCart().data?.itemCount ?? 0;
}

function useCartCache() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  function storeCart(cart: Cart): void {
    queryClient.setQueryData(cartQueryKey, cart);
  }

  function reportError(error: unknown): void {
    showToast(getErrorMessage(error), 'error');
  }

  return { storeCart, reportError };
}

export function useAddCartItem() {
  const { storeCart, reportError } = useCartCache();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      addCartItemRequest(productId, quantity),
    onSuccess: (cart) => {
      storeCart(cart);
      showToast('Added to cart');
    },
    onError: reportError,
  });
}

export function useUpdateCartItem() {
  const { storeCart, reportError } = useCartCache();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      updateCartItemRequest(productId, quantity),
    onSuccess: storeCart,
    onError: reportError,
  });
}

export function useRemoveCartItem() {
  const { storeCart, reportError } = useCartCache();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (productId: string) => removeCartItemRequest(productId),
    onSuccess: (cart) => {
      storeCart(cart);
      showToast('Removed from cart');
    },
    onError: reportError,
  });
}

export function useClearCart() {
  const { storeCart, reportError } = useCartCache();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: clearCartRequest,
    onSuccess: (cart) => {
      storeCart(cart);
      showToast('Cart cleared');
    },
    onError: reportError,
  });
}
