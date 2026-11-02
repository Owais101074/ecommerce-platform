import type { ProductDocument } from './product.model';
import type { CategorySummary, ProductDTO } from './product.types';

export function toProductDTO(
  product: ProductDocument,
  category: CategorySummary | null,
): ProductDTO {
  return {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    stock: product.stock,
    images: product.images,
    rating: {
      average: product.ratingAvg,
      count: product.ratingCount,
    },
    category,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
