import { Schema, model } from 'mongoose';
import type { HydratedDocument, Types } from 'mongoose';

export interface IAddress {
  userId: Types.ObjectId;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    line1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    line2: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

addressSchema.index({ userId: 1, createdAt: -1 });

export type AddressDocument = HydratedDocument<IAddress>;

export const Address = model<IAddress>('Address', addressSchema);
