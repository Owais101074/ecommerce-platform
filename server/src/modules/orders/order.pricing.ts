import type { OrderPricingDTO } from './order.types';

export const FREE_SHIPPING_THRESHOLD = 99_900;
export const STANDARD_SHIPPING_FEE = 4_900;
export const GST_PERCENT = 18;

/**
 * Product prices are tax-inclusive, so `tax` is the GST portion contained in
 * the discounted subtotal rather than an amount added on top of it.
 */
export function calculateOrderPricing(subtotal: number, discount = 0): OrderPricingDTO {
  const discountedSubtotal = Math.max(subtotal - discount, 0);
  const shipping =
    discountedSubtotal === 0 || discountedSubtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING_FEE;
  const tax = Math.round((discountedSubtotal * GST_PERCENT) / (100 + GST_PERCENT));

  return {
    subtotal,
    tax,
    shipping,
    discount,
    total: discountedSubtotal + shipping,
  };
}
