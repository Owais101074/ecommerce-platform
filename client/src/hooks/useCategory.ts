import { useQuery } from '@tanstack/react-query';
import { fetchCategoryBySlug } from '@/api/catalog.api';

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: () => fetchCategoryBySlug(slug),
    enabled: Boolean(slug),
  });
}
