import { Schema, model } from 'mongoose';
import type { HydratedDocument, Types } from 'mongoose';

export interface ICategory {
  name: string;
  slug: string;
  description: string | null;
  parentId: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true },
);

categorySchema.index({ parentId: 1, isActive: 1 });

export type CategoryDocument = HydratedDocument<ICategory>;

export const Category = model<ICategory>('Category', categorySchema);
