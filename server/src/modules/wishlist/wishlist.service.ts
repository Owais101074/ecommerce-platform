import { ApiError } from '../../utils/ApiError';
import { Product } from '../products/product.model';
import { loadProductDTOs } from '../products/product.service';
import type { ProductDTO } from '../products/product.types';
import { Wishlist } from './wishlist.model';

async function loadWishlistProducts(userId: string): Promise<ProductDTO[]> {
  const wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    return [];
  }

  const productsById = await loadProductDTOs(wishlist.productIds);

  return wishlist.productIds
    .map((productId) => productsById.get(productId.toString()))
    .filter((product): product is ProductDTO => product !== undefined);
}

export async function getWishlist(userId: string): Promise<ProductDTO[]> {
  return loadWishlistProducts(userId);
}

export async function addWishlistItem(userId: string, productId: string): Promise<ProductDTO[]> {
  const product = await Product.findOne({ _id: productId, isActive: true });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  await Wishlist.updateOne(
    { userId },
    { $addToSet: { productIds: product._id } },
    { upsert: true },
  );

  return loadWishlistProducts(userId);
}

export async function removeWishlistItem(userId: string, productId: string): Promise<ProductDTO[]> {
  await Wishlist.updateOne({ userId }, { $pull: { productIds: productId } });

  return loadWishlistProducts(userId);
}
