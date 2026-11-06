import { Schema, model } from 'mongoose';
import type { HydratedDocument, Types } from 'mongoose';

export interface ICartItem {
  productId: Types.ObjectId;
  quantity: number;
  priceAtAdd: number;
}

export interface ICart {
  userId: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },
    priceAtAdd: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Price must be an integer number of paise',
      },
    },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export type CartDocument = HydratedDocument<ICart>;

export const Cart = model<ICart>('Cart', cartSchema);
