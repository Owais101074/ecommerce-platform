import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCouponRequest,
  deleteCouponRequest,
  fetchAdminCoupons,
  updateCouponRequest,
  validateCouponRequest,
  type AdminCouponFilters,
} from '@/api/coupon.api';
import { getErrorMessage } from '@/api/errors';
import { useToast } from '@/components/ui/toast-context';
import { useAuth } from '@/features/auth/useAuth';
import type { CouponInput } from '@/types/coupon';
import { adminStatsKey } from './useAdminDashboard';

export const couponQueryKeys = {
  all: ['admin', 'coupons'] as const,
  list: (filters: AdminCouponFilters) =>
    [
      'admin',
      'coupons',
      'list',
      filters.page ?? 1,
      filters.limit ?? 10,
      filters.search ?? '',
      filters.active ?? '',
    ] as const,
};

export function useAdminCoupons(filters: AdminCouponFilters) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: couponQueryKeys.list(filters),
    queryFn: () => fetchAdminCoupons(filters),
    enabled: isAdmin,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: CouponInput) => createCouponRequest(input),
    onSuccess: (coupon) => {
      void queryClient.invalidateQueries({ queryKey: couponQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: adminStatsKey });
      showToast(`Coupon ${coupon.code} created`);
    },
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CouponInput> }) =>
      updateCouponRequest(id, input),
    onSuccess: (coupon) => {
      void queryClient.invalidateQueries({ queryKey: couponQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: adminStatsKey });
      void queryClient.invalidateQueries({ queryKey: ['checkout-quote'] });
      showToast(`Coupon ${coupon.code} updated`);
    },
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteCouponRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: couponQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: adminStatsKey });
      showToast('Coupon deactivated');
    },
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}

export function useValidateCoupon() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (code: string) => validateCouponRequest(code),
    onSuccess: (coupon) => {
      showToast(`Coupon ${coupon.code} applied`);
    },
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}
