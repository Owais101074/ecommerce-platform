import { randomBytes } from 'node:crypto';
import type { Types } from 'mongoose';
import { Address } from '../../src/modules/addresses/address.model';
import { Category } from '../../src/modules/categories/category.model';
import { Coupon } from '../../src/modules/coupons/coupon.model';
import { Product } from '../../src/modules/products/product.model';

function suffix(): string {
  return randomBytes(4).toString('hex');
}

export async function createCategory() {
  return Category.create({
    name: `Test Category ${suffix()}`,
    slug: `test-category-${suffix()}`,
    description: null,
  });
}

export async function createProduct(
  categoryId: Types.ObjectId,
  overrides: Partial<{ price: number; stock: number; name: string }> = {},
) {
  const name = overrides.name ?? `Test Product ${suffix()}`;

  return Product.create({
    name,
    slug: `test-product-${suffix()}`,
    description: 'A product created by the automated test suite.',
    price: overrides.price ?? 50_000,
    categoryId,
    images: [],
    stock: overrides.stock ?? 10,
  });
}

export async function createAddress(userId: string) {
  return Address.create({
    userId,
    label: 'Home',
    fullName: 'Test Customer',
    phone: '9876543210',
    line1: '12 Test Street',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440001',
    isDefault: true,
  });
}

export async function createCoupon(
  overrides: Partial<{
    code: string;
    description: string | null;
    type: 'percentage' | 'fixed';
    value: number;
    maxDiscount: number | null;
    maxUses: number | null;
    usedCount: number;
    startsAt: Date;
    expiresAt: Date | null;
    minOrder: number;
    isActive: boolean;
  }> = {},
) {
  return Coupon.create({
    code: `TEST${suffix().toUpperCase()}`,
    type: 'percentage',
    value: 10,
    maxDiscount: 5_000,
    minOrder: 0,
    maxUses: null,
    isActive: true,
    ...overrides,
  });
}
