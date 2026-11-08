import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { claimCoupon, releaseCoupon, resolveCoupon } from '../src/modules/coupons/coupon.service';
import { Coupon } from '../src/modules/coupons/coupon.model';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db';
import { createCoupon } from './helpers/factories';

beforeAll(connectTestDb);
beforeEach(clearTestDb);
afterAll(disconnectTestDb);

describe('resolveCoupon', () => {
  it('returns no discount when no code is supplied', async () => {
    await expect(resolveCoupon(undefined, 50_000)).resolves.toEqual({
      code: null,
      discount: 0,
    });
  });

  it('applies a percentage discount capped at maxDiscount', async () => {
    const coupon = await createCoupon({ type: 'percentage', value: 10, maxDiscount: 5_000 });

    await expect(resolveCoupon(coupon.code, 100_000)).resolves.toEqual({
      code: coupon.code,
      discount: 5_000,
    });
  });

  it('applies a percentage discount without a cap', async () => {
    const coupon = await createCoupon({ type: 'percentage', value: 10, maxDiscount: null });

    await expect(resolveCoupon(coupon.code, 30_000)).resolves.toEqual({
      code: coupon.code,
      discount: 3_000,
    });
  });

  it('never discounts more than the subtotal for a fixed coupon', async () => {
    const coupon = await createCoupon({ type: 'fixed', value: 60_000, maxDiscount: null });

    await expect(resolveCoupon(coupon.code, 50_000)).resolves.toEqual({
      code: coupon.code,
      discount: 50_000,
    });
  });

  it('rejects unknown codes', async () => {
    await expect(resolveCoupon('DOES-NOT-EXIST', 50_000)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects expired coupons', async () => {
    const coupon = await createCoupon({ expiresAt: new Date(Date.now() - 60_000) });

    await expect(resolveCoupon(coupon.code, 50_000)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects inactive coupons', async () => {
    const coupon = await createCoupon({ isActive: false });

    await expect(resolveCoupon(coupon.code, 50_000)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects coupons whose minimum order is not met', async () => {
    const coupon = await createCoupon({ minOrder: 60_000 });

    await expect(resolveCoupon(coupon.code, 50_000)).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe('claimCoupon', () => {
  it('refuses a second claim once maxUses is reached', async () => {
    const coupon = await createCoupon({ maxUses: 1 });

    await claimCoupon(coupon.code);
    await expect(claimCoupon(coupon.code)).rejects.toMatchObject({ statusCode: 409 });

    const stored = await Coupon.findById(coupon._id);
    expect(stored?.usedCount).toBe(1);
  });

  it('can be reclaimed after the claim is released', async () => {
    const coupon = await createCoupon({ maxUses: 1 });

    await claimCoupon(coupon.code);
    await releaseCoupon(coupon.code);
    await expect(claimCoupon(coupon.code)).resolves.toBeUndefined();

    const stored = await Coupon.findById(coupon._id);
    expect(stored?.usedCount).toBe(1);
  });

  it('rejects an expired coupon even though it is active', async () => {
    const coupon = await createCoupon({ expiresAt: new Date(Date.now() - 60_000) });

    await expect(claimCoupon(coupon.code)).rejects.toMatchObject({ statusCode: 409 });
  });
});
