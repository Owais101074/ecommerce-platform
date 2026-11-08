import type { ApiSuccess } from '@/types/api';
import type { Coupon, CouponInput, CouponList, CouponValidation } from '@/types/coupon';
import { http } from './http';

export interface AdminCouponFilters {
  page?: number;
  limit?: number;
  search?: string;
  active?: 'true' | 'false';
}

export async function validateCouponRequest(code: string): Promise<CouponValidation> {
  const { data } = await http.post<ApiSuccess<{ coupon: CouponValidation }>>('/coupons/validate', {
    code,
  });
  return data.data.coupon;
}

export async function fetchAdminCoupons(filters: AdminCouponFilters): Promise<CouponList> {
  const { data } = await http.get<ApiSuccess<{ coupons: Coupon[] }>>('/coupons', {
    params: filters,
  });
  const coupons = data.data.coupons;

  return {
    coupons,
    meta: data.meta ?? {
      page: filters.page ?? 1,
      limit: filters.limit ?? coupons.length,
      total: coupons.length,
      totalPages: 1,
    },
  };
}

export async function createCouponRequest(input: CouponInput): Promise<Coupon> {
  const { data } = await http.post<ApiSuccess<{ coupon: Coupon }>>('/coupons', input);
  return data.data.coupon;
}

export async function updateCouponRequest(
  id: string,
  input: Partial<CouponInput>,
): Promise<Coupon> {
  const { data } = await http.patch<ApiSuccess<{ coupon: Coupon }>>(`/coupons/${id}`, input);
  return data.data.coupon;
}

export async function deleteCouponRequest(id: string): Promise<void> {
  await http.delete(`/coupons/${id}`);
}
