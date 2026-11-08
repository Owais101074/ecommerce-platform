import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/api/errors';
import {
  fetchAdminOrder,
  fetchAdminOrders,
  updateAdminOrderStatus,
  type AdminOrderFilters,
  type AdminStatusUpdate,
} from '@/api/adminOrder.api';
import { useToast } from '@/components/ui/toast-context';
import { useAuth } from '@/features/auth/useAuth';

export const adminOrderKeys = {
  all: ['admin', 'orders'] as const,
  lists: ['admin', 'orders', 'list'] as const,
  list: (filters: AdminOrderFilters) =>
    [
      'admin',
      'orders',
      'list',
      filters.page ?? 1,
      filters.limit ?? 10,
      filters.status ?? '',
      filters.userId ?? '',
    ] as const,
  detail: (id: string) => ['admin', 'orders', 'detail', id] as const,
};

export function useAdminOrders(filters: AdminOrderFilters) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: adminOrderKeys.list(filters),
    queryFn: () => fetchAdminOrders(filters),
    enabled: isAdmin,
  });
}

export function useAdminOrder(orderId: string) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: adminOrderKeys.detail(orderId),
    queryFn: () => fetchAdminOrder(orderId),
    enabled: isAdmin && Boolean(orderId),
  });
}

export function useUpdateAdminOrderStatus(orderId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: AdminStatusUpdate) => updateAdminOrderStatus(orderId, input),
    onSuccess: (result) => {
      queryClient.setQueryData(adminOrderKeys.detail(orderId), result.order);
      void queryClient.invalidateQueries({ queryKey: adminOrderKeys.lists });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['product'] });
      showToast(
        result.refundPending
          ? `Order ${result.order.orderNumber} cancelled. The refund is pending.`
          : `Order ${result.order.orderNumber} updated`,
        result.refundPending ? 'info' : 'success',
      );
    },
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}
