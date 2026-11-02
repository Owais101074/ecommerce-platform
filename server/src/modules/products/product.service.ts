import type { QueryFilter, Types } from 'mongoose';
import { ApiError } from '../../utils/ApiError';
import { generateUniqueSlug } from '../../utils/slug';
import { Category } from '../categories/category.model';
import type { CategoryDocument } from '../categories/category.model';
import { toProductDTO } from './product.mapper';
import { Product } from './product.model';
import type { IProduct } from './product.model';
import type { CategorySummary, ProductListResult } from './product.types';
import type {
  CreateProductInput,
  ProductQuery,
  ProductSort,
  UpdateProductInput,
} from './product.validation';

const SORT_MAP: Record<ProductSort, Record<string, 1 | -1>> = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
  rating: { ratingAvg: -1 },
};

function toCategorySummary(category: CategoryDocument): CategorySummary {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
  };
}

async function findCategorySummary(categoryId: Types.ObjectId): Promise<CategorySummary | null> {
  const category = await Category.findById(categoryId).select('name slug');
  return category ? toCategorySummary(category) : null;
}

async function loadCategorySummaries(
  categoryIds: Types.ObjectId[],
): Promise<Map<string, CategorySummary>> {
  const summaries = new Map<string, CategorySummary>();

  if (categoryIds.length === 0) {
    return summaries;
  }

  const categories = await Category.find({ _id: { $in: categoryIds } }).select('name slug');

  for (const category of categories) {
    summaries.set(category._id.toString(), toCategorySummary(category));
  }

  return summaries;
}

export async function listProducts(query: ProductQuery): Promise<ProductListResult> {
  const filter: QueryFilter<IProduct> = { isActive: true };

  if (query.q) {
    filter.$text = { $search: query.q };
  }

  if (query.category) {
    const category = await Category.findOne({
      slug: query.category,
      isActive: true,
    }).select('_id');

    if (!category) {
      return {
        products: [],
        meta: { page: query.page, limit: query.limit, total: 0, totalPages: 0 },
      };
    }

    filter.categoryId = category._id;
  }

  const priceFilter: { $gte?: number; $lte?: number } = {};

  if (query.minPrice !== undefined) {
    priceFilter.$gte = query.minPrice;
  }

  if (query.maxPrice !== undefined) {
    priceFilter.$lte = query.maxPrice;
  }

  if (Object.keys(priceFilter).length > 0) {
    filter.price = priceFilter;
  }

  if (query.rating !== undefined) {
    filter.ratingAvg = { $gte: query.rating };
  }

  if (query.inStock === true) {
    filter.stock = { $gt: 0 };
  }

  const skip = (query.page - 1) * query.limit;
  const [products, total] = await Promise.all([
    Product.find(filter).sort(SORT_MAP[query.sort]).skip(skip).limit(query.limit),
    Product.countDocuments(filter),
  ]);

  const categories = await loadCategorySummaries(products.map((product) => product.categoryId));

  return {
    products: products.map((product) =>
      toProductDTO(product, categories.get(product.categoryId.toString()) ?? null),
    ),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getProductBySlug(slug: string) {
  const product = await Product.findOne({ slug, isActive: true });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const category = await findCategorySummary(product.categoryId);

  return toProductDTO(product, category);
}

export async function createProduct(input: CreateProductInput) {
  const category = await Category.findOne({ _id: input.categoryId, isActive: true });

  if (!category) {
    throw new ApiError(400, 'Category not found');
  }

  const slug = await generateUniqueSlug(
    input.name,
    async (candidate) => (await Product.exists({ slug: candidate })) !== null,
  );

  const product = await Product.create({
    name: input.name,
    slug,
    description: input.description,
    price: input.price,
    categoryId: category._id,
    images: input.images,
    stock: input.stock,
  });

  return toProductDTO(product, toCategorySummary(category));
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const product = await Product.findOne({ _id: id, isActive: true });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  let categorySummary: CategorySummary | null = null;

  if (input.categoryId !== undefined) {
    const category = await Category.findOne({ _id: input.categoryId, isActive: true });

    if (!category) {
      throw new ApiError(400, 'Category not found');
    }

    product.categoryId = category._id;
    categorySummary = toCategorySummary(category);
  }

  if (input.name !== undefined) {
    product.name = input.name;
    product.slug = await generateUniqueSlug(
      input.name,
      async (candidate) =>
        (await Product.exists({ slug: candidate, _id: { $ne: product._id } })) !== null,
    );
  }

  if (input.description !== undefined) {
    product.description = input.description;
  }

  if (input.price !== undefined) {
    product.price = input.price;
  }

  if (input.images !== undefined) {
    product.images = input.images;
  }

  if (input.stock !== undefined) {
    product.stock = input.stock;
  }

  await product.save();

  if (!categorySummary) {
    categorySummary = await findCategorySummary(product.categoryId);
  }

  return toProductDTO(product, categorySummary);
}

export async function deleteProduct(id: string): Promise<void> {
  const product = await Product.findOne({ _id: id, isActive: true });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  product.isActive = false;
  await product.save();
}

export async function updateStock(id: string, stock: number) {
  const product = await Product.findOne({ _id: id, isActive: true });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  product.stock = stock;
  await product.save();

  return toProductDTO(product, await findCategorySummary(product.categoryId));
}
