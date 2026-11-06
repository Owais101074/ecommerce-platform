import type { Product } from './catalog';

export interface CartItem {
  product: Product;
  quantity: number;
  priceAtAdd: number;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  currentSubtotal: number;
  priceChanged: boolean;
}
