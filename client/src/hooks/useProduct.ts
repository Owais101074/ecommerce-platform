import { useQuery } from '@tanstack/react-query';
import { fetchProductBySlug } from '@/api/catalog.api';

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: Boolean(slug),
  });
}
