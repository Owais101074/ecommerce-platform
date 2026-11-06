import type { ProductDTO } from '../products/product.types';
import type { CartDocument } from './cart.model';
import type { CartDTO, CartItemDTO } from './cart.types';

export const EMPTY_CART: CartDTO = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  currentSubtotal: 0,
  priceChanged: false,
};

export function toCartDTO(cart: CartDocument | null, products: Map<string, ProductDTO>): CartDTO {
  if (!cart || cart.items.length === 0) {
    return { ...EMPTY_CART, items: [] };
  }

  const items: CartItemDTO[] = [];
  let itemCount = 0;
  let subtotal = 0;
  let currentSubtotal = 0;

  for (const item of cart.items) {
    const product = products.get(item.productId.toString());

    if (!product) {
      continue;
    }

    const lineTotal = item.priceAtAdd * item.quantity;

    items.push({
      product,
      quantity: item.quantity,
      priceAtAdd: item.priceAtAdd,
      lineTotal,
    });

    itemCount += item.quantity;
    subtotal += lineTotal;
    currentSubtotal += product.price * item.quantity;
  }

  return {
    items,
    itemCount,
    subtotal,
    currentSubtotal,
    priceChanged: subtotal !== currentSubtotal,
  };
}
