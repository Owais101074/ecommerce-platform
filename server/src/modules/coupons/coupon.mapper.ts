import type { CouponDocument } from './coupon.model';
import type { CouponDTO } from './coupon.types';

export function toCouponDTO(coupon: CouponDocument): CouponDTO {
  return {
    id: coupon._id.toString(),
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: coupon.value,
    minOrder: coupon.minOrder,
    maxDiscount: coupon.maxDiscount,
    startsAt: coupon.startsAt,
    expiresAt: coupon.expiresAt,
    maxUses: coupon.maxUses,
    usedCount: coupon.usedCount,
    isActive: coupon.isActive,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
  };
}
