import { ApiError } from '../../utils/ApiError';
import { loadProductDTOs } from '../products/product.service';
import { Product } from '../products/product.model';
import { EMPTY_CART, toCartDTO } from './cart.mapper';
import { Cart } from './cart.model';
import type { CartDocument } from './cart.model';
import type { CartDTO } from './cart.types';
import { MAX_CART_QUANTITY } from './cart.validation';

async function buildCartDTO(cart: CartDocument | null): Promise<CartDTO> {
  if (!cart) {
    return { ...EMPTY_CART, items: [] };
  }

  const products = await loadProductDTOs(cart.items.map((item) => item.productId));

  return toCartDTO(cart, products);
}

export async function getCart(userId: string): Promise<CartDTO> {
  const cart = await Cart.findOne({ userId });
  return buildCartDTO(cart);
}

export async function addCartItem(
  userId: string,
  productId: string,
  quantity: number,
): Promise<CartDTO> {
  const product = await Product.findOne({ _id: productId, isActive: true });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.stock === 0) {
    throw new ApiError(409, 'This product is out of stock');
  }

  const cart = (await Cart.findOne({ userId })) ?? new Cart({ userId });
  const existingItem = cart.items.find((item) => item.productId.equals(product._id));
  const nextQuantity = (existingItem?.quantity ?? 0) + quantity;

  if (nextQuantity > MAX_CART_QUANTITY) {
    throw new ApiError(400, `You can add up to ${MAX_CART_QUANTITY} units of this product`);
  }

  if (nextQuantity > product.stock) {
    throw new ApiError(409, `Only ${product.stock} units are available`);
  }

  if (existingItem) {
    existingItem.quantity = nextQuantity;
  } else {
    cart.items.push({
      productId: product._id,
      quantity,
      priceAtAdd: product.price,
    });
  }

  await cart.save();

  return buildCartDTO(cart);
}

export async function updateCartItem(
  userId: string,
  productId: string,
  quantity: number,
): Promise<CartDTO> {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new ApiError(404, 'Your cart is empty');
  }

  const item = cart.items.find((entry) => entry.productId.toString() === productId);

  if (!item) {
    throw new ApiError(404, 'This item is not in your cart');
  }

  const product = await Product.findOne({ _id: item.productId, isActive: true });

  if (!product) {
    throw new ApiError(409, 'This product is no longer available');
  }

  if (quantity > product.stock) {
    throw new ApiError(409, `Only ${product.stock} units are available`);
  }

  item.quantity = quantity;
  await cart.save();

  return buildCartDTO(cart);
}

export async function removeCartItem(userId: string, productId: string): Promise<CartDTO> {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new ApiError(404, 'Your cart is empty');
  }

  const index = cart.items.findIndex((item) => item.productId.toString() === productId);

  if (index === -1) {
    throw new ApiError(404, 'This item is not in your cart');
  }

  cart.items.splice(index, 1);
  await cart.save();

  return buildCartDTO(cart);
}

export async function clearCart(userId: string): Promise<CartDTO> {
  const cart = await Cart.findOne({ userId });

  if (cart) {
    cart.items = [];
    await cart.save();
  }

  return { ...EMPTY_CART, items: [] };
}
