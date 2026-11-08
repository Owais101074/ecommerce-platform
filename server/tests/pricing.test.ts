import { describe, expect, it } from 'vitest';
import { calculateOrderPricing } from '../src/modules/orders/order.pricing';

describe('calculateOrderPricing', () => {
  it('adds the standard shipping fee below the free-shipping threshold', () => {
    expect(calculateOrderPricing(50_000)).toEqual({
      subtotal: 50_000,
      tax: 7_627,
      shipping: 4_900,
      discount: 0,
      total: 54_900,
    });
  });

  it('ships free at the threshold and extracts the included GST', () => {
    expect(calculateOrderPricing(99_900)).toEqual({
      subtotal: 99_900,
      tax: 15_239,
      shipping: 0,
      discount: 0,
      total: 99_900,
    });
  });

  it('zeroes everything when a discount covers the whole cart', () => {
    expect(calculateOrderPricing(50_000, 50_000)).toEqual({
      subtotal: 50_000,
      tax: 0,
      shipping: 0,
      discount: 50_000,
      total: 0,
    });
  });

  it('charges shipping when a discount drops the order below the threshold', () => {
    expect(calculateOrderPricing(100_000, 1_000)).toEqual({
      subtotal: 100_000,
      tax: 15_102,
      shipping: 4_900,
      discount: 1_000,
      total: 103_900,
    });
  });
});
