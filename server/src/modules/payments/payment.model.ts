import { Schema, model } from 'mongoose';
import type { HydratedDocument, Types } from 'mongoose';
import type { PaymentMode, PaymentRecordStatus } from './payment.types';

export interface IPayment {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  provider: PaymentMode;
  providerOrderId: string;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentRecordStatus;
  failureReason: string | null;
  attempts: number;
  rawPayload: unknown;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: String,
      enum: ['mock', 'razorpay'],
      required: true,
    },
    providerOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    providerPaymentId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'Amount must be integer paise' },
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
    failureReason: {
      type: String,
      default: null,
    },
    attempts: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      validate: { validator: Number.isInteger, message: 'Attempts must be an integer' },
    },
    rawPayload: {
      type: Schema.Types.Mixed,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

paymentSchema.index({ userId: 1, createdAt: -1 });

export type PaymentDocument = HydratedDocument<IPayment>;

export const Payment = model<IPayment>('Payment', paymentSchema);
