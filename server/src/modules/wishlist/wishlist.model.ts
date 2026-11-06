import { Schema, model } from 'mongoose';
import type { HydratedDocument, Types } from 'mongoose';

export interface IWishlist {
  userId: Types.ObjectId;
  productIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    productIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
      default: [],
    },
  },
  { timestamps: true },
);

export type WishlistDocument = HydratedDocument<IWishlist>;

export const Wishlist = model<IWishlist>('Wishlist', wishlistSchema);
