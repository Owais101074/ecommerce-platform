import type { ProductDTO } from '../products/product.types';

export interface CartItemDTO {
  product: ProductDTO;
  quantity: number;
  priceAtAdd: number;
  lineTotal: number;
}

export interface CartDTO {
  items: CartItemDTO[];
  itemCount: number;
  subtotal: number;
  currentSubtotal: number;
  priceChanged: boolean;
}
