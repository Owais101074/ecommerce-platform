import { invalidateCatalogCache } from '../../infra/cache';
import { ApiError } from '../../utils/ApiError';
import { generateUniqueSlug } from '../../utils/slug';
import { Product } from '../products/product.model';
import { toCategoryDTO } from './category.mapper';
import { Category } from './category.model';
import type { CategoryDocument } from './category.model';
import type { CategoryNode } from './category.types';
import type { CreateCategoryInput, UpdateCategoryInput } from './category.validation';

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const query = excludeId ? { slug, _id: { $ne: excludeId } } : { slug };
  return (await Category.exists(query)) !== null;
}

async function assertParentIsUsable(
  parentId: string,
  categoryId?: string,
): Promise<CategoryDocument> {
  if (categoryId && parentId === categoryId) {
    throw new ApiError(400, 'Category cannot be its own parent');
  }

  const parent = await Category.findOne({ _id: parentId, isActive: true });

  if (!parent) {
    throw new ApiError(400, 'Parent category not found');
  }

  let ancestor: CategoryDocument | null = parent;
  let depth = 0;

  while (ancestor) {
    if (categoryId && ancestor._id.toString() === categoryId) {
      throw new ApiError(400, 'Category hierarchy cannot contain a cycle');
    }

    ancestor = ancestor.parentId ? await Category.findById(ancestor.parentId) : null;
    depth += 1;

    if (depth > 50) {
      throw new ApiError(400, 'Category hierarchy is too deep');
    }
  }

  return parent;
}

export async function listCategories(): Promise<CategoryNode[]> {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  const nodes = new Map<string, CategoryNode>();

  for (const category of categories) {
    const dto = toCategoryDTO(category);
    nodes.set(dto.id, { ...dto, children: [] });
  }

  const roots: CategoryNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryNode> {
  const category = await Category.findOne({ slug, isActive: true });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const dto = toCategoryDTO(category);

  return { ...dto, children: [] };
}

export async function createCategory(input: CreateCategoryInput): Promise<CategoryNode> {
  if (input.parentId) {
    await assertParentIsUsable(input.parentId);
  }

  const slug = await generateUniqueSlug(input.name, (candidate) => slugExists(candidate));
  const category = await Category.create({
    name: input.name,
    slug,
    description: input.description ?? null,
    parentId: input.parentId ?? null,
  });

  await invalidateCatalogCache();

  return { ...toCategoryDTO(category), children: [] };
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<CategoryNode> {
  const category = await Category.findOne({ _id: id, isActive: true });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  if (input.parentId !== undefined) {
    if (input.parentId === null) {
      category.parentId = null;
    } else {
      const parent = await assertParentIsUsable(input.parentId, id);
      category.parentId = parent._id;
    }
  }

  if (input.name !== undefined) {
    category.name = input.name;
    category.slug = await generateUniqueSlug(input.name, (candidate) => slugExists(candidate, id));
  }

  if (input.description !== undefined) {
    category.description = input.description || null;
  }

  await category.save();
  await invalidateCatalogCache();

  return { ...toCategoryDTO(category), children: [] };
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await Category.findOne({ _id: id, isActive: true });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const child = await Category.exists({ parentId: category._id, isActive: true });

  if (child) {
    throw new ApiError(409, 'Category has active subcategories');
  }

  const product = await Product.exists({ categoryId: category._id, isActive: true });

  if (product) {
    throw new ApiError(409, 'Category has active products');
  }

  category.isActive = false;
  await category.save();
  await invalidateCatalogCache();
}
