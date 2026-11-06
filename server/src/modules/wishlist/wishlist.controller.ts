import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import * as wishlistService from './wishlist.service';

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  return req.user.id;
}

export async function list(req: Request, res: Response): Promise<void> {
  const products = await wishlistService.getWishlist(currentUserId(req));
  sendSuccess(res, 200, 'Wishlist fetched', { products });
}

export async function add(req: Request, res: Response): Promise<void> {
  const products = await wishlistService.addWishlistItem(
    currentUserId(req),
    req.params.productId as string,
  );
  sendSuccess(res, 200, 'Added to wishlist', { products });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const products = await wishlistService.removeWishlistItem(
    currentUserId(req),
    req.params.productId as string,
  );
  sendSuccess(res, 200, 'Removed from wishlist', { products });
}
