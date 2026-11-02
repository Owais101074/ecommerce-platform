import type { CategoryDocument } from './category.model';
import type { CategoryDTO } from './category.types';

export function toCategoryDTO(category: CategoryDocument): CategoryDTO {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description,
    parentId: category.parentId ? category.parentId.toString() : null,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}
