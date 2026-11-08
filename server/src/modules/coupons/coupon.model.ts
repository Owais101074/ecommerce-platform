import { Schema, model } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import type { CouponType } from './coupon.types';

export interface ICoupon {
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  startsAt: Date;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    description: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'Coupon value must be an integer' },
    },
    minOrder: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: 'Minimum order must be integer paise' },
    },
    maxDiscount: {
      type: Number,
      default: null,
      min: 1,
      validate: {
        validator: (value: number | null) => value === null || Number.isInteger(value),
        message: 'Maximum discount must be integer paise',
      },
    },
    startsAt: {
      type: Date,
      default: () => new Date(),
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    maxUses: {
      type: Number,
      default: null,
      min: 1,
      validate: {
        validator: (value: number | null) => value === null || Number.isInteger(value),
        message: 'Maximum uses must be an integer',
      },
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: 'Used count must be an integer' },
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true },
);

couponSchema.index({ isActive: 1, expiresAt: 1 });

export type CouponDocument = HydratedDocument<ICoupon>;

export const Coupon = model<ICoupon>('Coupon', couponSchema);
