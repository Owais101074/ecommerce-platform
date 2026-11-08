import type { ApiMeta, ApiSuccess } from '@/types/api';
import type { Category, Product, ProductList, ProductQuery } from '@/types/catalog';
import { http } from './http';

export interface ProductPage extends ProductList {
  meta: ApiMeta;
}

export async function fetchProducts(query: ProductQuery = {}): Promise<ProductPage> {
  const { data } = await http.get<ApiSuccess<ProductList>>('/products', { params: query });
  const products = data.data.products;

  return {
    products,
    meta: data.meta ?? {
      page: query.page ?? 1,
      limit: query.limit ?? products.length,
      total: products.length,
      totalPages: 1,
    },
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await http.get<ApiSuccess<{ categories: Category[] }>>('/categories');
  return data.data.categories;
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const { data } = await http.get<ApiSuccess<{ product: Product }>>(`/products/${slug}`);
  return data.data.product;
}

export async function fetchCategoryBySlug(slug: string): Promise<Category> {
  const { data } = await http.get<ApiSuccess<{ category: Category }>>(`/categories/${slug}`);
  return data.data.category;
}
