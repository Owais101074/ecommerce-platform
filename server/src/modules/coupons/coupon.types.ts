export type CouponType = 'percentage' | 'fixed';

export interface CouponDTO {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  startsAt: Date;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponListResult {
  coupons: CouponDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CouponValidationResult {
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  discount: number;
}
