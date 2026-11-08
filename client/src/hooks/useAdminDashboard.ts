import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/api/errors';
import {
  fetchAdminCustomer,
  fetchAdminCustomers,
  fetchAdminStats,
  updateAdminCustomerStatus,
  type AdminCustomerFilters,
} from '@/api/admin.api';
import { useToast } from '@/components/ui/toast-context';
import { useAuth } from '@/features/auth/useAuth';

export const adminStatsKey = ['admin', 'stats'] as const;

export const adminCustomerKeys = {
  all: ['admin', 'customers'] as const,
  lists: ['admin', 'customers', 'list'] as const,
  list: (filters: AdminCustomerFilters) =>
    [
      'admin',
      'customers',
      'list',
      filters.page ?? 1,
      filters.limit ?? 10,
      filters.search ?? '',
      filters.status ?? '',
    ] as const,
  detail: (id: string) => ['admin', 'customers', 'detail', id] as const,
};

export function useAdminStats() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: adminStatsKey,
    queryFn: fetchAdminStats,
    enabled: isAdmin,
    staleTime: 60_000,
  });
}

export function useAdminCustomers(filters: AdminCustomerFilters) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: adminCustomerKeys.list(filters),
    queryFn: () => fetchAdminCustomers(filters),
    enabled: isAdmin,
  });
}

export function useAdminCustomer(id: string | null) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: adminCustomerKeys.detail(id ?? ''),
    queryFn: () => fetchAdminCustomer(id as string),
    enabled: isAdmin && Boolean(id),
  });
}

export function useUpdateAdminCustomerStatus() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateAdminCustomerStatus(id, isActive),
    onSuccess: (customer) => {
      void queryClient.invalidateQueries({ queryKey: adminCustomerKeys.detail(customer.id) });
      void queryClient.invalidateQueries({ queryKey: adminCustomerKeys.lists });
      void queryClient.invalidateQueries({ queryKey: adminStatsKey });
      showToast(customer.isActive ? 'Customer reactivated' : 'Customer deactivated');
    },
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}
