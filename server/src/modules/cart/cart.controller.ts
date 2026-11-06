import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import * as cartService from './cart.service';
import type { AddCartItemInput, UpdateCartItemInput } from './cart.validation';

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  return req.user.id;
}

export async function get(req: Request, res: Response): Promise<void> {
  const cart = await cartService.getCart(currentUserId(req));
  sendSuccess(res, 200, 'Cart fetched', { cart });
}

export async function addItem(req: Request, res: Response): Promise<void> {
  const input = req.body as AddCartItemInput;
  const cart = await cartService.addCartItem(currentUserId(req), input.productId, input.quantity);
  sendSuccess(res, 200, 'Item added to cart', { cart });
}

export async function updateItem(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateCartItemInput;
  const cart = await cartService.updateCartItem(
    currentUserId(req),
    req.params.productId as string,
    input.quantity,
  );
  sendSuccess(res, 200, 'Cart updated', { cart });
}

export async function removeItem(req: Request, res: Response): Promise<void> {
  const cart = await cartService.removeCartItem(currentUserId(req), req.params.productId as string);
  sendSuccess(res, 200, 'Item removed from cart', { cart });
}

export async function clear(req: Request, res: Response): Promise<void> {
  const cart = await cartService.clearCart(currentUserId(req));
  sendSuccess(res, 200, 'Cart cleared', { cart });
}
