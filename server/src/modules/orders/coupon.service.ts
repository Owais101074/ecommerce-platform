import { ApiError } from '../../utils/ApiError';

export interface CouponResult {
  code: string | null;
  discount: number;
}

/**
 * Validation hook for Phase 7. The coupons collection and admin management
 * arrive in Phase 10; until then a supplied code is rejected explicitly.
 */
export async function resolveCoupon(
  code: string | undefined,
  _subtotal: number,
): Promise<CouponResult> {
  if (!code) {
    return { code: null, discount: 0 };
  }

  throw new ApiError(400, 'Coupon codes are not available yet');
}
