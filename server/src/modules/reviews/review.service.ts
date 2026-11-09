import type { Types } from 'mongoose';
import { invalidateProductCache } from '../../infra/cache';
import { ApiError } from '../../utils/ApiError';
import { User } from '../auth/auth.model';
import { Product } from '../products/product.model';
import type { ProductDocument } from '../products/product.model';
import { toReviewDTO } from './review.mapper';
import { Review } from './review.model';
import type { ReviewDocument } from './review.model';
import type { ReviewAuthor, ReviewListResult } from './review.types';
import type { CreateReviewInput, ReviewListQuery, UpdateReviewInput } from './review.validation';

interface RatingAggregate {
  average: number;
  count: number;
}

async function findActiveProductById(productId: string): Promise<ProductDocument> {
  const product = await Product.findOne({ _id: productId, isActive: true });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
}

async function findActiveProductBySlug(slug: string): Promise<ProductDocument> {
  const product = await Product.findOne({ slug, isActive: true });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
}

async function loadAuthorNames(ids: Types.ObjectId[]): Promise<Map<string, string>> {
  if (ids.length === 0) {
    return new Map();
  }

  const users = await User.find({ _id: { $in: ids } })
    .select('name')
    .lean();

  return new Map(users.map((user) => [user._id.toString(), user.name]));
}

async function loadAuthor(userId: string): Promise<ReviewAuthor> {
  const user = await User.findById(userId).select('name');
  return { id: userId, name: user?.name ?? 'Customer' };
}

/**
 * Ratings are stored on the product so catalogue lists and filters stay a
 * single query. Every review write refreshes the aggregate from the reviews
 * collection, which keeps it correct after edits.
 */
async function refreshProductRating(product: ProductDocument): Promise<void> {
  const [stats] = await Review.aggregate<RatingAggregate>([
    { $match: { productId: product._id } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  product.ratingAvg = stats ? Math.round(stats.average * 10) / 10 : 0;
  product.ratingCount = stats?.count ?? 0;
  await product.save();
  await invalidateProductCache();
}

export async function listProductReviews(
  slug: string,
  query: ReviewListQuery,
): Promise<ReviewListResult> {
  const product = await findActiveProductBySlug(slug);
  const filter = { productId: product._id };
  const skip = (query.page - 1) * query.limit;

  const [total, reviews] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
  ]);

  const authorIds = [...new Set(reviews.map((review) => review.userId))];
  const names = await loadAuthorNames(authorIds);

  return {
    reviews: reviews.map((review) =>
      toReviewDTO(review, {
        id: review.userId.toString(),
        name: names.get(review.userId.toString()) ?? 'Customer',
      }),
    ),
    summary: {
      average: product.ratingAvg,
      count: product.ratingCount,
    },
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}

export async function createReview(
  userId: string,
  productId: string,
  input: CreateReviewInput,
): Promise<ReviewDocument> {
  const product = await findActiveProductById(productId);
  const exists = await Review.exists({ userId, productId: product._id });

  if (exists) {
    throw new ApiError(409, 'You have already reviewed this product');
  }

  let review: ReviewDocument;

  try {
    review = await Review.create({
      userId,
      productId: product._id,
      rating: input.rating,
      comment: input.comment,
    });
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new ApiError(409, 'You have already reviewed this product');
    }

    throw error;
  }

  await refreshProductRating(product);

  return review;
}

export async function updateReview(
  userId: string,
  reviewId: string,
  input: UpdateReviewInput,
): Promise<ReviewDocument> {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  if (review.userId.toString() !== userId) {
    throw new ApiError(403, 'You can only edit your own review');
  }

  if (input.rating !== undefined) {
    review.rating = input.rating;
  }

  if (input.comment !== undefined) {
    review.comment = input.comment;
  }

  await review.save();

  const product = await Product.findById(review.productId);

  if (product) {
    await refreshProductRating(product);
  }

  return review;
}

export async function getReviewAuthor(review: ReviewDocument): Promise<ReviewAuthor> {
  return loadAuthor(review.userId.toString());
}
