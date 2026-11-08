export type CouponType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  startsAt: string;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponInput {
  code: string;
  description?: string | null;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscount?: number | null;
  startsAt?: string;
  expiresAt?: string | null;
  maxUses?: number | null;
  isActive?: boolean;
}

export interface CouponValidation {
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  discount: number;
}

export interface CouponList {
  coupons: Coupon[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
