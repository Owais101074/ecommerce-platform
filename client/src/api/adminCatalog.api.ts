import type { ApiSuccess } from '@/types/api';
import type { Category, Product } from '@/types/catalog';
import { http } from './http';

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  images: string[];
  stock: number;
}

export interface CategoryInput {
  name: string;
  description?: string | null;
  parentId?: string | null;
}

export async function createProductRequest(input: ProductInput): Promise<Product> {
  const { data } = await http.post<ApiSuccess<{ product: Product }>>('/products', input);
  return data.data.product;
}

export async function updateProductRequest(
  id: string,
  input: Partial<ProductInput>,
): Promise<Product> {
  const { data } = await http.patch<ApiSuccess<{ product: Product }>>(`/products/${id}`, input);
  return data.data.product;
}

export async function deleteProductRequest(id: string): Promise<void> {
  await http.delete(`/products/${id}`);
}

export async function createCategoryRequest(input: CategoryInput): Promise<Category> {
  const { data } = await http.post<ApiSuccess<{ category: Category }>>('/categories', input);
  return data.data.category;
}

export async function updateCategoryRequest(
  id: string,
  input: Partial<CategoryInput>,
): Promise<Category> {
  const { data } = await http.patch<ApiSuccess<{ category: Category }>>(`/categories/${id}`, input);
  return data.data.category;
}

export async function deleteCategoryRequest(id: string): Promise<void> {
  await http.delete(`/categories/${id}`);
}
