import { ApiError } from '../../utils/ApiError';
import * as cartService from '../cart/cart.service';
import { toCouponDTO } from './coupon.mapper';
import { Coupon } from './coupon.model';
import type { CouponDocument } from './coupon.model';
import type { CouponListResult, CouponValidationResult } from './coupon.types';
import type {
  AdminCouponListQuery,
  CreateCouponInput,
  UpdateCouponInput,
} from './coupon.validation';

export interface CouponResult {
  code: string | null;
  discount: number;
}

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function assertCouponUsable(coupon: CouponDocument, subtotal: number): void {
  const now = new Date();

  if (!coupon.isActive) {
    throw new ApiError(400, 'Coupon code is invalid or expired');
  }

  if (coupon.startsAt > now) {
    throw new ApiError(400, 'This coupon is not active yet');
  }

  if (coupon.expiresAt && coupon.expiresAt <= now) {
    throw new ApiError(400, 'This coupon has expired');
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new ApiError(400, 'This coupon has reached its usage limit');
  }

  if (subtotal < coupon.minOrder) {
    throw new ApiError(
      400,
      `Add ${formatRupees(coupon.minOrder - subtotal)} more to use this coupon`,
    );
  }
}

function computeDiscount(coupon: CouponDocument, subtotal: number): number {
  const raw =
    coupon.type === 'percentage' ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  const capped = coupon.maxDiscount !== null ? Math.min(raw, coupon.maxDiscount) : raw;

  return Math.min(capped, subtotal);
}

async function loadUsableCoupon(code: string, subtotal: number): Promise<CouponDocument> {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

  if (!coupon) {
    throw new ApiError(400, 'Coupon code is invalid or expired');
  }

  assertCouponUsable(coupon, subtotal);

  return coupon;
}

export async function resolveCoupon(
  code: string | undefined,
  subtotal: number,
): Promise<CouponResult> {
  if (!code) {
    return { code: null, discount: 0 };
  }

  const coupon = await loadUsableCoupon(code, subtotal);
  const discount = computeDiscount(coupon, subtotal);

  if (discount <= 0) {
    throw new ApiError(400, 'This coupon does not reduce your total');
  }

  return { code: coupon.code, discount };
}

export async function validateCoupon(
  userId: string,
  code: string,
): Promise<CouponValidationResult> {
  const cart = await cartService.getCart(userId);

  if (cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty');
  }

  const coupon = await loadUsableCoupon(code, cart.subtotal);
  const discount = computeDiscount(coupon, cart.subtotal);

  if (discount <= 0) {
    throw new ApiError(400, 'This coupon does not reduce your total');
  }

  return {
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: coupon.value,
    discount,
  };
}

/**
 * Claims one use with a single conditional update. MongoDB re-evaluates the
 * predicate per write, so two concurrent checkouts cannot exceed `maxUses`.
 */
export async function claimCoupon(code: string): Promise<void> {
  const now = new Date();
  const claimed = await Coupon.updateOne(
    {
      code,
      isActive: true,
      startsAt: { $lte: now },
      $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
        { $or: [{ maxUses: null }, { $expr: { $lt: ['$usedCount', '$maxUses'] } }] },
      ],
    },
    { $inc: { usedCount: 1 } },
  );

  if (claimed.modifiedCount === 0) {
    throw new ApiError(409, 'This coupon was just fully redeemed. Please review your cart.');
  }
}

export async function releaseCoupon(code: string): Promise<void> {
  await Coupon.updateOne({ code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listCoupons(query: AdminCouponListQuery): Promise<CouponListResult> {
  const filter: Record<string, unknown> = {};

  if (query.search) {
    filter.code = { $regex: escapeRegex(query.search.toUpperCase()) };
  }

  if (query.active !== undefined) {
    filter.isActive = query.active === 'true';
  }

  const skip = (query.page - 1) * query.limit;
  const [total, coupons] = await Promise.all([
    Coupon.countDocuments(filter),
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
  ]);

  return {
    coupons: coupons.map(toCouponDTO),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

export async function createCoupon(input: CreateCouponInput) {
  const exists = await Coupon.exists({ code: input.code });

  if (exists) {
    throw new ApiError(409, 'A coupon with this code already exists');
  }

  const coupon = await Coupon.create({
    code: input.code,
    description: input.description ?? null,
    type: input.type,
    value: input.value,
    minOrder: input.minOrder,
    maxDiscount: input.type === 'percentage' ? (input.maxDiscount ?? null) : null,
    startsAt: input.startsAt ?? new Date(),
    expiresAt: input.expiresAt ?? null,
    maxUses: input.maxUses ?? null,
    isActive: input.isActive ?? true,
  });

  return toCouponDTO(coupon);
}

export async function updateCoupon(id: string, input: UpdateCouponInput) {
  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }

  if (input.code && input.code !== coupon.code) {
    const exists = await Coupon.exists({ code: input.code, _id: { $ne: coupon._id } });

    if (exists) {
      throw new ApiError(409, 'A coupon with this code already exists');
    }

    coupon.code = input.code;
  }

  const nextType = input.type ?? coupon.type;
  const nextValue = input.value ?? coupon.value;

  if (nextType === 'percentage' && nextValue > 100) {
    throw new ApiError(400, 'Percentage coupons cannot exceed 100');
  }

  if (nextType === 'fixed' && nextValue < 100) {
    throw new ApiError(400, 'Fixed discount must be at least ₹1');
  }

  const nextStartsAt = input.startsAt ?? coupon.startsAt;
  const nextExpiresAt = input.expiresAt !== undefined ? input.expiresAt : coupon.expiresAt;

  if (nextExpiresAt && nextExpiresAt <= nextStartsAt) {
    throw new ApiError(400, 'Expiry must be after the start date');
  }

  coupon.type = nextType;
  coupon.value = nextValue;
  coupon.startsAt = nextStartsAt;
  coupon.expiresAt = nextExpiresAt;

  if (input.description !== undefined) {
    coupon.description = input.description || null;
  }

  if (input.minOrder !== undefined) {
    coupon.minOrder = input.minOrder;
  }

  if (input.maxDiscount !== undefined) {
    coupon.maxDiscount = nextType === 'percentage' ? input.maxDiscount : null;
  }

  if (input.maxUses !== undefined) {
    coupon.maxUses = input.maxUses;
  }

  if (input.isActive !== undefined) {
    coupon.isActive = input.isActive;
  }

  await coupon.save();

  return toCouponDTO(coupon);
}

export async function deleteCoupon(id: string): Promise<void> {
  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }

  coupon.isActive = false;
  await coupon.save();
}
