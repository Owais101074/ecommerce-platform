export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface ProductDTO {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListResult {
  products: ProductDTO[];
  meta: ProductListMeta;
}
