import { Schema, model } from 'mongoose';
import type { HydratedDocument, Types } from 'mongoose';
import type { OrderStatus, PaymentStatus } from './order.types';

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface IOrderAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface IOrder {
  userId: Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  address: IOrderAddress;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, default: null },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'Price must be integer paise' },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'Quantity must be an integer' },
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'Line total must be integer paise' },
    },
  },
  { _id: false },
);

const orderAddressSchema = new Schema<IOrderAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: null },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    address: {
      type: orderAddressSchema,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'Subtotal must be integer paise' },
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'Tax must be integer paise' },
    },
    shipping: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'Shipping must be integer paise' },
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: { validator: Number.isInteger, message: 'Discount must be integer paise' },
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'Total must be integer paise' },
    },
    couponCode: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'placed',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, createdAt: -1 });

export type OrderDocument = HydratedDocument<IOrder>;

export const Order = model<IOrder>('Order', orderSchema);
