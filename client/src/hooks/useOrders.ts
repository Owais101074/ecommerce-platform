import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/api/errors';
import { fetchCheckoutQuote, fetchOrder, fetchOrders, placeOrderRequest } from '@/api/order.api';
import { useToast } from '@/components/ui/toast-context';
import { useAuth } from '@/features/auth/useAuth';
import { cartQueryKey } from '@/hooks/useCart';
import type { Order } from '@/types/order';

export const orderQueryKeys = {
  lists: ['orders', 'list'] as const,
  list: (page: number) => ['orders', 'list', page] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
};

export function useOrders(page = 1) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: orderQueryKeys.list(page),
    queryFn: () => fetchOrders(page),
    enabled: isAuthenticated,
  });
}

export function useOrder(orderId: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => fetchOrder(orderId),
    enabled: isAuthenticated && Boolean(orderId),
  });
}

export function useCheckoutQuote(enabled: boolean) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['checkout-quote'],
    queryFn: () => fetchCheckoutQuote(),
    enabled: isAuthenticated && enabled,
    retry: false,
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: { addressId: string; couponCode?: string }) => placeOrderRequest(input),
    onSuccess: (order: Order) => {
      queryClient.setQueryData(cartQueryKey, {
        items: [],
        itemCount: 0,
        subtotal: 0,
        currentSubtotal: 0,
        priceChanged: false,
      });
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['product'] });
      showToast(`Order ${order.orderNumber} placed`);
    },
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}
