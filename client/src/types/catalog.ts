export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface Category extends CategorySummary {
  description: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children: Category[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  rating: {
    average: number;
    count: number;
  };
  category: CategorySummary | null;
  createdAt: string;
  updatedAt: string;
}

export type ProductSort = 'price_asc' | 'price_desc' | 'newest' | 'rating';

export interface ProductQuery {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

export interface ProductList {
  products: Product[];
}
