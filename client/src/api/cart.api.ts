import type { ApiSuccess } from '@/types/api';
import type { Cart } from '@/types/cart';
import type { Product } from '@/types/catalog';
import { http } from './http';

export async function fetchCart(): Promise<Cart> {
  const { data } = await http.get<ApiSuccess<{ cart: Cart }>>('/cart');
  return data.data.cart;
}

export async function addCartItemRequest(productId: string, quantity: number): Promise<Cart> {
  const { data } = await http.post<ApiSuccess<{ cart: Cart }>>('/cart/items', {
    productId,
    quantity,
  });
  return data.data.cart;
}

export async function updateCartItemRequest(productId: string, quantity: number): Promise<Cart> {
  const { data } = await http.patch<ApiSuccess<{ cart: Cart }>>(`/cart/items/${productId}`, {
    quantity,
  });
  return data.data.cart;
}

export async function removeCartItemRequest(productId: string): Promise<Cart> {
  const { data } = await http.delete<ApiSuccess<{ cart: Cart }>>(`/cart/items/${productId}`);
  return data.data.cart;
}

export async function clearCartRequest(): Promise<Cart> {
  const { data } = await http.delete<ApiSuccess<{ cart: Cart }>>('/cart');
  return data.data.cart;
}

export async function fetchWishlist(): Promise<Product[]> {
  const { data } = await http.get<ApiSuccess<{ products: Product[] }>>('/wishlist');
  return data.data.products;
}

export async function addWishlistItemRequest(productId: string): Promise<Product[]> {
  const { data } = await http.post<ApiSuccess<{ products: Product[] }>>(`/wishlist/${productId}`);
  return data.data.products;
}

export async function removeWishlistItemRequest(productId: string): Promise<Product[]> {
  const { data } = await http.delete<ApiSuccess<{ products: Product[] }>>(`/wishlist/${productId}`);
  return data.data.products;
}
